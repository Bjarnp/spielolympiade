import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 User aus JWT holen
function getUser(req: Request) {
  return (req as any).user;
}

// ✅ GET /users/me
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  const { username } = getUser(req);
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    res.status(404).json({ error: "Nicht gefunden" });
    return;
  }

  res.json(user);
});

// ✅ GET /users/my-team
router.get("/my-team", async (req: Request, res: Response): Promise<void> => {
  const { username } = getUser(req);

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      teamMemberships: {
        include: {
          team: {
            include: {
              members: {
                include: { user: true },
              },
              season: true,
            },
          },
        },
      },
    },
  });

  const latestTeam = user?.teamMemberships[0]?.team;

  if (!latestTeam) {
    res.status(404).json({ error: "Kein Team gefunden" });
    return;
  }

  res.json({
    id: latestTeam.id,
    name: latestTeam.name,
    season: latestTeam.season.name,
    seasonId: latestTeam.season.id,
    members: latestTeam.members.map((m: any) => m.user.name),
  });
});

// ✅ GET /users/my-matches
router.get(
  "/my-matches",
  async (req: Request, res: Response): Promise<void> => {
    const { username } = getUser(req);

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        teamMemberships: true,
      },
    });

    const teamId = user?.teamMemberships[0]?.teamId;

    if (!teamId) {
      res.status(404).json({ error: "Kein Team gefunden" });
      return;
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ team1Id: teamId }, { team2Id: teamId }],
      },
      include: {
        game: true,
        results: true,
        tournament: {
          include: { season: true },
        },
      },
    });

    res.json(matches);
  }
);

// ----- Admin: Benutzer verwalten -----

// Alle Nutzer auflisten
router.get(
  "/",
  authorizeRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const users = await prisma.user.findMany({ orderBy: { username: "asc" } });
    res.json(users);
  }
);

// Neuen Nutzer anlegen
router.post(
  "/",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password) {
      res.status(400).json({ error: "name, username, password erforderlich" });
      return;
    }
    const hash = createHash('sha256').update(password).digest('hex');
    const user = await prisma.user.create({
      data: { name, username, passwordHash: hash, role: role || "player" },
    });
    res.status(201).json(user);
  }
);

// Nutzer aktualisieren
router.put(
  "/:id",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, username, password, role } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (username) data.username = username;
    if (role) data.role = role;
    if (password) data.passwordHash = createHash('sha256').update(password).digest('hex');

    try {
      const user = await prisma.user.update({ where: { id }, data });
      res.json(user);
    } catch {
      res.status(404).json({ error: "User nicht gefunden" });
    }
  }
);

// Nutzer löschen
router.delete(
  "/:id",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      await prisma.user.delete({ where: { id } });
      res.sendStatus(204);
    } catch {
      res.status(404).json({ error: "User nicht gefunden" });
    }
  }
);

export default router;
