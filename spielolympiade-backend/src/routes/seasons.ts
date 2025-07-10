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
    const season = await prisma.season.findFirst({ where: { isActive: true } });

    if (!season) {
      return res.json({ teams: [], games: [], results: [] });
    }

    const teams = await prisma.team.findMany({ where: { seasonId: season.id } });
    const games = await prisma.game.findMany();
    const results = await prisma.matchResult.findMany({
      where: { match: { tournament: { seasonId: season.id } } },
    });

    res.json({ teams, games, results });
  } catch (err) {
    console.error("Fehler beim Laden der Dashboard-Daten:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 📜 GET /seasons/:id/history – Saison mit Matches & Ergebnissen
router.get(
  "/:id/history",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        teams: {
          include: { members: { include: { user: true } } },
        },
        tournaments: {
          include: {
            matches: { include: { game: true, results: true, winner: true } },
          },
        },
      },
    });

    if (!season) {
      res.status(404).json({ error: "Saison nicht gefunden" });
      return;
    }

    res.json(season);
  }
);

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

  const table = season.teams.map((team: any) => {
    const teamMatches = matches.filter(
      (m: any) => m.team1Id === team.id || m.team2Id === team.id
    );
    const wins = teamMatches.filter((m: any) => m.winnerId === team.id).length;
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

  table.sort((a: any, b: any) => b.points - a.points);

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

// 🌟 POST /seasons/start – vereinfachter Start einer Saison
router.post(
  "/start",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { year, name } = req.body;

    if (!year || !name) {
      res.status(400).json({ error: "year und name erforderlich" });
      return;
    }

    const exists = await prisma.season.findFirst({ where: { year } });
    if (exists) {
      res.status(400).json({ error: "Saison existiert bereits" });
      return;
    }

    const season = await prisma.season.create({ data: { year, name, isActive: true } });
    await prisma.tournament.create({
      data: { seasonId: season.id, system: "round_robin" },
    });

    res.status(201).json(season);
  }
);

// 🏁 POST /seasons/setup – Saison inkl. Teams & Matches anlegen
router.post(
  "/setup",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { year, name, teams, gameIds, system } = req.body;

    if (
      !year ||
      !name ||
      !Array.isArray(teams) ||
      teams.length === 0 ||
      !Array.isArray(gameIds) ||
      gameIds.length === 0
    ) {
      res
        .status(400)
        .json({ error: "year, name, teams und gameIds erforderlich" });
      return;
    }

    const exists = await prisma.season.findFirst({ where: { year } });
    if (exists) {
      res.status(400).json({ error: "Saison existiert bereits" });
      return;
    }

    const season = await prisma.season.create({ data: { year, name, isActive: true } });
    const tournament = await prisma.tournament.create({
      data: { seasonId: season.id, system: system || "round_robin" },
    });

    const createdTeams = [] as any[];
    for (const t of teams) {
      const team = await prisma.team.create({
        data: { name: t.name, seasonId: season.id },
      });
      createdTeams.push(team);
      for (const userId of t.playerIds) {
        await prisma.teamMember.create({ data: { teamId: team.id, userId } });
      }
    }

    if (system === "round_robin" || !system) {
      for (const gameId of gameIds) {
        for (let i = 0; i < createdTeams.length; i++) {
          for (let j = i + 1; j < createdTeams.length; j++) {
            await prisma.match.create({
              data: {
                tournamentId: tournament.id,
                gameId,
                team1Id: createdTeams[i].id,
                team2Id: createdTeams[j].id,
              },
            });
          }
        }
      }
    }

    res.status(201).json(season);
  }
);

// ✅ Saison beenden (Passwortabfrage rudimentär)
router.post(
  "/:id/finish",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    if (password !== "admin") {
      res.status(401).json({ error: "Passwort falsch" });
      return;
    }

    const season = await prisma.season.update({
      where: { id },
      data: { finishedAt: new Date(), isActive: false },
    });

    res.json(season);
  }
);

export default router;
