import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authorizeRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// GET /games - list all games
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const games = await prisma.game.findMany();
  res.json(games);
});

router.post(
  "/",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const rules = typeof req.body.rules === "string" ? req.body.rules.trim() || null : null;
    if (!name) {
      res.status(400).json({ error: "Name der Spielart ist erforderlich" });
      return;
    }
    const existing = await prisma.game.findFirst({ where: { name } });
    if (existing) {
      res.status(409).json({ error: "Diese Spielart existiert bereits" });
      return;
    }
    const game = await prisma.game.create({ data: { name, rules } });
    res.status(201).json(game);
  }
);

export default router;
