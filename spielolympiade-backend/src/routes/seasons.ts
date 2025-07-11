import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

function getUser(req: Request) {
  return (req as any).user;
}

// ✅ GET /seasons – alle Saisons abrufen
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const seasons = await prisma.season.findMany({
    orderBy: { year: "desc" },
  });
  res.json(seasons);
});

router.get(
  "/public/dashboard-data",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const season = await prisma.season.findFirst({
        where: { isActive: true },
      });

      if (!season) {
        res.json({ teams: [], games: [], tournament: null });
        return;
      }

      const teams = await prisma.team.findMany({
        where: { seasonId: season.id },
      });
      const games = await prisma.game.findMany();
      const tournament = await prisma.tournament.findFirst({
        where: { seasonId: season.id },
        include: { matches: { include: { results: true } } },
      });

      res.json({ teams, games, tournament });
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  }
);

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
            matches: {
              include: {
                game: true,
                results: true,
                winner: true,
                team1: true,
                team2: true,
              },
            },
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

    const season = await prisma.season.create({
      data: { year, name, isActive: true },
    });
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

    const season = await prisma.season.create({
      data: { year, name, isActive: true },
    });
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
    } else if (system === "group_ko") {
      for (const gameId of gameIds) {
        const shuffled = [...createdTeams].sort(() => Math.random() - 0.5);
        const mid = Math.ceil(shuffled.length / 2);
        const groups = {
          A: shuffled.slice(0, mid),
          B: shuffled.slice(mid),
        } as Record<string, any[]>;

        for (const [groupName, groupTeams] of Object.entries(groups)) {
          for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
              await prisma.match.create({
                data: {
                  tournamentId: tournament.id,
                  gameId,
                  team1Id: groupTeams[i].id,
                  team2Id: groupTeams[j].id,
                  stage: "group",
                  groupName,
                },
              });
            }
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

// ❌ Saison löschen
router.delete(
  "/:id",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

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

    await prisma.matchResult.deleteMany({
      where: { match: { tournament: { seasonId: id } } },
    });
    await prisma.match.deleteMany({
      where: { tournament: { seasonId: id } },
    });
    await prisma.teamMember.deleteMany({
      where: { team: { seasonId: id } },
    });
    await prisma.team.deleteMany({ where: { seasonId: id } });
    await prisma.tournament.deleteMany({ where: { seasonId: id } });
    await prisma.season.delete({ where: { id } });

    res.json({ success: true });
  }
);

export default router;
