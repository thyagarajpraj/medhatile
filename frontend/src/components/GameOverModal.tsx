type GameOverModalProps = {
  open: boolean;
  score: number;
  bestScore: number;
  onRestart: () => void;
};

export function GameOverModal({ open, score, bestScore, onRestart }: GameOverModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">Training Complete</h2>
        <p className="mt-2 text-sm text-slate-600">Review your score and start the next run.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-center">
            <p className="text-xs uppercase text-slate-500">Score</p>
            <p className="text-2xl font-bold text-slate-900">{score}</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-3 text-center">
            <p className="text-xs uppercase text-slate-500">Best</p>
            <p className="text-2xl font-bold text-slate-900">{bestScore}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          Restart Training
        </button>
      </div>
    </div>
  );
}