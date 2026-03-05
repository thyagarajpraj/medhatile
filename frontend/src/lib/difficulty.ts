import type { DifficultyConfig, DifficultyMode } from "../types/game";

export const DIFFICULTY_MODES: DifficultyConfig[] = [
  { mode: "easy", label: "Easy", grid: 4, startTiles: 3, maxTiles: 10 },
  { mode: "medium", label: "Medium", grid: 6, startTiles: 4, maxTiles: 14 },
  { mode: "hard", label: "Hard", grid: 8, startTiles: 5, maxTiles: 20 },
];

/**
 * Returns a difficulty config by mode, defaulting to Easy if mode is unknown.
 */
export function getDifficultyConfig(mode: DifficultyMode): DifficultyConfig {
  return DIFFICULTY_MODES.find((entry) => entry.mode === mode) ?? DIFFICULTY_MODES[0];
}
