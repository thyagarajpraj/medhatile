import { generatePattern } from "./generatePattern";

/**
 * Builds the next round pattern while preserving previously shown tile positions.
 */
export function extendPattern(previousPattern: number[], candidatePattern: number[], gridSize: number, count: number): number[] {
  const totalTiles = gridSize * gridSize;
  const nextPattern: number[] = [];
  const usedTiles = new Set<number>();

  /**
   * Adds a tile once when it is valid for the current board and target size.
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
