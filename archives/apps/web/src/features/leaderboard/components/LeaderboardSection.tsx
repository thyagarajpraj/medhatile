import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, setAuthToken } from "@medhatile/api";
import type { LeaderboardEntry } from "@medhatile/types";

type LeaderboardSectionProps = {
  authToken: string;
};

/**
 * Renders the authenticated leaderboard view using the shared API package.
 */
export function LeaderboardSection({ authToken }: LeaderboardSectionProps) {
  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", authToken],
    queryFn: async () => {
      setAuthToken(authToken);
      return getLeaderboard();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const entries = leaderboardQuery.data?.entries ?? [];

  return (
    <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Leaderboard</h2>
        <p className="mt-1 text-sm text-slate-600">Top MedhaTile scores across the shared backend.</p>
      </div>

      {leaderboardQuery.isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Loading leaderboard...</div>
      ) : leaderboardQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {leaderboardQuery.error instanceof Error ? leaderboardQuery.error.message : "Failed to load leaderboard"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="grid grid-cols-[72px_1fr_110px] gap-3 border-b border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Score</span>
          </div>
          {entries.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-600">No leaderboard entries yet.</div>
          ) : (
            entries.map((entry: LeaderboardEntry, index: number) => (
              <div
                key={entry.id}
                className="grid grid-cols-[72px_1fr_110px] gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-700 first:border-t-0"
              >
                <span className="font-semibold text-slate-500">#{index + 1}</span>
                <div>
                  <p className="font-semibold text-slate-900">{entry.email}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{entry.mode}</p>
                </div>
                <span className="text-right font-bold text-slate-900">{entry.score}</span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
