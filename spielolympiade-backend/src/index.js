"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const teams_1 = __importDefault(require("./routes/teams"));
const matches_1 = __importDefault(require("./routes/matches"));
const seasons_1 = __importDefault(require("./routes/seasons"));
const games_1 = __importDefault(require("./routes/games"));
const tournaments_1 = __importDefault(require("./routes/tournaments"));
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/auth", auth_1.default);
app.use("/users", auth_2.authenticateToken, users_1.default);
app.use("/teams", auth_2.authenticateToken, teams_1.default);
app.use("/matches", auth_2.authenticateToken, matches_1.default);
app.use("/seasons", auth_2.authenticateToken, seasons_1.default);
app.use("/games", auth_2.authenticateToken, games_1.default);
app.use("/tournaments", auth_2.authenticateToken, tournaments_1.default);
// ✅ Typen explizit angeben
app.get("/", (req, res) => {
    res.send("✅ Spielolympiade Backend läuft!");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
