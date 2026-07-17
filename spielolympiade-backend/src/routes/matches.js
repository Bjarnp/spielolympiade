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
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const tournament_1 = require("../utils/tournament");
const router = express_1.default.Router();
function getUser(req) {
    return req.user;
}
const prisma = new client_1.PrismaClient();
// ✅ GET /matches – alle Matches inkl. Teams, Spiel, Ergebnisse
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const matches = yield prisma.match.findMany({
        include: {
            game: true,
            team1: true,
            team2: true,
            winner: true,
            results: true,
            tournament: { include: { season: true } },
        },
    });
    res.json(matches);
}));
// 🔮 GET /matches/recommendations – empfohlene nächste Spiele
router.get("/recommendations", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const season = yield prisma.season.findFirst({ where: { isActive: true } });
    if (!season) {
        res.json([]);
        return;
    }
    const all = yield prisma.match.findMany({
        where: { tournament: { seasonId: season.id } },
    });
    const lastPlayed = {};
    const inProgress = {};
    for (const m of all) {
        if (m.scheduledAt && !m.playedAt) {
            inProgress[m.gameId] = (inProgress[m.gameId] || 0) + 1;
        }
        const ref = (_a = m.playedAt) !== null && _a !== void 0 ? _a : m.scheduledAt;
        if (ref) {
            if (!lastPlayed[m.team1Id] || lastPlayed[m.team1Id] < ref)
                lastPlayed[m.team1Id] = ref;
            if (!lastPlayed[m.team2Id] || lastPlayed[m.team2Id] < ref)
                lastPlayed[m.team2Id] = ref;
        }
    }
    const open = all.filter((m) => !m.scheduledAt && !m.playedAt);
    const ranked = open
        .map((m) => {
        var _a, _b;
        const last1 = (_a = lastPlayed[m.team1Id]) !== null && _a !== void 0 ? _a : new Date(0);
        const last2 = (_b = lastPlayed[m.team2Id]) !== null && _b !== void 0 ? _b : new Date(0);
        const score = Math.max(last1.getTime(), last2.getTime());
        return { m, score };
    })
        .sort((a, b) => {
        const gameDiff = (inProgress[a.m.gameId] || 0) - (inProgress[b.m.gameId] || 0);
        if (gameDiff !== 0)
            return gameDiff;
        return a.score - b.score;
    })
        .map((r) => r.m);
    const simplified = ranked.map((m) => ({
        id: m.id,
        gameId: m.gameId,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
    }));
    res.json(simplified);
}));
// ▶️ POST /matches/:id/start – Spiel starten (für alle Nutzer)
router.post("/:id/start", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const match = yield prisma.match.update({
            where: { id },
            data: { scheduledAt: new Date() },
        });
        res.json(match);
    }
    catch (_a) {
        res.status(404).json({ error: "Match nicht gefunden" });
    }
}));
// ✅ GET /matches/:id – Match-Details
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const match = yield prisma.match.findUnique({
        where: { id },
        include: {
            game: true,
            team1: true,
            team2: true,
            winner: true,
            results: true,
            tournament: { include: { season: true } },
        },
    });
    if (!match) {
        res.status(404).json({ error: "Match nicht gefunden" });
        return;
    }
    res.json(match);
}));
// ✅ POST /matches – neues Match anlegen
router.post("/", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tournamentId, gameId, team1Id, team2Id, scheduledAt, stage, password } = req.body;
    if (!tournamentId || !gameId || !team1Id || !team2Id) {
        res.status(400).json({ error: "Alle IDs erforderlich" });
        return;
    }
    if (!password) {
        res.status(400).json({ error: "Passwort erforderlich" });
        return;
    }
    const userInfo = getUser(req);
    const user = yield prisma.user.findUnique({ where: { id: userInfo.id } });
    if (!user) {
        res.sendStatus(403);
        return;
    }
    const passwordHash = (0, crypto_1.createHash)("sha256").update(password).digest("hex");
    if (passwordHash !== user.passwordHash) {
        res.status(401).json({ error: "Passwort falsch" });
        return;
    }
    const match = yield prisma.match.create({
        data: {
            tournamentId,
            gameId,
            team1Id,
            team2Id,
            stage: stage || "extra",
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        },
        include: { results: true, game: true, team1: true, team2: true },
    });
    res.status(201).json(match);
}));
// ✅ POST /matches/:id/result – Ergebnis speichern
router.post("/:id/result", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { team1Score, team2Score } = req.body;
    const match = yield prisma.match.findUnique({ where: { id } });
    if (!match) {
        res.status(404).json({ error: "Match nicht gefunden" });
        return;
    }
    const winnerId = team1Score > team2Score
        ? match.team1Id
        : team2Score > team1Score
            ? match.team2Id
            : null;
    const updatedMatch = yield prisma.match.update({
        where: { id },
        data: {
            playedAt: new Date(),
            winnerId,
            results: {
                deleteMany: {}, // vorherige Ergebnisse löschen
                create: [
                    { teamId: match.team1Id, score: team1Score },
                    { teamId: match.team2Id, score: team2Score },
                ],
            },
        },
        include: { results: true, winner: true },
    });
    yield (0, tournament_1.progressTournament)(match.tournamentId);
    res.json(updatedMatch);
}));
// 📝 Ergebnis aktualisieren
router.put("/:id/result", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { team1Score, team2Score } = req.body;
    const match = yield prisma.match.findUnique({ where: { id } });
    if (!match) {
        res.status(404).json({ error: "Match nicht gefunden" });
        return;
    }
    const winnerId = team1Score > team2Score
        ? match.team1Id
        : team2Score > team1Score
            ? match.team2Id
            : null;
    const updated = yield prisma.match.update({
        where: { id },
        data: {
            winnerId,
            results: {
                deleteMany: {},
                create: [
                    { teamId: match.team1Id, score: team1Score },
                    { teamId: match.team2Id, score: team2Score },
                ],
            },
        },
        include: { results: true, winner: true },
    });
    yield (0, tournament_1.progressTournament)(match.tournamentId);
    res.json(updated);
}));
// ❌ Ergebnis löschen
router.delete("/:id/result", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const match = yield prisma.match.findUnique({ where: { id } });
    if (!match) {
        res.status(404).json({ error: "Match nicht gefunden" });
        return;
    }
    const cleared = yield prisma.match.update({
        where: { id },
        data: {
            playedAt: null,
            winnerId: null,
            results: { deleteMany: {} },
        },
        include: { results: true },
    });
    yield (0, tournament_1.progressTournament)(match.tournamentId);
    res.json(cleared);
}));
// ❌ Match löschen mit Passwort
router.delete("/:id", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { password } = req.body;
    const match = yield prisma.match.findUnique({ where: { id } });
    if (!match) {
        res.status(404).json({ error: "Match nicht gefunden" });
        return;
    }
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
    const hash = (0, crypto_1.createHash)("sha256").update(password || "").digest("hex");
    if (hash !== user.passwordHash) {
        res.status(401).json({ error: "Passwort falsch" });
        return;
    }
    yield prisma.matchResult.deleteMany({ where: { matchId: id } });
    yield prisma.match.delete({ where: { id } });
    yield (0, tournament_1.progressTournament)(match.tournamentId);
    res.json({ success: true });
}));
exports.default = router;
