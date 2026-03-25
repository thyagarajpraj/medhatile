import { buildApiUrl } from "../config/api";
import { buildRequestHeaders, parseApiError } from "../lib/http";
import type { LevelConfig } from "../types/game";

/**
 * Represents backend-controlled game config values.
 */
export type GameConfig = {
  roundsPerLevel: number;
};

/**
 * Represents the best-score sync response returned by the backend.
 */
export type BestScoreSyncResponse = {
  success: true;
  bestScore: number;
};

/**
 * Represents the score-submit response returned by the backend.
 */
export type ScoreSubmitResponse = {
  success: true;
  message: string;
  bestScore: number;
};

/**
 * Fetches runtime game configuration from backend.
 */
export async function fetchGameConfigFromApi(authToken?: string): Promise<GameConfig> {
  const response = await fetch(buildApiUrl("/game/config"), {
    headers: buildRequestHeaders(authToken),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to fetch game config");
  }

  const payload = (await response.json()) as { roundsPerLevel?: number };
  const roundsPerLevel = payload.roundsPerLevel;
  if (typeof roundsPerLevel !== "number" || !Number.isInteger(roundsPerLevel) || roundsPerLevel <= 0) {
    throw new Error("Invalid game config payload");
  }

  return { roundsPerLevel };
}

/**
 * Fetches difficulty levels from backend.
 * Falls back handling is done by caller.
 */
export async function fetchLevelsFromApi(authToken?: string): Promise<LevelConfig[]> {
  const response = await fetch(buildApiUrl("/game/levels"), {
    headers: buildRequestHeaders(authToken),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to fetch levels");
  }

  const payload = (await response.json()) as { levels?: LevelConfig[] };

  if (!payload.levels || !Array.isArray(payload.levels) || payload.levels.length === 0) {
    throw new Error("Invalid levels payload");
  }

  return payload.levels;
}

/**
 * Requests a random unique tile pattern for a given grid size and tile count.
 */
export async function fetchPatternFromApi(gridSize: number, count: number, authToken?: string): Promise<number[]> {
  const params = new URLSearchParams({
    gridSize: String(gridSize),
    count: String(count),
  });

  const endpoint = `${buildApiUrl("/game/pattern")}?${params.toString()}`;
  const response = authToken
    ? await fetch(endpoint, {
        headers: buildRequestHeaders(authToken),
      })
    : await fetch(endpoint);

  if (!response.ok) {
    throw await parseApiError(response, "Failed to fetch pattern");
  }

  const payload = (await response.json()) as { pattern?: number[] };

  if (!payload.pattern || !Array.isArray(payload.pattern) || payload.pattern.length !== count) {
    throw new Error("Invalid pattern payload");
  }

  return payload.pattern;
}

/**
 * Submits a completed run snapshot to backend for future persistence/analytics.
 */
export async function submitScoreToApi(score: number, level: number, authToken?: string): Promise<ScoreSubmitResponse> {
  const response = await fetch(buildApiUrl("/game/submit"), {
    method: "POST",
    headers: buildRequestHeaders(authToken, true),
    body: JSON.stringify({ score, level }),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to submit score");
  }

  const payload = (await response.json()) as Partial<ScoreSubmitResponse>;
  if (payload.success !== true || typeof payload.bestScore !== "number") {
    throw new Error("Invalid score submit payload");
  }

  return {
    success: true,
    message: typeof payload.message === "string" ? payload.message : "Score received",
    bestScore: payload.bestScore,
  };
}

/**
 * Syncs the locally stored best score into the authenticated account.
 */
export async function syncBestScoreToApi(bestScore: number, authToken: string): Promise<BestScoreSyncResponse> {
  const response = await fetch(buildApiUrl("/game/best-score/sync"), {
    method: "POST",
    headers: buildRequestHeaders(authToken, true),
    body: JSON.stringify({ bestScore }),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to sync best score");
  }

  const payload = (await response.json()) as Partial<BestScoreSyncResponse>;
  if (payload.success !== true || typeof payload.bestScore !== "number") {
    throw new Error("Invalid best score sync payload");
  }

  return {
    success: true,
    bestScore: payload.bestScore,
  };
}
