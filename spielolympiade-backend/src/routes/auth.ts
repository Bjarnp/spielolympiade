import express from "express";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username und Passwort erforderlich" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    res.status(401).json({ error: "Ungültige Anmeldedaten" });
    return;
  }

  const hash = createHash("sha256").update(password).digest("hex");

  if (hash !== user.passwordHash) {
    res.status(401).json({ error: "Ungültige Anmeldedaten" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "12h" }
  );

  res.json({ token, mustChangePassword: user.mustChangePassword });
});

export default router;
