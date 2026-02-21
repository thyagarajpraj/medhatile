import type { LevelConfig } from "../types/game";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:4000/api";

export async function fetchLevelsFromApi(): Promise<LevelConfig[]> {
  const response = await fetch(`${API_BASE_URL}/levels`);

  if (!response.ok) {
    throw new Error("Failed to fetch levels");
  }

  const payload = (await response.json()) as { levels?: LevelConfig[] };

  if (!payload.levels || !Array.isArray(payload.levels) || payload.levels.length === 0) {
    throw new Error("Invalid levels payload");
  }

  return payload.levels;
}

export async function fetchPatternFromApi(gridSize: number, count: number): Promise<number[]> {
  const params = new URLSearchParams({
    gridSize: String(gridSize),
    count: String(count),
  });

  const response = await fetch(`${API_BASE_URL}/pattern?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch pattern");
  }

  const payload = (await response.json()) as { pattern?: number[] };

  if (!payload.pattern || !Array.isArray(payload.pattern) || payload.pattern.length !== count) {
    throw new Error("Invalid pattern payload");
  }

  return payload.pattern;
}