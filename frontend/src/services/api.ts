import type { LevelConfig } from "../types/game";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "http://localhost:5000/api";

/**
 * Represents backend-controlled game config values.
 */
export type GameConfig = {
  roundsPerLevel: number;
};

/**
 * Fetches runtime game configuration from backend.
 */
export async function fetchGameConfigFromApi(): Promise<GameConfig> {
  const response = await fetch(`${API_BASE_URL}/game/config`);

  if (!response.ok) {
    throw new Error("Failed to fetch game config");
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
export async function fetchLevelsFromApi(): Promise<LevelConfig[]> {
  const response = await fetch(`${API_BASE_URL}/game/levels`);

  if (!response.ok) {
    throw new Error("Failed to fetch levels");
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
export async function fetchPatternFromApi(gridSize: number, count: number): Promise<number[]> {
  const params = new URLSearchParams({
    gridSize: String(gridSize),
    count: String(count),
  });

  const response = await fetch(`${API_BASE_URL}/game/pattern?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch pattern");
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
export async function submitScoreToApi(score: number, level: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/game/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ score, level }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit score");
  }
}
