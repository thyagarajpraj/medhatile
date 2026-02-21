import { describe, expect, it } from "vitest";
import { generatePattern } from "./generatePattern";

describe("generatePattern", () => {
  it("returns the requested number of unique indices", () => {
    const pattern = generatePattern(4, 5);

    expect(pattern).toHaveLength(5);
    expect(new Set(pattern).size).toBe(5);
  });

  it("keeps all generated indices in bounds", () => {
    const gridSize = 6;
    const count = 8;
    const pattern = generatePattern(gridSize, count);
    const max = gridSize * gridSize;

    for (const idx of pattern) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(max);
    }
  });
});

