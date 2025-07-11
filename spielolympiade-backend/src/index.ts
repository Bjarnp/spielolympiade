import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import teamRoutes from "./routes/teams";
import matchRoutes from "./routes/matches";
import seasonRoutes from "./routes/seasons";
import gameRoutes from "./routes/games";
import tournamentRoutes from "./routes/tournaments";
import { authenticateToken } from "./middleware/auth";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", authenticateToken, userRoutes);
app.use("/teams", authenticateToken, teamRoutes);
app.use("/matches", authenticateToken, matchRoutes);
app.use("/seasons", authenticateToken, seasonRoutes);
app.use("/games", authenticateToken, gameRoutes);
app.use("/tournaments", authenticateToken, tournamentRoutes);

// ✅ Typen explizit angeben
app.get("/", (req: Request, res: Response): void => {
  res.send("✅ Spielolympiade Backend läuft!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
