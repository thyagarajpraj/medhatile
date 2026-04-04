import { extendPattern } from "./extendPattern";

describe("extendPattern", () => {
  it("keeps previous tile positions and appends new unique tiles", () => {
    expect(extendPattern([0, 5, 9], [9, 3, 12, 5], 4, 4)).toEqual([0, 5, 9, 3]);
  });

  it("fills missing slots without duplicating preserved tiles", () => {
    const pattern = extendPattern([0, 1, 2], [0, 1, 2], 4, 5);

    expect(pattern.slice(0, 3)).toEqual([0, 1, 2]);
    expect(pattern).toHaveLength(5);
    expect(new Set(pattern).size).toBe(5);
  });
});
