import { Router, type Request, type Response } from "express";
import { LEVELS } from "../lib/difficulty";
import { generatePattern } from "../lib/generatePattern";

export const gameRoutes = Router();

gameRoutes.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

gameRoutes.get("/levels", (_req: Request, res: Response) => {
  res.json({ levels: LEVELS });
});

gameRoutes.get("/pattern", (req: Request, res: Response) => {
  const gridSize = Number(req.query.gridSize);
  const count = Number(req.query.count);

  if (
    !Number.isInteger(gridSize) ||
    !Number.isInteger(count) ||
    gridSize <= 0 ||
    count <= 0 ||
    count > gridSize * gridSize
  ) {
    res.status(400).json({ error: "Invalid gridSize or count" });
    return;
  }

  try {
    const pattern = generatePattern(gridSize, count);
    res.json({ pattern });
  } catch {
    res.status(400).json({ error: "Could not generate pattern" });
  }
});
