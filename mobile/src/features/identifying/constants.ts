import type { Phase } from "./logic";

export const BEST_SCORE_KEY = "medhatile_best_score";
export const REVEAL_BLINK_DURATION_MS = 1000;
export const REVEAL_DURATION_MS = 1000;
export const REVIEW_BLINK_DURATION_MS = 1000;
export const BETWEEN_ROUNDS_MS = 450;
export const MAX_MISTAKES = 3;

export const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready",
  reveal: "Observe",
  recall: "Recall",
  review: "Answer",
};

export const PHASE_HINTS: Record<Phase, string> = {
  idle: "Get ready for the next pattern.",
  reveal: "Observe the highlighted tiles.",
  recall: "Tap the same tiles from memory.",
  review: "OK: correct, .: missed, X: wrong click.",
};
