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
    const playedByTeam = {};
    const playedByGame = {};
    for (const m of all) {
        if (m.scheduledAt && !m.playedAt) {
            inProgress[m.gameId] = (inProgress[m.gameId] || 0) + 1;
        }
        if (m.playedAt || m.winnerId) {
            playedByTeam[m.team1Id] = (playedByTeam[m.team1Id] || 0) + 1;
            playedByTeam[m.team2Id] = (playedByTeam[m.team2Id] || 0) + 1;
            playedByGame[m.gameId] = (playedByGame[m.gameId] || 0) + 1;
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
    const remaining = [...open];
    const selected = [];
    const alreadySuggested = new Set();
    while (remaining.length && selected.length < 5) {
        remaining.sort((a, b) => {
            var _a, _b, _c, _d;
            const aConflict = Number(alreadySuggested.has(a.team1Id)) + Number(alreadySuggested.has(a.team2Id));
            const bConflict = Number(alreadySuggested.has(b.team1Id)) + Number(alreadySuggested.has(b.team2Id));
            if (aConflict !== bConflict)
                return aConflict - bConflict;
            const aLoad = Math.max(playedByTeam[a.team1Id] || 0, playedByTeam[a.team2Id] || 0);
            const bLoad = Math.max(playedByTeam[b.team1Id] || 0, playedByTeam[b.team2Id] || 0);
            if (aLoad !== bLoad)
                return aLoad - bLoad;
            const gameDiff = (playedByGame[a.gameId] || 0) + (inProgress[a.gameId] || 0) -
                (playedByGame[b.gameId] || 0) - (inProgress[b.gameId] || 0);
            if (gameDiff !== 0)
                return gameDiff;
            const aRest = Math.max(((_a = lastPlayed[a.team1Id]) === null || _a === void 0 ? void 0 : _a.getTime()) || 0, ((_b = lastPlayed[a.team2Id]) === null || _b === void 0 ? void 0 : _b.getTime()) || 0);
            const bRest = Math.max(((_c = lastPlayed[b.team1Id]) === null || _c === void 0 ? void 0 : _c.getTime()) || 0, ((_d = lastPlayed[b.team2Id]) === null || _d === void 0 ? void 0 : _d.getTime()) || 0);
            if (aRest !== bRest)
                return aRest - bRest;
            return a.id.localeCompare(b.id);
        });
        const next = remaining.shift();
        selected.push(next);
        alreadySuggested.add(next.team1Id);
        alreadySuggested.add(next.team2Id);
    }
    const simplified = selected.map((m) => ({
        id: m.id,
        gameId: m.gameId,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        reason: !lastPlayed[m.team1Id] && !lastPlayed[m.team2Id]
            ? "Beide Teams sind noch nicht angetreten"
            : "Faire Rotation nach Spielen und Pausen",
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
