import type { LeaderboardEntry } from "@medhatile/shared-types";
import { api } from "./api";

export async function saveScore(data: { score: number; level?: number }): Promise<{ success: boolean; bestScore: number; message: string }> {
  const payload = {
    score: data.score,
    level: data.level ?? 1,
  };

  const response = await api.post<{ success: boolean; bestScore: number; message: string }>("/api/game/save", payload);
  return response.data;
}

export async function getLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  const response = await api.get<{ entries: LeaderboardEntry[] }>("/api/leaderboard");
  return response.data;
}
