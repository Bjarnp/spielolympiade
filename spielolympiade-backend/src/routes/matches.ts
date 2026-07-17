import express, { Request, Response } from "express";
import { createHash } from "crypto";
import { MatchStage } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authorizeRole } from "../middleware/auth";

import { progressTournament } from "../utils/tournament";

const router = express.Router();
function getUser(req: Request) {
  return (req as any).user;
}


// ✅ GET /matches – alle Matches inkl. Teams, Spiel, Ergebnisse
router.get("/", async (_req: Request, res: Response): Promise<void> => {
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
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) {
      res.json([]);
      return;
    }

    const all = await prisma.match.findMany({
      where: { tournament: { seasonId: season.id } },
    });

    const lastPlayed: Record<string, Date> = {};
    const inProgress: Record<string, number> = {};
    const playedByTeam: Record<string, number> = {};
    const playedByGame: Record<string, number> = {};

    for (const m of all) {
      if (m.scheduledAt && !m.playedAt) {
        inProgress[m.gameId] = (inProgress[m.gameId] || 0) + 1;
      }
      if (m.playedAt || m.winnerId) {
        playedByTeam[m.team1Id] = (playedByTeam[m.team1Id] || 0) + 1;
        playedByTeam[m.team2Id] = (playedByTeam[m.team2Id] || 0) + 1;
        playedByGame[m.gameId] = (playedByGame[m.gameId] || 0) + 1;
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

    const remaining = [...open];
    const selected: typeof open = [];
    const alreadySuggested = new Set<string>();

    while (remaining.length && selected.length < 5) {
      remaining.sort((a, b) => {
        const aConflict = Number(alreadySuggested.has(a.team1Id)) + Number(alreadySuggested.has(a.team2Id));
        const bConflict = Number(alreadySuggested.has(b.team1Id)) + Number(alreadySuggested.has(b.team2Id));
        if (aConflict !== bConflict) return aConflict - bConflict;

        const aLoad = Math.max(playedByTeam[a.team1Id] || 0, playedByTeam[a.team2Id] || 0);
        const bLoad = Math.max(playedByTeam[b.team1Id] || 0, playedByTeam[b.team2Id] || 0);
        if (aLoad !== bLoad) return aLoad - bLoad;

        const gameDiff =
          (playedByGame[a.gameId] || 0) + (inProgress[a.gameId] || 0) -
          (playedByGame[b.gameId] || 0) - (inProgress[b.gameId] || 0);
        if (gameDiff !== 0) return gameDiff;

        const aRest = Math.max(lastPlayed[a.team1Id]?.getTime() || 0, lastPlayed[a.team2Id]?.getTime() || 0);
        const bRest = Math.max(lastPlayed[b.team1Id]?.getTime() || 0, lastPlayed[b.team2Id]?.getTime() || 0);
        if (aRest !== bRest) return aRest - bRest;
        return a.id.localeCompare(b.id);
      });

      const next = remaining.shift()!;
      selected.push(next);
      alreadySuggested.add(next.team1Id);
      alreadySuggested.add(next.team2Id);
    }

    const simplified = selected.map((m) => ({
      id: m.id,
      gameId: m.gameId,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      reason:
        !lastPlayed[m.team1Id] && !lastPlayed[m.team2Id]
          ? "Beide Teams sind noch nicht angetreten"
          : "Faire Rotation nach Spielen und Pausen",
    }));

    res.json(simplified);
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
      const { tournamentId, gameId, team1Id, team2Id, scheduledAt, stage, password } =
        req.body;

    if (!tournamentId || !gameId || !team1Id || !team2Id) {
      res.status(400).json({ error: "Alle IDs erforderlich" });
      return;
    }

    if (!password) {
      res.status(400).json({ error: "Passwort erforderlich" });
      return;
    }

    const userInfo = getUser(req);
    const user = await prisma.user.findUnique({ where: { id: userInfo.id } });
    if (!user) {
      res.sendStatus(403);
      return;
    }

    const passwordHash = createHash("sha256").update(password).digest("hex");
    if (passwordHash !== user.passwordHash) {
      res.status(401).json({ error: "Passwort falsch" });
      return;
    }

      const match = await prisma.match.create({
        data: {
          tournamentId,
          gameId,
          team1Id,
          team2Id,
          stage: (stage as MatchStage) || "extra",
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        },
        include: { results: true, game: true, team1: true, team2: true },
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
    await progressTournament(match.tournamentId);
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
    await progressTournament(match.tournamentId);
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
    await progressTournament(match.tournamentId);
    res.json(cleared);
  }
);

// ❌ Match löschen mit Passwort
router.delete(
  "/:id",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      res.status(404).json({ error: "Match nicht gefunden" });
      return;
    }
    const userInfo = getUser(req);
    if (!userInfo) {
      res.sendStatus(403);
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userInfo.id } });
    if (!user) {
      res.sendStatus(403);
      return;
    }
    const hash = createHash("sha256").update(password || "").digest("hex");
    if (hash !== user.passwordHash) {
      res.status(401).json({ error: "Passwort falsch" });
      return;
    }
    await prisma.matchResult.deleteMany({ where: { matchId: id } });
    await prisma.match.delete({ where: { id } });
    await progressTournament(match.tournamentId);
    res.json({ success: true });
  }
);

export default router;
