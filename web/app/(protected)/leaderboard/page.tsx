"use client";

import { LeaderboardView } from "@/src/features/leaderboard/LeaderboardView";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Leaderboard route for authenticated users.
 */
export default function LeaderboardPage() {
  const { signOut } = useAuth();

  return (
    <div className="page-grid">
      <LeaderboardView onUnauthorized={signOut} />
    </div>
  );
}
