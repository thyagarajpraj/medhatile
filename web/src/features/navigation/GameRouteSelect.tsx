"use client";

import { type ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/src/lib/cn";

/**
 * Resolves the currently selected game route for the shared game switcher.
 */
function getSelectedGameRoute(pathname: string): string {
  if (pathname === "/games/identifying") {
    return "/games/identifying";
  }

  if (pathname === "/games/adding") {
    return "/games/adding";
  }

  return "/";
}

/**
 * Renders the shared game-selection dropdown used by protected routes.
 */
export function GameRouteSelect({ id = "game-switcher" }: { id?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Routes the user to the selected game or landing page.
   */
  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    router.push(event.target.value);
  }

  return (
    <>
      <label className="sr-only" htmlFor={id}>
        Choose a tile game
      </label>
      <select
        id={id}
        className={cn(
          "min-h-11 min-w-[170px] cursor-pointer rounded-full border border-slate-200 bg-white/95 px-4 py-2.5 text-sm font-bold text-brand-900 shadow-sm transition hover:border-brand-300",
        )}
        value={getSelectedGameRoute(pathname)}
        onChange={handleChange}
        aria-label="Choose a tile game"
      >
        <option value="/">Choose Game</option>
        <option value="/games/adding">2048</option>
        <option value="/games/identifying">Identifying Tiles</option>
      </select>
    </>
  );
}
