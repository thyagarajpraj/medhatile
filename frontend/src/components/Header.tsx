import type { Phase } from "../types/game";

type HeaderProps = {
  level: number;
  modeLabel: string;
  score: number;
  bestScore: number;
  mistakes: number;
  maxMistakes: number;
  phase: Phase;
};

const phaseLabelMap: Record<Phase, string> = {
  idle: "Ready",
  reveal: "Observe",
  recall: "Recall",
  review: "Answer",
};

/**
 * Displays top-level game metadata and current session stats.
 */
export function Header({
  level,
  modeLabel,
  score,
  bestScore,
  mistakes,
  maxMistakes,
  phase,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-3">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">MedhaTile</h1>
      <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">Build your mind, one tile at a time.</p>

      <div className="mt-3 flex flex-col gap-2">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Game Stats</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:text-xs">
            <span className="rounded-full bg-white px-2.5 py-0.5">Phase: {phaseLabelMap[phase]}</span>
            <span className="rounded-full bg-white px-2.5 py-0.5">Mode: {modeLabel}</span>
            <span className="rounded-full bg-white px-2.5 py-0.5">Level: {level}</span>
            <span className="rounded-full bg-white px-2.5 py-0.5">Score: {score}</span>
            <span className="rounded-full bg-white px-2.5 py-0.5">Best: {bestScore}</span>
            <span className="rounded-full bg-white px-2.5 py-0.5">
              Mistakes: {mistakes}/{maxMistakes}
            </span>
          </div>
        </section>
      </div>
    </header>
  );
}
