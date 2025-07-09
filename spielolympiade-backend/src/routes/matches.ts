import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ GET /matches – alle Matches inkl. Teams, Spiel, Ergebnisse
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const matches = await prisma.match.findMany({
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
});

// ✅ GET /matches/:id – Match-Details
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const match = await prisma.match.findUnique({
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
});

// ✅ POST /matches – neues Match anlegen
router.post(
  "/",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { tournamentId, gameId, team1Id, team2Id, scheduledAt } = req.body;

    if (!tournamentId || !gameId || !team1Id || !team2Id) {
      res.status(400).json({ error: "Alle IDs erforderlich" });
      return;
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        gameId,
        team1Id,
        team2Id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    res.status(201).json(match);
  }
);

// ✅ POST /matches/:id/result – Ergebnis speichern
router.post(
  "/:id/result",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { team1Score, team2Score } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });

    if (!match) {
      res.status(404).json({ error: "Match nicht gefunden" });
      return;
    }

    const winnerId =
      team1Score > team2Score
        ? match.team1Id
        : team2Score > team1Score
        ? match.team2Id
        : null;

    const updatedMatch = await prisma.match.update({
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

    res.json(updatedMatch);
  }
);

// 📝 Ergebnis aktualisieren
router.put(
  "/:id/result",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { team1Score, team2Score } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });

    if (!match) {
      res.status(404).json({ error: "Match nicht gefunden" });
      return;
    }

    const winnerId =
      team1Score > team2Score
        ? match.team1Id
        : team2Score > team1Score
        ? match.team2Id
        : null;

    const updated = await prisma.match.update({
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

    res.json(updated);
  }
);

// ❌ Ergebnis löschen
router.delete(
  "/:id/result",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const match = await prisma.match.findUnique({ where: { id } });

    if (!match) {
      res.status(404).json({ error: "Match nicht gefunden" });
      return;
    }

    const cleared = await prisma.match.update({
      where: { id },
      data: {
        playedAt: null,
        winnerId: null,
        results: { deleteMany: {} },
      },
      include: { results: true },
    });

    res.json(cleared);
  }
);

export default router;
