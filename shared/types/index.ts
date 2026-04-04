export type User = {
  id: string;
  email: string;
  bestScore: number;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type LeaderboardEntry = {
  id: string;
  email: string;
  score: number;
  mode: "classic" | "timed" | "challenge";
  createdAt: string;
};

export type Board = number[][];

export type GameState = {
  board: Board;
  score: number;
  gameOver: boolean;
};
