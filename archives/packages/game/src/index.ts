import type { BoardState, DifficultyConfig, DifficultyMode, GameMode } from "@medhatile/types";

/**
 * Defines the supported difficulty presets for the tile-memory game.
 */
export const DIFFICULTY_MODES: DifficultyConfig[] = [
  { mode: "easy", label: "Easy", grid: 4, startTiles: 3, maxTiles: 10 },
  { mode: "medium", label: "Medium", grid: 6, startTiles: 4, maxTiles: 14 },
  { mode: "hard", label: "Hard", grid: 8, startTiles: 5, maxTiles: 20 },
];

/**
 * Returns a difficulty configuration by mode.
 */
export function getDifficultyConfig(mode: DifficultyMode): DifficultyConfig {
  return DIFFICULTY_MODES.find((entry) => entry.mode === mode) ?? DIFFICULTY_MODES[0];
}

/**
 * Generates unique random tile indexes for a square memory grid.
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
 * Extends a memory pattern while preserving previously shown positions.
 */
export function extendPattern(previousPattern: number[], candidatePattern: number[], gridSize: number, count: number): number[] {
  const totalTiles = gridSize * gridSize;
  const nextPattern: number[] = [];
  const usedTiles = new Set<number>();

  /**
   * Appends one tile when it is valid and still needed.
   */
  const appendTile = (tileIndex: number) => {
    if (!Number.isInteger(tileIndex) || tileIndex < 0 || tileIndex >= totalTiles || usedTiles.has(tileIndex) || nextPattern.length >= count) {
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

/**
 * Creates an empty square board for future board-based modes.
 */
export function createBoard(size = 4): BoardState {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

/**
 * Returns the board unchanged until a move-direction implementation is introduced.
 */
export function moveTiles(board: BoardState, _direction: "up" | "down" | "left" | "right", _mode: GameMode = "classic"): BoardState {
  return board.map((row) => [...row]);
}

/**
 * Returns the board unchanged until merge rules are introduced for board-based modes.
 */
export function mergeTiles(board: BoardState): BoardState {
  return board.map((row) => [...row]);
}

/**
 * Calculates a score by summing every tile value on the board.
 */
export function calculateScore(board: BoardState): number {
  return board.flat().reduce((total, tileValue) => total + tileValue, 0);
}

/**
 * Returns whether no zero-value cells remain on the board.
 */
export function checkGameOver(board: BoardState): boolean {
  return board.every((row) => row.every((tileValue) => tileValue !== 0));
}
