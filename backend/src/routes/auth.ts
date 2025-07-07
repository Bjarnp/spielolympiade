import express from "express";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

const router = express.Router();

router.post("/login", (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: "Username fehlt" });
    return;
  }

  const token = jwt.sign(
    { username, role: "player" },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "12h" }
  );

  res.json({ token });
});

export default router;
