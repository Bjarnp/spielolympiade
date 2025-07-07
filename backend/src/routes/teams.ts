import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 GET /teams – alle Teams mit Mitgliedern & Saison
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const teams = await prisma.team.findMany({
    include: {
      members: {
        include: { user: true },
      },
      season: true,
    },
  });

  res.json(teams);
});

// 🔐 GET /teams/:id – einzelnes Team mit Spielern & Saison
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      season: true,
    },
  });

  if (!team) {
    res.status(404).json({ error: "Team nicht gefunden" });
    return;
  }

  res.json(team);
});

// 🔐 POST /teams – neues Team erstellen (nur Admin)
router.post(
  "/",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { name, seasonId, playerIds } = req.body;

    if (
      !name ||
      !seasonId ||
      !Array.isArray(playerIds) ||
      playerIds.length < 2
    ) {
      res
        .status(400)
        .json({
          error: "Name, seasonId und mindestens 2 Spieler erforderlich",
        });
      return;
    }

    const team = await prisma.team.create({
      data: {
        name,
        seasonId,
        members: {
          create: playerIds.map((userId: string) => ({ userId })),
        },
      },
      include: {
        members: { include: { user: true } },
        season: true,
      },
    });

    res.status(201).json(team);
  }
);

export default router;
