"use client";

import { useRouter } from "next/navigation";
import { Muted } from "@/src/components/ui";
import { cn } from "@/src/lib/cn";

const games = [
  {
    href: "/games/adding",
    kicker: "2048",
    title: "Merge matching numbers and keep the board alive.",
    description: "Combine tiles to reach higher numbers and save your score.",
    emoji: "🔢",
    accent: "from-sky-500/15 to-blue-600/5 border-sky-200/80 hover:border-sky-300",
  },
  {
    href: "/games/identifying",
    kicker: "Identifying Tiles",
    title: "Memorize the pattern, then recall the same tiles.",
    description: "Train memory and focus through timed recall rounds.",
    emoji: "🧠",
    accent: "from-violet-500/15 to-purple-600/5 border-violet-200/80 hover:border-violet-300",
  },
] as const;

/**
 * Choose-game landing screen for authenticated users.
 */
export default function HomePage() {
  const router = useRouter();

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">Choose your challenge</h2>
        <Muted className="mt-1">Pick the kind of tile game you want to play this session.</Muted>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {games.map((game) => (
          <button
            key={game.href}
            type="button"
            className={cn(
              "group grid gap-3 rounded-3xl border bg-gradient-to-br p-6 text-left shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl",
              game.accent,
            )}
            onClick={() => router.push(game.href)}
          >
            <span className="text-3xl">{game.emoji}</span>
            <span className="text-[0.72rem] font-extrabold tracking-[0.14em] text-brand-600 uppercase">
              {game.kicker}
            </span>
            <strong className="text-base leading-snug font-bold text-brand-900">{game.title}</strong>
            <Muted className="text-sm">{game.description}</Muted>
            <span className="text-sm font-bold text-brand-600 group-hover:underline">Play now →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
