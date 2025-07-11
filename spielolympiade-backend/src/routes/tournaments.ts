import express, { Request, Response } from "express";
import { authorizeRole } from "../middleware/auth";
import { progressTournament } from "../utils/tournament";

const router = express.Router();

// Manuell KO-Phase oder Finale starten
router.post(
  "/:id/progress",
  authorizeRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    await progressTournament(req.params.id);
    res.json({ success: true });
  }
);

export default router;
