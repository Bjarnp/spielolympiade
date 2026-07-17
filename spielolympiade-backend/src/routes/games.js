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
// GET /games - list all games
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const games = yield prisma.game.findMany();
    res.json(games);
}));
router.post("/", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const rules = typeof req.body.rules === "string" ? req.body.rules.trim() || null : null;
    if (!name) {
        res.status(400).json({ error: "Name der Spielart ist erforderlich" });
        return;
    }
    const existing = yield prisma.game.findFirst({ where: { name } });
    if (existing) {
        res.status(409).json({ error: "Diese Spielart existiert bereits" });
        return;
    }
    const game = yield prisma.game.create({ data: { name, rules } });
    res.status(201).json(game);
}));
exports.default = router;
