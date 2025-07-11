import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /games - list all games
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const games = await prisma.game.findMany();
  res.json(games);
});

export default router;
