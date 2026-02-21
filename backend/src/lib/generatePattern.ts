export function generatePattern(gridSize: number, count: number): number[] {
  const total = gridSize * gridSize;

  if (gridSize <= 0 || count <= 0 || count > total) {
    throw new Error("Invalid pattern configuration");
  }

  const indices = new Set<number>();

  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * total));
  }

  return Array.from(indices);
}
