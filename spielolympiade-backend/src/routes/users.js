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
const crypto_1 = require("crypto");
const auth_1 = require("../middleware/auth");
const DEFAULT_PASSWORD = "changeme";
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 🔐 User aus JWT holen
function getUser(req) {
    return req.user;
}
// ✅ GET /users/me
router.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = getUser(req);
    const user = yield prisma.user.findUnique({ where: { username } });
    if (!user) {
        res.status(404).json({ error: "Nicht gefunden" });
        return;
    }
    res.json(user);
}));
// ✅ GET /users/my-team
router.get("/my-team", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { username } = getUser(req);
    const user = yield prisma.user.findUnique({
        where: { username },
        include: {
            teamMemberships: {
                where: {
                    team: {
                        season: {
                            isActive: true,
                        },
                    },
                },
                include: {
                    team: {
                        include: {
                            members: {
                                include: { user: true },
                            },
                            season: true,
                        },
                    },
                },
            },
        },
    });
    const latestTeam = (_a = user === null || user === void 0 ? void 0 : user.teamMemberships[0]) === null || _a === void 0 ? void 0 : _a.team;
    if (!latestTeam) {
        res.status(404).json({ error: "Kein Team gefunden" });
        return;
    }
    res.json({
        id: latestTeam.id,
        name: latestTeam.name,
        season: latestTeam.season.name,
        seasonId: latestTeam.season.id,
        members: latestTeam.members.map((m) => m.user.name),
    });
}));
// ✅ GET /users/my-matches
router.get("/my-matches", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { username } = getUser(req);
    const user = yield prisma.user.findUnique({
        where: { username },
        include: {
            teamMemberships: true,
        },
    });
    const teamId = (_a = user === null || user === void 0 ? void 0 : user.teamMemberships[0]) === null || _a === void 0 ? void 0 : _a.teamId;
    if (!teamId) {
        res.status(404).json({ error: "Kein Team gefunden" });
        return;
    }
    const matches = yield prisma.match.findMany({
        where: {
            OR: [{ team1Id: teamId }, { team2Id: teamId }],
        },
        include: {
            game: true,
            results: true,
            tournament: {
                include: { season: true },
            },
        },
    });
    res.json(matches);
}));
// ----- Admin: Benutzer verwalten -----
// Alle Nutzer auflisten
router.get("/", (0, auth_1.authorizeRole)("admin"), (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({ orderBy: { username: "asc" } });
    res.json(users);
}));
// Neuen Nutzer anlegen
router.post("/", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password, role } = req.body;
    if (!name || !username) {
        res.status(400).json({ error: "name und username erforderlich" });
        return;
    }
    const pw = password || DEFAULT_PASSWORD;
    const hash = (0, crypto_1.createHash)("sha256").update(pw).digest("hex");
    const user = yield prisma.user.create({
        data: {
            name,
            username,
            passwordHash: hash,
            role: role || "player",
            mustChangePassword: password ? false : true,
        },
    });
    res.status(201).json(user);
}));
// Nutzer aktualisieren
router.put("/:id", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, username, password, role } = req.body;
    const data = {};
    if (name)
        data.name = name;
    if (username)
        data.username = username;
    if (role)
        data.role = role;
    if (password) {
        data.passwordHash = (0, crypto_1.createHash)("sha256").update(password).digest("hex");
        data.mustChangePassword = false;
    }
    try {
        const user = yield prisma.user.update({ where: { id }, data });
        res.json(user);
    }
    catch (_a) {
        res.status(404).json({ error: "User nicht gefunden" });
    }
}));
// Nutzer löschen
router.delete("/:id", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.user.delete({ where: { id } });
        res.sendStatus(204);
    }
    catch (_a) {
        res.status(404).json({ error: "User nicht gefunden" });
    }
}));
// Passwort des eingeloggten Nutzers ändern
router.post("/change-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = getUser(req);
    const { password } = req.body;
    if (!password) {
        res.status(400).json({ error: "password erforderlich" });
        return;
    }
    const hash = (0, crypto_1.createHash)("sha256").update(password).digest("hex");
    yield prisma.user.update({
        where: { id },
        data: { passwordHash: hash, mustChangePassword: false },
    });
    res.sendStatus(204);
}));
// Passwort eines Nutzers zurücksetzen
router.post("/:id/reset-password", (0, auth_1.authorizeRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const hash = (0, crypto_1.createHash)("sha256").update(DEFAULT_PASSWORD).digest("hex");
    try {
        yield prisma.user.update({
            where: { id },
            data: { passwordHash: hash, mustChangePassword: true },
        });
        res.sendStatus(204);
    }
    catch (_a) {
        res.status(404).json({ error: "User nicht gefunden" });
    }
}));
exports.default = router;
