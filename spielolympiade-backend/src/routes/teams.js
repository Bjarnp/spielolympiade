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
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 🔐 GET /teams – alle Teams mit Mitgliedern & Saison
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teams = yield prisma.team.findMany({
        include: {
            members: {
                include: { user: true },
            },
            season: true,
        },
    });
    res.json(teams);
}));
// 🔐 GET /teams/:id – einzelnes Team mit Spielern & Saison
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const team = yield prisma.team.findUnique({
        where: { id },
        include: {
            members: { include: { user: true } },
            season: true,
        },
    });
    if (!team) {
        res.status(404).json({ error: "Team nicht gefunden" });
        return;
    }
    res.json(team);
}));
// 🔐 POST /teams – neues Team erstellen (nur Admin)
router.post("/", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, seasonId, playerIds } = req.body;
    if (!name ||
        !seasonId ||
        !Array.isArray(playerIds) ||
        playerIds.length < 2) {
        res
            .status(400)
            .json({
            error: "Name, seasonId und mindestens 2 Spieler erforderlich",
        });
        return;
    }
    const team = yield prisma.team.create({
        data: {
            name,
            seasonId,
            members: {
                create: playerIds.map((userId) => ({ userId })),
            },
        },
        include: {
            members: { include: { user: true } },
            season: true,
        },
    });
    res.status(201).json(team);
}));
exports.default = router;
