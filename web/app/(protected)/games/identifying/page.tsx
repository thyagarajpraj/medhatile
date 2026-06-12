"use client";

import { IdentifyingTilesPage } from "@/src/features/identifying/IdentifyingTilesPage";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Identifying Tiles game route.
 */
export default function IdentifyingRoutePage() {
  const { session, setSession, signOut } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <IdentifyingTilesPage
      accountBestScore={session.user.bestScore}
      accountEmail={session.user.email}
      onAccountBestScoreChange={(bestScore) => {
        setSession({
          ...session,
          user: {
            ...session.user,
            bestScore,
          },
        });
      }}
      onSignOut={signOut}
      onUnauthorized={signOut}
    />
  );
}
