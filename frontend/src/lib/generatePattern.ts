export function generatePattern(gridSize: number, count: number): number[] {
  const total = gridSize * gridSize;
  const indices = new Set<number>();

  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * total));
  }

  return Array.from(indices);
}