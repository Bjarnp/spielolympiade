import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// POST /tournaments/:id/start-ko-phase - generate KO matches after group stage
router.post(
  "/:id/start-ko-phase",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { matches: { include: { results: true } } },
    });
    if (!tournament) {
      res.status(404).json({ error: "Turnier nicht gefunden" });
      return;
    }

    if (tournament.system !== "group_ko") {
      res.status(400).json({ error: "Nur für Gruppen-KO Turniere" });
      return;
    }

    const games = [
      ...new Set(tournament.matches.map((m: any) => m.gameId)),
    ] as string[];

    for (const gameId of games) {
      const groupMatches = tournament.matches.filter(
        (m: any) => m.gameId === gameId && m.stage === "group"
      );
      const groups: Record<string, any[]> = {};
      for (const m of groupMatches) {
        if (!m.groupName) continue;
        groups[m.groupName] = groups[m.groupName] || [];
        if (!groups[m.groupName].includes(m.team1Id))
          groups[m.groupName].push(m.team1Id);
        if (!groups[m.groupName].includes(m.team2Id))
          groups[m.groupName].push(m.team2Id);
      }

      const standings: Record<string, { teamId: string; points: number }[]> = {};
      for (const m of groupMatches) {
        if (!m.winnerId) {
          res.status(400).json({ error: "Gruppenspiele noch nicht abgeschlossen" });
          return;
        }
        const group = m.groupName as string;
        standings[group] = standings[group] || groups[group].map((t) => ({ teamId: t, points: 0 }));
        const entry = standings[group].find((s) => s.teamId === m.winnerId);
        if (entry) entry.points += 1;
      }

      for (const group of Object.keys(standings)) {
        standings[group].sort((a, b) => b.points - a.points);
      }

      const semi1Team1 = standings["A"][0].teamId;
      const semi1Team2 = standings["B"][1].teamId;
      const semi2Team1 = standings["B"][0].teamId;
      const semi2Team2 = standings["A"][1].teamId;

      const semi1 = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          gameId,
          team1Id: semi1Team1,
          team2Id: semi1Team2,
          stage: "semi_final",
        },
      });
      const semi2 = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          gameId,
          team1Id: semi2Team1,
          team2Id: semi2Team2,
          stage: "semi_final",
        },
      });

      await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          gameId,
          team1Id: semi1.winnerId || semi1Team1,
          team2Id: semi2.winnerId || semi2Team1,
          stage: "final",
        },
      });

      await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          gameId,
          team1Id: semi1.winnerId ? semi2Team2 : semi1Team1,
          team2Id: semi2.winnerId ? semi1Team2 : semi2Team1,
          stage: "third_place",
        },
      });
    }

    res.json({ success: true });
  }
);

export default router;
