import { type Request, type Response } from "express";
import { LEVELS } from "../lib/difficulty";
import { generatePattern } from "../lib/generatePattern";

export const getHealth = (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
};

export const getLevels = (_req: Request, res: Response): void => {
  res.json({ levels: LEVELS });
};

export const getPattern = (req: Request, res: Response): void => {
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
    res.status(400).json({ error: "Invalid gridSize or count" });
  }
};
