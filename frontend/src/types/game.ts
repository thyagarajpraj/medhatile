export type Phase = "idle" | "reveal" | "recall" | "review" | "gameover";

export type DifficultyMode = "easy" | "medium" | "hard";

export type DifficultyConfig = {
  mode: DifficultyMode;
  label: string;
  grid: number;
  startTiles: number;
  maxTiles: number;
};

export type LevelConfig = {
  level: number;
  grid: number;
  tiles: number;
};

export type GameState = {
  level: number;
  gridSize: number;
  tilesToRemember: number;
  pattern: number[];
  userSelections: number[];
  mistakes: number;
  phase: Phase;
  score: number;
};

export type TileState = "default" | "reveal" | "selected_correct" | "answer" | "wrong";
