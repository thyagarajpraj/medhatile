import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameOverModal } from "./components/GameOverModal";
import { Grid } from "./components/Grid";
import { Header } from "./components/Header";
import { DIFFICULTY_MODES, getDifficultyConfig } from "./lib/difficulty";
import { generatePattern } from "./lib/generatePattern";
import { fetchPatternFromApi } from "./services/api";
import type { DifficultyConfig, DifficultyMode, GameState, Phase } from "./types/game";

const BEST_SCORE_KEY = "medhatile_best_score";
const REVEAL_DURATION_MS = 3000;
const BETWEEN_ROUNDS_MS = 450;
const MAX_MISTAKES = 3;

function createInitialGameState(config: DifficultyConfig): GameState {
  return {
    level: 1,
    gridSize: config.grid,
    tilesToRemember: config.startTiles,
    pattern: [],
    userSelections: [],
    mistakes: 0,
    phase: "idle",
    score: 0,
  };
}

function App() {
  const revealTimeoutRef = useRef<number | null>(null);
  const revealFrameRef = useRef<number | null>(null);

  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>("easy");
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(getDifficultyConfig("easy")),
  );
  const [wrongSelections, setWrongSelections] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);

  const currentModeConfig = useMemo(() => getDifficultyConfig(difficultyMode), [difficultyMode]);

  const clearRevealTimer = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
      revealFrameRef.current = null;
    }
  }, []);

  const scheduleRevealEnd = useCallback(() => {
    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
    }

    revealFrameRef.current = window.requestAnimationFrame(() => {
      revealTimeoutRef.current = window.setTimeout(() => {
        setGameState((prev) => (prev.phase === "reveal" ? { ...prev, phase: "recall" } : prev));
      }, REVEAL_DURATION_MS);
    });
  }, []);

  const finishGame = useCallback(
    (finalScore: number) => {
      clearRevealTimer();
      setGameState((prev) => ({ ...prev, phase: "gameover" }));

      setBestScore((prevBest) => {
        const nextBest = Math.max(prevBest, finalScore);
        try {
          localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
        } catch {
          // Ignore storage failure in restricted browser modes.
        }
        return nextBest;
      });
    },
    [clearRevealTimer],
  );

  const showGameOverAfterReview = useCallback(() => {
    finishGame(gameState.score);
  }, [finishGame, gameState.score]);

  const startRound = useCallback(
    async (targetLevel: number, targetTiles: number, targetScore: number) => {
      clearRevealTimer();

      const modeConfig = getDifficultyConfig(difficultyMode);
      const safeTiles = Math.max(modeConfig.startTiles, Math.min(targetTiles, modeConfig.maxTiles));

      setIsLoadingRound(true);
      setWrongSelections([]);
      setGameState({
        level: targetLevel,
        gridSize: modeConfig.grid,
        tilesToRemember: safeTiles,
        pattern: [],
        userSelections: [],
        mistakes: 0,
        phase: "idle",
        score: targetScore,
      });

      let nextPattern: number[] = [];
      try {
        nextPattern = await fetchPatternFromApi(modeConfig.grid, safeTiles);
      } catch {
        nextPattern = generatePattern(modeConfig.grid, safeTiles);
      }

      setGameState({
        level: targetLevel,
        gridSize: modeConfig.grid,
        tilesToRemember: safeTiles,
        pattern: nextPattern,
        userSelections: [],
        mistakes: 0,
        phase: "reveal",
        score: targetScore,
      });
      setIsLoadingRound(false);
      scheduleRevealEnd();
    },
    [clearRevealTimer, difficultyMode, scheduleRevealEnd],
  );

  const startGame = useCallback(() => {
    const modeConfig = getDifficultyConfig(difficultyMode);
    setHasStarted(true);
    void startRound(1, modeConfig.startTiles, 0);
  }, [difficultyMode, startRound]);

  const handleRoundSuccess = useCallback(() => {
    setGameState((prev) => {
      const modeConfig = getDifficultyConfig(difficultyMode);
      const nextLevel = prev.level + 1;
      const nextScore = prev.score + 1;
      const nextTiles = Math.min(prev.tilesToRemember + 1, modeConfig.maxTiles);

      setIsLoadingRound(true);
      setWrongSelections([]);

      window.setTimeout(() => {
        void startRound(nextLevel, nextTiles, nextScore);
      }, BETWEEN_ROUNDS_MS);

      return {
        level: nextLevel,
        gridSize: modeConfig.grid,
        tilesToRemember: nextTiles,
        pattern: [],
        userSelections: [],
        mistakes: 0,
        score: nextScore,
        phase: "idle",
      };
    });
  }, [difficultyMode, startRound]);

  const handleTileClick = useCallback(
    (tileIndex: number) => {
      setGameState((prev) => {
        if (prev.phase !== "recall") {
          return prev;
        }

        if (prev.userSelections.includes(tileIndex) || wrongSelections.includes(tileIndex)) {
          return prev;
        }

        const isCorrect = prev.pattern.includes(tileIndex);
        if (isCorrect) {
          const updatedSelections = [...prev.userSelections, tileIndex];
          const hasCompletedRound = updatedSelections.length === prev.pattern.length;

          if (hasCompletedRound) {
            window.setTimeout(() => {
              handleRoundSuccess();
            }, 120);
          }

          return { ...prev, userSelections: updatedSelections };
        }

        const nextMistakes = prev.mistakes + 1;
        setWrongSelections((currentWrong) => [...currentWrong, tileIndex]);

        if (nextMistakes >= MAX_MISTAKES) {
          return { ...prev, mistakes: nextMistakes, phase: "review" };
        }

        return { ...prev, mistakes: nextMistakes };
      });
    },
    [handleRoundSuccess, wrongSelections],
  );

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as DifficultyMode;
    const nextConfig = getDifficultyConfig(nextMode);

    clearRevealTimer();
    setDifficultyMode(nextMode);
    setHasStarted(false);
    setIsLoadingRound(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(nextConfig));
  };

  const returnToStart = useCallback(() => {
    clearRevealTimer();
    setHasStarted(false);
    setIsLoadingRound(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(getDifficultyConfig(difficultyMode)));
  }, [clearRevealTimer, difficultyMode]);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(BEST_SCORE_KEY) ?? "0");
      if (!Number.isNaN(stored) && stored > 0) {
        setBestScore(stored);
      }
    } catch {
      // Ignore storage read failures.
    }
  }, []);

  useEffect(() => {
    return () => clearRevealTimer();
  }, [clearRevealTimer]);

  const phaseHint: Record<Phase, string> = {
    idle: "Get ready for the next pattern.",
    reveal: "Observe the blue pattern.",
    recall: "Tap the same tiles from memory.",
    review: "Answer view: blue means clicked correct, purple means missed, red means wrong.",
    gameover: "Round complete. Review score and restart.",
  };

  const totalBlueTiles = gameState.pattern.length > 0 ? gameState.pattern.length : gameState.tilesToRemember;
  const correctTiles = gameState.userSelections.length;
  const remainingTiles = Math.max(totalBlueTiles - correctTiles, 0);

  return (
    <main className="min-h-dvh overflow-y-auto bg-[radial-gradient(circle_at_20%_10%,_#eef2ff_0%,_#f8f9fa_55%,_#e2e8f0_100%)] px-3 py-3 sm:px-4 sm:py-4">
      <section className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-6">
        <Header
          level={gameState.level}
          modeLabel={currentModeConfig.label}
          score={gameState.score}
          bestScore={bestScore}
          mistakes={gameState.mistakes}
          maxMistakes={MAX_MISTAKES}
          phase={gameState.phase}
        />

        {!hasStarted ? (
          <div className="mt-4 flex flex-1 items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <label htmlFor="difficultyMode" className="text-sm font-semibold text-slate-700">
                  Difficulty
                </label>
                <select
                  id="difficultyMode"
                  value={difficultyMode}
                  onChange={handleModeChange}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-500"
                >
                  {DIFFICULTY_MODES.map((mode) => (
                    <option key={mode.mode} value={mode.mode}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mx-auto max-w-md text-sm leading-6 text-slate-600 sm:text-base">
                Train memory and focus through timed recall rounds with gradually increasing challenge.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Start Training
              </button>
              <p className="mt-4 text-sm text-slate-500">Best Score: {bestScore}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
            <div className="order-2 flex min-h-[300px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 p-3 lg:order-1">
              {isLoadingRound ? (
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                  Preparing round...
                </div>
              ) : (
                <Grid
                  gridSize={gameState.gridSize}
                  pattern={gameState.pattern}
                  userSelections={gameState.userSelections}
                  wrongSelections={wrongSelections}
                  phase={gameState.phase}
                  onTileClick={handleTileClick}
                />
              )}
            </div>

            <aside className="order-1 w-full shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:order-2 lg:w-72">
              <section className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tile Progress</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5">Blue Tiles: {totalBlueTiles}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5">Correct: {correctTiles}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5">Remaining: {remainingTiles}</span>
                </div>
              </section>

              <p className="mt-3 text-sm font-medium text-slate-600">{phaseHint[gameState.phase]}</p>

              {gameState.phase === "review" && (
                <div className="mt-3 flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide">
                  <span className="rounded-full border border-sky-300 bg-sky-100 px-3 py-1 text-sky-800">
                    [OK] Clicked Correct
                  </span>
                  <span className="rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-violet-800">
                    [.] Missed Correct
                  </span>
                  <span className="rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-rose-800">
                    [WRONG] Wrong Click
                  </span>
                </div>
              )}

              {gameState.phase === "review" && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={showGameOverAfterReview}
                    className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>

      <GameOverModal
        open={gameState.phase === "gameover"}
        score={gameState.score}
        bestScore={bestScore}
        onRestart={returnToStart}
      />
    </main>
  );
}

export default App;
