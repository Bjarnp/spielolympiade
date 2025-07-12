import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authorizeRole } from "../middleware/auth";
import { progressTournament, calculateGroupKoStandings } from "../utils/tournament";

const router = express.Router();
const prisma = new PrismaClient();

// Manuell KO-Phase oder Finale starten
router.post(
  "/:id/progress",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    await progressTournament(req.params.id);
    res.json({ success: true });
  }
);

// Aktuelle Platzierungen eines group_ko Turniers
router.get(
  "/:id/standings",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
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

    const games = Array.from(new Set(tournament.matches.map((m) => m.gameId))) as string[];
    const result = games.map((gameId) => ({
      gameId,
      standings: calculateGroupKoStandings(
        tournament.matches.filter((m) => m.gameId === gameId)
      ),
    }));

    res.json(result);
  }
);

export default router;
