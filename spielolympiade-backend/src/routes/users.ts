import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
    members: latestTeam.members.map((m) => m.user.name),
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

export default router;
