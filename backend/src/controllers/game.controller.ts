import { type Request, type Response } from "express";
import { User } from "../features/auth/models/user.model";
import { getRoundsPerLevel } from "../lib/config";
import { LEVELS } from "../lib/difficulty";
import { generatePattern } from "../lib/generatePattern";
import type { ScoreSubmission } from "../types/game";

type BestScoreSyncBody = {
  bestScore: number;
};

/**
 * Resolves the authenticated user id from the request context.
 */
function getAuthenticatedUserId(req: Request<any, any, any, any>): string | null {
  return req.authUser?.sub ?? null;
}

/**
 * Persists a higher best score for the authenticated user when available.
 */
async function persistBestScore(userId: string, candidateScore: number): Promise<number | null> {
  const user = await User.findById(userId).select("bestScore");

  if (!user) {
    return null;
  }

  const currentBestScore = user.bestScore ?? 0;
  const nextBestScore = Math.max(currentBestScore, candidateScore);

  if (nextBestScore !== currentBestScore) {
    user.bestScore = nextBestScore;
    await user.save();
  }

  return nextBestScore;
}

/**
 * Accepts a score submission payload and acknowledges valid submissions.
 */
export async function submitScore(req: Request<unknown, unknown, Partial<ScoreSubmission>>, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const { score, level } = req.body ?? {};
  const isScoreValid = typeof score === "number" && Number.isInteger(score) && score >= 0;
  const isLevelValid = typeof level === "number" && Number.isInteger(level) && level > 0;

  if (!isScoreValid || !isLevelValid) {
    res.status(400).json({ success: false, message: "Invalid score payload" });
    return;
  }

  console.log("Score received:", { score, level });

  try {
    const bestScore = await persistBestScore(userId, score);

    if (bestScore === null) {
      res.status(401).json({ success: false, message: "Authenticated user not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Score received",
      bestScore,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to record score", details: String(error) });
  }
}

/**
 * Syncs a locally stored best score into the authenticated account record.
 */
export async function syncBestScore(
  req: Request<unknown, unknown, Partial<BestScoreSyncBody>>,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const bestScore = req.body?.bestScore;
  const isBestScoreValid = typeof bestScore === "number" && Number.isInteger(bestScore) && bestScore >= 0;

  if (!isBestScoreValid) {
    res.status(400).json({ error: "Invalid best score payload" });
    return;
  }

  try {
    const persistedBestScore = await persistBestScore(userId, bestScore);

    if (persistedBestScore === null) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    res.status(200).json({
      success: true,
      bestScore: persistedBestScore,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync best score", details: String(error) });
  }
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
