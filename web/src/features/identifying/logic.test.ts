import { createInitialGameState, extendPattern, generatePattern, getDifficultyConfig } from "./logic";

describe("identifying logic", () => {
  it("returns the expected easy difficulty defaults", () => {
    expect(getDifficultyConfig("easy")).toEqual({
      mode: "easy",
      label: "Easy",
      grid: 4,
      startTiles: 3,
      maxTiles: 10,
    });
  });

  it("creates an initial state from the selected difficulty", () => {
    expect(createInitialGameState(getDifficultyConfig("medium"))).toEqual({
      level: 1,
      gridSize: 6,
      tilesToRemember: 4,
      pattern: [],
      userSelections: [],
      mistakes: 0,
      phase: "idle",
      score: 0,
    });
  });

  it("returns the requested number of unique in-bounds pattern indices", () => {
    const pattern = generatePattern(4, 3);

    expect(pattern).toHaveLength(3);
    expect(new Set(pattern).size).toBe(3);
    expect(pattern.every((index) => index >= 0 && index < 16)).toBe(true);
  });

  it("preserves previous tiles while extending with new unique ones", () => {
    const nextPattern = extendPattern([1, 5, 9], [5, 6, 10], 4, 5);

    expect(nextPattern).toHaveLength(5);
    expect(nextPattern.slice(0, 3)).toEqual([1, 5, 9]);
    expect(new Set(nextPattern).size).toBe(5);
    expect(nextPattern).toEqual([1, 5, 9, 6, 10]);
  });
});
