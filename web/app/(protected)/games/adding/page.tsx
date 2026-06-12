"use client";

import { AddingGamePage } from "@/src/features/adding/AddingGamePage";
import { useAuth } from "@/lib/AuthProvider";

/**
 * 2048 game route.
 */
export default function AddingRoutePage() {
  const { session, setSession } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AddingGamePage
      session={session}
      onSessionChange={(nextSession) => {
        setSession(nextSession);
      }}
    />
  );
}
