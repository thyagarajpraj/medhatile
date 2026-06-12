"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@medhatile/shared-api";
import type { LeaderboardEntry } from "@medhatile/shared-types";
import { Card, Muted, StatusBanner } from "@/src/components/ui";
import { cn } from "@/src/lib/cn";

type LeaderboardViewProps = {
  onUnauthorized: () => void;
};

const rankStyles = [
  "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50",
  "border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100",
  "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50",
] as const;

/**
 * Loads and renders leaderboard entries for the current user.
 */
export function LeaderboardView({ onUnauthorized }: LeaderboardViewProps) {
  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        return await getLeaderboard();
      } catch (error) {
        const status =
          typeof error === "object" && error && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 401) {
          onUnauthorized();
        }

        throw error;
      }
    },
  });

  const entries: LeaderboardEntry[] = leaderboardQuery.data?.entries ?? [];

  return (
    <Card>
      <h2 className="text-xl font-bold text-brand-900">Leaderboard</h2>
      <Muted className="mt-1">Top saved scores from the shared backend.</Muted>

      {leaderboardQuery.isLoading ? <StatusBanner className="mt-4">Loading leaderboard...</StatusBanner> : null}
      {leaderboardQuery.isError ? (
        <StatusBanner className="mt-4" variant="error">
          Unable to load the leaderboard.
        </StatusBanner>
      ) : null}

      <div className="mt-5 grid gap-3">
        {entries.map((entry, index) => (
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-sm",
              index < 3 ? rankStyles[index] : "border-slate-200/80 bg-white/90",
            )}
            key={entry.id}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold",
                  index === 0 && "bg-amber-400 text-amber-950",
                  index === 1 && "bg-slate-300 text-slate-800",
                  index === 2 && "bg-orange-300 text-orange-950",
                  index > 2 && "bg-brand-100 text-brand-800",
                )}
              >
                {index + 1}
              </span>
              <span className="font-semibold text-brand-900">{entry.email}</span>
            </div>
            <span className="text-lg font-extrabold text-brand-700">{entry.score}</span>
          </div>
        ))}
        {!leaderboardQuery.isLoading && entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-slate-500">
            No scores yet. Play a game and save your first score!
          </div>
        ) : null}
      </div>
    </Card>
  );
}
