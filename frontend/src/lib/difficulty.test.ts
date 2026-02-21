import { describe, expect, it } from "vitest";
import { DIFFICULTY_MODES, getDifficultyConfig } from "./difficulty";

describe("difficulty config", () => {
  it("exposes the expected modes", () => {
    expect(DIFFICULTY_MODES.map((m) => m.mode)).toEqual(["easy", "medium", "hard"]);
  });

  it("returns matching config for known mode", () => {
    const medium = getDifficultyConfig("medium");
    expect(medium.label).toBe("Medium");
    expect(medium.grid).toBe(6);
    expect(medium.startTiles).toBe(4);
  });

  it("falls back to easy config for unknown mode", () => {
    const fallback = getDifficultyConfig("unknown" as never);
    expect(fallback.mode).toBe("easy");
  });
});

