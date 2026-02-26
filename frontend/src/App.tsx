import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "./components/Grid";
import { Header } from "./components/Header";
import { DIFFICULTY_MODES, getDifficultyConfig } from "./lib/difficulty";
import { generatePattern } from "./lib/generatePattern";
import { fetchGameConfigFromApi, fetchPatternFromApi } from "./services/api";
import type { DifficultyConfig, DifficultyMode, GameState, Phase } from "./types/game";

const BEST_SCORE_KEY_PREFIX = "medhatile_best_score";
const LEGACY_BEST_KEYS = [
  "medhatile_best_score",
  "medhatile_best_score_easy",
  "medhatile_best_score_medium",
  "medhatile_best_score_hard",
];
const REVEAL_DURATION_MS = 3000;
const BETWEEN_ROUNDS_MS = 450;
const REVIEW_FEEDBACK_MS = 1000;
const DEFAULT_ROUNDS_PER_LEVEL = 5;
const MAX_MISTAKES = 3;

/**
 * Builds a clean game state based on the selected difficulty configuration.
 */
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

/**
 * Builds an in-memory key for best-score entries by mode and level.
 */
function getModeLevelKey(mode: DifficultyMode, level: number): string {
  return `${mode}_L${level}`;
}

/**
 * Returns the storage key for a mode-level-specific best score value.
 */
function getBestScoreStorageKey(mode: DifficultyMode, level: number): string {
  return `${BEST_SCORE_KEY_PREFIX}_${getModeLevelKey(mode, level)}`;
}

/**
 * Main game container that controls phase transitions, scoring, and round lifecycle.
 */
function App() {
  const revealTimeoutRef = useRef<number | null>(null);
  const revealFrameRef = useRef<number | null>(null);
  const reviewTimeoutRef = useRef<number | null>(null);
  const betweenRoundsTimeoutRef = useRef<number | null>(null);

  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>("easy");
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(getDifficultyConfig("easy")),
  );
  const [wrongSelections, setWrongSelections] = useState<number[]>([]);
  const [modeLevelBestScores, setModeLevelBestScores] = useState<Record<string, number>>({});
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [roundsPerLevel, setRoundsPerLevel] = useState(DEFAULT_ROUNDS_PER_LEVEL);

  const currentModeConfig = useMemo(() => getDifficultyConfig(difficultyMode), [difficultyMode]);
  const currentModeLevelKey = useMemo(
    () => getModeLevelKey(difficultyMode, gameState.level),
    [difficultyMode, gameState.level],
  );
  const bestScore = modeLevelBestScores[currentModeLevelKey] ?? 0;

  /**
   * Clears all active timers/animation frames used by reveal, review, and round transitions.
   */
  const clearRevealTimer = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
      revealFrameRef.current = null;
    }

    if (reviewTimeoutRef.current !== null) {
      window.clearTimeout(reviewTimeoutRef.current);
      reviewTimeoutRef.current = null;
    }

    if (betweenRoundsTimeoutRef.current !== null) {
      window.clearTimeout(betweenRoundsTimeoutRef.current);
      betweenRoundsTimeoutRef.current = null;
    }
  }, []);

  /**
   * Schedules reveal completion and automatically moves the game into recall phase.
   */
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

  /**
   * Starts a round for a target level/tiles/score snapshot and loads pattern data.
   */
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

  /**
   * Initializes the first playable round for the current difficulty mode.
   */
  const startGame = useCallback(() => {
    const modeConfig = getDifficultyConfig(difficultyMode);
    setHasStarted(true);
    void startRound(1, modeConfig.startTiles, 0);
  }, [difficultyMode, startRound]);

  /**
   * Handles successful completion of a round and schedules another round
   * at the same level/difficulty.
   */
  const handleRoundSuccess = useCallback(() => {
    setGameState((prev) => {
      const nextScore = prev.score + 1;
      const roundsPerLevelSafe = Math.max(1, roundsPerLevel);
      const nextLevel = Math.floor(nextScore / roundsPerLevelSafe) + 1;
      const nextTiles = prev.tilesToRemember;
      const completedRoundLevelKey = getModeLevelKey(difficultyMode, prev.level);

      setModeLevelBestScores((prevBestScores) => {
        const currentModeBest = prevBestScores[completedRoundLevelKey] ?? 0;
        const nextBest = Math.max(currentModeBest, nextScore);
        if (nextBest === currentModeBest) {
          return prevBestScores;
        }

        try {
          localStorage.setItem(getBestScoreStorageKey(difficultyMode, prev.level), String(nextBest));
        } catch {
          // Ignore storage failure in restricted browser modes.
        }

        return { ...prevBestScores, [completedRoundLevelKey]: nextBest };
      });

      setIsLoadingRound(true);
      setWrongSelections([]);

      if (betweenRoundsTimeoutRef.current !== null) {
        window.clearTimeout(betweenRoundsTimeoutRef.current);
      }

      betweenRoundsTimeoutRef.current = window.setTimeout(() => {
        void startRound(nextLevel, nextTiles, nextScore);
      }, BETWEEN_ROUNDS_MS);

      return {
        level: nextLevel,
        gridSize: prev.gridSize,
        tilesToRemember: nextTiles,
        pattern: [],
        userSelections: [],
        mistakes: 0,
        score: nextScore,
        phase: "idle",
      };
    });
  }, [difficultyMode, roundsPerLevel, startRound]);

  /**
   * Temporarily shows answer feedback and then resumes recall on the same round.
   */
  const resumeRecallAfterReview = useCallback(() => {
    if (reviewTimeoutRef.current !== null) {
      window.clearTimeout(reviewTimeoutRef.current);
    }

    reviewTimeoutRef.current = window.setTimeout(() => {
      setGameState((prev) => (prev.phase === "review" ? { ...prev, phase: "recall" } : prev));
    }, REVIEW_FEEDBACK_MS);
  }, []);

  /**
   * Handles tile interactions during recall and routes success/failure transitions.
   */
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

        if (nextMistakes === MAX_MISTAKES) {
          resumeRecallAfterReview();
          return { ...prev, mistakes: nextMistakes, phase: "review" };
        }

        return { ...prev, mistakes: nextMistakes };
      });
    },
    [handleRoundSuccess, resumeRecallAfterReview, wrongSelections],
  );

  /**
   * Resets game state when the player selects a new difficulty mode.
   */
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

  /**
   * Returns the player to the start view while preserving selected difficulty.
   */
  const returnToStart = useCallback(() => {
    clearRevealTimer();
    setHasStarted(false);
    setIsLoadingRound(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(getDifficultyConfig(difficultyMode)));
  }, [clearRevealTimer, difficultyMode]);

  /**
   * Clears all stored best scores (legacy and mode-level keys).
   */
  const clearStoredBestScores = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key) {
          continue;
        }

        if (key === BEST_SCORE_KEY_PREFIX || key.startsWith(`${BEST_SCORE_KEY_PREFIX}_`)) {
          keysToRemove.push(key);
        }
      }

      LEGACY_BEST_KEYS.forEach((key) => keysToRemove.push(key));
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage clear failures.
    }

    setModeLevelBestScores({});
  }, []);

  useEffect(() => {
    try {
      LEGACY_BEST_KEYS.forEach((key) => localStorage.removeItem(key));
      const loadedBestScores: Record<string, number> = {};

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(`${BEST_SCORE_KEY_PREFIX}_`)) {
          continue;
        }

        const value = Number(localStorage.getItem(key) ?? "0");
        if (!Number.isNaN(value) && value > 0) {
          const mapKey = key.slice(`${BEST_SCORE_KEY_PREFIX}_`.length);
          loadedBestScores[mapKey] = value;
        }
      }

      setModeLevelBestScores(loadedBestScores);
    } catch {
      // Ignore storage read failures.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    /**
     * Loads level progression config from backend and applies safe fallback.
     */
    const loadGameConfig = async () => {
      try {
        const config = await fetchGameConfigFromApi();
        if (!cancelled) {
          setRoundsPerLevel(Math.max(1, config.roundsPerLevel));
        }
      } catch {
        // Keep defaults when config endpoint is unavailable.
      }
    };

    void loadGameConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => clearRevealTimer();
  }, [clearRevealTimer]);

  const phaseHint: Record<Phase, string> = {
    idle: "Get ready for the next pattern.",
    reveal: "Observe the blue pattern.",
    recall: "Tap the same tiles from memory.",
    review: "Three mistakes reached. Correct tiles are blinking for 1 second.",
    gameover: "Round complete.",
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
              <p className="mt-4 text-sm text-slate-500">
                Best ({currentModeConfig.label} L{gameState.level}): {bestScore}
              </p>
              <button
                type="button"
                onClick={clearStoredBestScores}
                className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Clear Best Scores
              </button>
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
                  blinkAnswers={gameState.phase === "review"}
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

              <div className="mt-4">
                <button
                  type="button"
                  onClick={returnToStart}
                  className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Back to Start
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
