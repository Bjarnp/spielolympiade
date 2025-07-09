import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ GET /seasons – alle Saisons abrufen
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const seasons = await prisma.season.findMany({
    orderBy: { year: "desc" },
  });
  res.json(seasons);
});

// ✅ GET /seasons/:id – einzelne Saison inkl. Teams & Turniere
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          members: { include: { user: true } },
        },
      },
      tournaments: true,
    },
  });

  if (!season) {
    res.status(404).json({ error: "Saison nicht gefunden" });
    return;
  }

  res.json(season);
});

router.get("/public/dashboard-data", async (_req, res) => {
  try {
    const teams = await prisma.team.findMany();
    const games = await prisma.game.findMany();
    const results = await prisma.matchResult.findMany();

    res.json({ teams, games, results });
  } catch (err) {
    console.error("Fehler beim Laden der Dashboard-Daten:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🏆 GET /seasons/:id/table – Saison-Tabelle berechnen
router.get("/:id/table", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const season = await prisma.season.findUnique({
    where: { id },
    include: { teams: true },
  });

  if (!season) {
    res.status(404).json({ error: "Saison nicht gefunden" });
    return;
  }

  const matches = await prisma.match.findMany({
    where: { tournament: { seasonId: id }, winnerId: { not: null } },
    select: { id: true, team1Id: true, team2Id: true, winnerId: true },
  });

  const table = season.teams.map((team) => {
    const teamMatches = matches.filter(
      (m) => m.team1Id === team.id || m.team2Id === team.id
    );
    const wins = teamMatches.filter((m) => m.winnerId === team.id).length;
    const games = teamMatches.length;
    const losses = games - wins;
    const points = wins; // 1 Punkt pro Sieg
    return {
      id: team.id,
      name: team.name,
      spiele: games,
      siege: wins,
      niederlagen: losses,
      points,
    };
  });

  table.sort((a, b) => b.points - a.points);

  res.json(table);
});

// ✅ POST /seasons – neue Saison anlegen (admin only)
router.post(
  "/",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { year, name } = req.body;

    if (!year || !name) {
      res.status(400).json({ error: "year und name erforderlich" });
      return;
    }

    const existing = await prisma.season.findFirst({ where: { year } });
    if (existing) {
      res
        .status(400)
        .json({ error: "Saison mit diesem Jahr existiert bereits" });
      return;
    }

    const season = await prisma.season.create({
      data: { year, name },
    });

    res.status(201).json(season);
  }
);

export default router;
