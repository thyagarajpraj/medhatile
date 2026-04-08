import { boardsAreEqual, calculateScore, checkGameOver, createStartingBoard, moveTiles, spawnTile } from "@medhatile/shared-game";
import type { Board } from "@medhatile/shared-types";

export type Direction = "up" | "down" | "left" | "right";
export type GameViewState = {
  board: Board;
  score: number;
  gameOver: boolean;
};

/**
 * Creates the initial 2048 board state.
 */
export function createInitialGameState(): GameViewState {
  const board = createStartingBoard(4);

  return {
    board,
    score: calculateScore(board),
    gameOver: checkGameOver(board),
  };
}

/**
 * Returns the tile background color for a given 2048 value.
 */
export function cellColor(value: number): string {
  if (value >= 128) {
    return "#f59e0b";
  }

  if (value >= 32) {
    return "#fbbf24";
  }

  if (value >= 8) {
    return "#dbeafe";
  }

  return value === 0 ? "#eff6ff" : "#ffffff";
}

/**
 * Applies a move to the 2048 board when the direction changes the grid.
 */
export function applyMove(current: GameViewState, direction: Direction): GameViewState {
  const movedBoard = moveTiles(current.board, direction);

  if (boardsAreEqual(current.board, movedBoard)) {
    return current;
  }

  const nextBoard = spawnTile(movedBoard);

  return {
    board: nextBoard,
    score: calculateScore(nextBoard),
    gameOver: checkGameOver(nextBoard),
  };
}
