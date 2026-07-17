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
const auth_1 = require("../middleware/auth");
const tournament_1 = require("../utils/tournament");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Manuell KO-Phase oder Finale starten
router.post("/:id/progress", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tournament_1.progressTournament)(req.params.id);
    res.json({ success: true });
}));
// Aktuelle Platzierungen eines group_ko Turniers
router.get("/:id/standings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const tournament = yield prisma.tournament.findUnique({
        where: { id },
        include: { matches: true },
    });
    if (!tournament) {
        res.status(404).json({ error: "Turnier nicht gefunden" });
        return;
    }
    if (tournament.system !== "group_ko") {
        res.status(400).json({ error: "Nur f\u00fcr group_ko verf\u00fcgbar" });
        return;
    }
    const games = Array.from(new Set(tournament.matches.map((m) => m.gameId)));
    const result = games.map((gameId) => ({
        gameId,
        standings: (0, tournament_1.calculateGroupKoStandings)(tournament.matches.filter((m) => m.gameId === gameId)),
    }));
    res.json(result);
}));
exports.default = router;
