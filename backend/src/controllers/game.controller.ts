import { type Request, type Response } from "express";
import { getRoundsPerLevel } from "../lib/config";
import { LEVELS } from "../lib/difficulty";
import { generatePattern } from "../lib/generatePattern";
import type { ScoreSubmission } from "../types/game";

/**
 * Accepts a score submission payload and acknowledges valid submissions.
 */
export function submitScore(req: Request<unknown, unknown, Partial<ScoreSubmission>>, res: Response): void {
  const { score, level } = req.body ?? {};
  const isScoreValid = typeof score === "number" && Number.isInteger(score) && score >= 0;
  const isLevelValid = typeof level === "number" && Number.isInteger(level) && level > 0;

  if (!isScoreValid || !isLevelValid) {
    res.status(400).json({ success: false, message: "Invalid score payload" });
    return;
  }

  console.log("Score received:", { score, level });

  res.status(200).json({
    success: true,
    message: "Score received",
  });
}

/**
 * Returns the configured level progression list.
 */
export function getLevels(_req: Request, res: Response): void {
  res.status(200).json({ levels: LEVELS });
}

/**
 * Returns runtime game configuration values.
 */
export function getGameConfig(_req: Request, res: Response): void {
  res.status(200).json({
    roundsPerLevel: getRoundsPerLevel(),
  });
}

/**
 * Generates a new pattern after validating the requested grid and tile count.
 */
export function getPattern(req: Request, res: Response): void {
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
    res.status(200).json({ pattern });
  } catch {
    res.status(400).json({ error: "Invalid gridSize or count" });
  }
}
