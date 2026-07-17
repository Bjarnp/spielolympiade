"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const history_core_1 = require("../utils/history-core");
const crypto_1 = require("crypto");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
function getUser(req) {
    return req.user;
}
// ✅ GET /seasons – alle Saisons abrufen
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const seasons = yield prisma.season.findMany({
        orderBy: { year: "desc" },
    });
    res.json(seasons);
}));
router.get("/public/dashboard-data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const season = yield prisma.season.findFirst({
            where: { isActive: true },
        });
        if (!season) {
            res.json({ season: null, teams: [], games: [], tournament: null });
            return;
        }
        const teams = yield prisma.team.findMany({
            where: { seasonId: season.id },
        });
        const games = yield prisma.game.findMany();
        const tournament = yield prisma.tournament.findFirst({
            where: { seasonId: season.id },
            include: { matches: { include: { results: true } } },
        });
        res.json({ season, teams, games, tournament });
    }
    catch (err) {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
}));
// ✅ GET /seasons/:id – einzelne Saison inkl. Teams & Turniere
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const season = yield prisma.season.findUnique({
        where: { id },
        include: {
            teams: {
                include: {
                    members: { include: { user: true } },
                },
            },
            tournaments: true,
        },
    });
    if (!season) {
        res.status(404).json({ error: "Saison nicht gefunden" });
        return;
    }
    res.json(season);
}));
// 📜 GET /seasons/:id/history – Saison mit Matches & Ergebnissen
router.get("/:id/history", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const season = yield prisma.season.findUnique({
        where: { id },
        include: {
            teams: {
                include: { members: { include: { user: true } } },
            },
            tournaments: {
                include: {
                    matches: {
                        include: {
                            game: true,
                            results: true,
                            winner: true,
                            team1: true,
                            team2: true,
                        },
                    },
                },
            },
        },
    });
    if (!season) {
        res.status(404).json({ error: "Saison nicht gefunden" });
        return;
    }
    res.json(season);
}));
// 🏆 GET /seasons/:id/table – Saison-Tabelle berechnen
router.get("/:id/table", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const season = yield prisma.season.findUnique({
        where: { id },
        include: {
            teams: {
                include: { members: { include: { user: true } } },
            },
            tournaments: {
                include: {
                    matches: {
                        include: {
                            game: true,
                            results: true,
                            winner: true,
                            team1: true,
                            team2: true,
                        },
                    },
                },
            },
        },
    });
    if (!season) {
        res.status(404).json({ error: "Saison nicht gefunden" });
        return;
    }
    const seasonDetail = (0, history_core_1.buildSeasonDetail)(season);
    const table = seasonDetail.overallStandings.map((standing) => ({
        teamId: standing.teamId,
        name: standing.teamName,
        spiele: standing.games,
        siege: standing.wins,
        niederlagen: standing.losses,
        points: standing.points,
        rank: standing.rank,
    }));
    res.json(table);
}));
// ✅ POST /seasons – neue Saison anlegen (admin only)
router.post("/", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, name } = req.body;
    if (!year || !name) {
        res.status(400).json({ error: "year und name erforderlich" });
        return;
    }
    const existing = yield prisma.season.findFirst({ where: { year } });
    if (existing) {
        res
            .status(400)
            .json({ error: "Saison mit diesem Jahr existiert bereits" });
        return;
    }
    const season = yield prisma.season.create({
        data: { year, name },
    });
    res.status(201).json(season);
}));
// 🌟 POST /seasons/start – vereinfachter Start einer Saison
router.post("/start", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, name } = req.body;
    if (!year || !name) {
        res.status(400).json({ error: "year und name erforderlich" });
        return;
    }
    const exists = yield prisma.season.findFirst({ where: { year } });
    if (exists) {
        res.status(400).json({ error: "Saison existiert bereits" });
        return;
    }
    const season = yield prisma.season.create({
        data: { year, name, isActive: true },
    });
    yield prisma.tournament.create({
        data: { seasonId: season.id, system: "round_robin" },
    });
    res.status(201).json(season);
}));
// 🏁 POST /seasons/setup – Saison inkl. Teams & Matches anlegen
router.post("/setup", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, name, teams, gameIds, system } = req.body;
    if (!year ||
        !name ||
        !Array.isArray(teams) ||
        teams.length === 0 ||
        !Array.isArray(gameIds) ||
        gameIds.length === 0) {
        res
            .status(400)
            .json({ error: "year, name, teams und gameIds erforderlich" });
        return;
    }
    const exists = yield prisma.season.findFirst({ where: { year } });
    if (exists) {
        res.status(400).json({ error: "Saison existiert bereits" });
        return;
    }
    const season = yield prisma.season.create({
        data: { year, name, isActive: true },
    });
    const tournament = yield prisma.tournament.create({
        data: { seasonId: season.id, system: system || "round_robin" },
    });
    const createdTeams = [];
    for (const t of teams) {
        const team = yield prisma.team.create({
            data: { name: t.name, seasonId: season.id },
        });
        createdTeams.push(team);
        for (const userId of t.playerIds) {
            yield prisma.teamMember.create({ data: { teamId: team.id, userId } });
        }
    }
    if (system === "round_robin" || !system) {
        for (const gameId of gameIds) {
            for (let i = 0; i < createdTeams.length; i++) {
                for (let j = i + 1; j < createdTeams.length; j++) {
                    yield prisma.match.create({
                        data: {
                            tournamentId: tournament.id,
                            gameId,
                            team1Id: createdTeams[i].id,
                            team2Id: createdTeams[j].id,
                        },
                    });
                }
            }
        }
    }
    else if (system === "group_ko") {
        for (const gameId of gameIds) {
            const shuffled = [...createdTeams].sort(() => Math.random() - 0.5);
            const mid = Math.ceil(shuffled.length / 2);
            const groups = {
                A: shuffled.slice(0, mid),
                B: shuffled.slice(mid),
            };
            for (const [groupName, groupTeams] of Object.entries(groups)) {
                for (let i = 0; i < groupTeams.length; i++) {
                    for (let j = i + 1; j < groupTeams.length; j++) {
                        yield prisma.match.create({
                            data: {
                                tournamentId: tournament.id,
                                gameId,
                                team1Id: groupTeams[i].id,
                                team2Id: groupTeams[j].id,
                                stage: "group",
                                groupName,
                            },
                        });
                    }
                }
            }
        }
    }
    yield prisma.season.updateMany({
        where: { id: { not: season.id }, isActive: true },
        data: { isActive: false },
    });
    res.status(201).json(season);
}));
// ✅ Saison beenden (Admin-Passwort prüfen)
router.post("/:id/finish", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { password } = req.body;
    const userInfo = getUser(req);
    if (!userInfo) {
        res.sendStatus(403);
        return;
    }
    const user = yield prisma.user.findUnique({ where: { id: userInfo.id } });
    if (!user) {
        res.sendStatus(403);
        return;
    }
    const hash = (0, crypto_1.createHash)("sha256")
        .update(password || "")
        .digest("hex");
    if (hash !== user.passwordHash) {
        res.status(401).json({ error: "Passwort falsch" });
        return;
    }
    const season = yield prisma.season.update({
        where: { id },
        data: { finishedAt: new Date(), isActive: false },
    });
    res.json(season);
}));
// ❌ Saison löschen
router.delete("/:id", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { password } = req.body;
    const userInfo = getUser(req);
    if (!userInfo) {
        res.sendStatus(403);
        return;
    }
    const user = yield prisma.user.findUnique({ where: { id: userInfo.id } });
    if (!user) {
        res.sendStatus(403);
        return;
    }
    const hash = (0, crypto_1.createHash)("sha256")
        .update(password || "")
        .digest("hex");
    if (hash !== user.passwordHash) {
        res.status(401).json({ error: "Passwort falsch" });
        return;
    }
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.matchResult.deleteMany({
            where: { match: { tournament: { seasonId: id } } },
        });
        yield tx.match.deleteMany({
            where: { tournament: { seasonId: id } },
        });
        yield tx.teamMember.deleteMany({
            where: { team: { seasonId: id } },
        });
        yield tx.team.deleteMany({ where: { seasonId: id } });
        yield tx.tournament.deleteMany({ where: { seasonId: id } });
        yield tx.season.delete({ where: { id } });
    }));
    res.json({ success: true });
}));
exports.default = router;
