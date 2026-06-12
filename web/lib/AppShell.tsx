"use client";

import { GhostButton, NavLink, Panel, Shell } from "@/src/components/ui";
import { GameRouteSelect } from "@/src/features/navigation/GameRouteSelect";
import { useAuth } from "./AuthProvider";

/**
 * Shared shell for authenticated routes with navigation and sign-out controls.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <Shell>
      <Panel>
        <div className="p-5 sm:p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-500 uppercase">MedhaTile</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">
                Train your memory
              </h1>
              <p className="mt-1 text-sm text-slate-500">Signed in as {session.user.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <GameRouteSelect />
              <NavLink href="/leaderboard">Leaderboard</NavLink>
              <GhostButton onClick={signOut} type="button">
                Logout
              </GhostButton>
            </div>
          </header>
          {children}
        </div>
      </Panel>
    </Shell>
  );
}
