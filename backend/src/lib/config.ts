const DEFAULT_ROUNDS_PER_LEVEL = 5;

/**
 * Parses a positive integer from env, falling back when invalid.
 */
function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

/**
 * Returns how many completed rounds are needed before level increments.
 */
export function getRoundsPerLevel(): number {
  return parsePositiveInteger(process.env.ROUNDS_PER_LEVEL, DEFAULT_ROUNDS_PER_LEVEL);
}
