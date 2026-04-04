export type Phase = "idle" | "reveal" | "recall" | "review";
export type DifficultyMode = "easy" | "medium" | "hard";
export type DifficultyConfig = {
  mode: DifficultyMode;
  label: string;
  grid: number;
  startTiles: number;
  maxTiles: number;
};
export type IdentifyGameState = {
  level: number;
  gridSize: number;
  tilesToRemember: number;
  pattern: number[];
  userSelections: number[];
  mistakes: number;
  phase: Phase;
  score: number;
};

export const DIFFICULTY_MODES: DifficultyConfig[] = [
  { mode: "easy", label: "Easy", grid: 4, startTiles: 3, maxTiles: 10 },
  { mode: "medium", label: "Medium", grid: 6, startTiles: 4, maxTiles: 14 },
  { mode: "hard", label: "Hard", grid: 8, startTiles: 5, maxTiles: 20 },
];

/**
 * Resolves the selected difficulty mode into its board and tile limits.
 */
export function getDifficultyConfig(mode: DifficultyMode): DifficultyConfig {
  return DIFFICULTY_MODES.find((entry) => entry.mode === mode) ?? DIFFICULTY_MODES[0];
}

/**
 * Creates the default identifying-game state for a given difficulty.
 */
export function createInitialGameState(config: DifficultyConfig): IdentifyGameState {
  return {
    level: 1,
    gridSize: config.grid,
    tilesToRemember: config.startTiles,
    pattern: [],
    userSelections: [],
    mistakes: 0,
    phase: "idle",
    score: 0,
  };
}

/**
 * Generates a unique random set of tile indices for a round.
 */
export function generatePattern(gridSize: number, count: number): number[] {
  const total = gridSize * gridSize;
  const indices = new Set<number>();

  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * total));
  }

  return Array.from(indices);
}

/**
 * Preserves prior correct tiles while extending the next round with unique candidates.
 */
export function extendPattern(
  previousPattern: number[],
  candidatePattern: number[],
  gridSize: number,
  count: number,
): number[] {
  const totalTiles = gridSize * gridSize;
  const nextPattern: number[] = [];
  const usedTiles = new Set<number>();

  const appendTile = (tileIndex: number) => {
    if (
      !Number.isInteger(tileIndex) ||
      tileIndex < 0 ||
      tileIndex >= totalTiles ||
      usedTiles.has(tileIndex) ||
      nextPattern.length >= count
    ) {
      return;
    }

    usedTiles.add(tileIndex);
    nextPattern.push(tileIndex);
  };

  previousPattern.forEach(appendTile);
  candidatePattern.forEach(appendTile);

  if (nextPattern.length < count) {
    generatePattern(gridSize, totalTiles).forEach(appendTile);
  }

  return nextPattern;
}
