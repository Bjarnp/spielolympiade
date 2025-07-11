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

// 🔮 GET /matches/recommendations – empfohlene nächste Spiele
router.get(
  "/recommendations",
  async (_req: Request, res: Response): Promise<void> => {
    const all = await prisma.match.findMany();

    const lastPlayed: Record<string, Date> = {};
    const inProgress: Record<string, number> = {};

    for (const m of all) {
      if (m.scheduledAt && !m.playedAt) {
        inProgress[m.gameId] = (inProgress[m.gameId] || 0) + 1;
      }
      const ref = m.playedAt ?? m.scheduledAt;
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
        const last1 = lastPlayed[m.team1Id] ?? new Date(0);
        const last2 = lastPlayed[m.team2Id] ?? new Date(0);
        const score = Math.max(last1.getTime(), last2.getTime());
        return { m, score };
      })
      .sort((a, b) => {
        const gameDiff =
          (inProgress[a.m.gameId] || 0) - (inProgress[b.m.gameId] || 0);
        if (gameDiff !== 0) return gameDiff;
        return a.score - b.score;
      })
      .map((r) => r.m);

  res.json(ranked);
  }
);

// ▶️ POST /matches/:id/start – Spiel starten (für alle Nutzer)
router.post(
  "/:id/start",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const match = await prisma.match.update({
        where: { id },
        data: { scheduledAt: new Date() },
      });
      res.json(match);
    } catch {
      res.status(404).json({ error: "Match nicht gefunden" });
    }
  }
);

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
