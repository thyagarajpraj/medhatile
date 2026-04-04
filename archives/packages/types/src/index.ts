/**
 * Represents the available app-auth modes.
 */
export type AuthMode = "login" | "register";

/**
 * Represents a password-auth request body.
 */
export type AuthCredentials = {
  email: string;
  password: string;
};

/**
 * Represents an authenticated user returned by the backend.
 */
export type User = {
  id: string;
  email: string;
  bestScore: number;
};

/**
 * Represents a persisted authentication session.
 */
export type AuthSession = {
  token: string;
  user: User;
};

/**
 * Represents the app phase for the memory-tile flow.
 */
export type Phase = "idle" | "reveal" | "recall" | "review";

/**
 * Represents supported memory difficulty presets.
 */
export type DifficultyMode = "easy" | "medium" | "hard";

/**
 * Represents future reusable game-mode identifiers across web and mobile.
 */
export type GameMode = "classic" | "timed" | "challenge";

/**
 * Represents a difficulty configuration for the tile-memory game.
 */
export type DifficultyConfig = {
  mode: DifficultyMode;
  label: string;
  grid: number;
  startTiles: number;
  maxTiles: number;
};

/**
 * Represents a backend level configuration.
 */
export type LevelConfig = {
  level: number;
  grid: number;
  tiles: number;
};

/**
 * Represents the in-memory tile-game state shared across clients.
 */
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

/**
 * Represents a 2048-style board used by future modes.
 */
export type BoardState = number[][];

/**
 * Represents a saved score entry for a leaderboard.
 */
export type LeaderboardEntry = {
  id: string;
  email: string;
  score: number;
  mode: GameMode;
  createdAt: string;
};

/**
 * Represents a movie document returned by the backend.
 */
export type Movie = {
  _id: string;
  title: string;
  year?: number;
  plot?: string;
  genres?: string[];
};

/**
 * Represents the movies list response shape.
 */
export type MovieListResponse = {
  movies: Movie[];
  page: number;
  limit: number;
  total: number;
};

/**
 * Represents the payload used to create or update a movie.
 */
export type MoviePayload = {
  title: string;
  year?: number;
  plot?: string;
  genres?: string[];
};

/**
 * Represents a partial update payload for a movie.
 */
export type MovieUpdatePayload = Partial<MoviePayload>;
