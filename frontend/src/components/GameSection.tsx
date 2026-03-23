import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_MODES, getDifficultyConfig } from "../lib/difficulty";
import { extendPattern } from "../lib/extendPattern";
import { generatePattern } from "../lib/generatePattern";
import { fetchPatternFromApi } from "../services/api";
import type { DifficultyConfig, DifficultyMode, GameState, Phase } from "../types/game";
import { Grid } from "./Grid";
import { Header } from "./Header";

const BEST_SCORE_KEY = "medhatile_best_score";
const REVEAL_BLINK_DURATION_MS = 1000;
const REVEAL_DURATION_MS = 1000;
const REVIEW_BLINK_DURATION_MS = 1000;
const BETWEEN_ROUNDS_MS = 450;
const MAX_MISTAKES = 3;

/**
 * Creates the initial game state for the selected difficulty.
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
 * Renders the main memory-training game and coordinates round progression.
 */
export function GameSection() {
  const revealTimeoutRef = useRef<number | null>(null);
  const revealBlinkTimeoutRef = useRef<number | null>(null);
  const revealFrameRef = useRef<number | null>(null);
  const reviewRestartTimeoutRef = useRef<number | null>(null);
  const roundTransitionTimeoutRef = useRef<number | null>(null);
  const roundSuccessTimeoutRef = useRef<number | null>(null);

  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>("easy");
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(getDifficultyConfig("easy")));
  const [wrongSelections, setWrongSelections] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [isRevealBlinkActive, setIsRevealBlinkActive] = useState(false);
  const [isReviewBlinkActive, setIsReviewBlinkActive] = useState(false);

  const currentModeConfig = useMemo(() => getDifficultyConfig(difficultyMode), [difficultyMode]);

  /**
   * Clears timers related to the current reveal phase and reveal blink.
   */
  const clearRevealTimer = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (revealBlinkTimeoutRef.current !== null) {
      window.clearTimeout(revealBlinkTimeoutRef.current);
      revealBlinkTimeoutRef.current = null;
    }

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
      revealFrameRef.current = null;
    }

    setIsRevealBlinkActive(false);
  }, []);

  /**
   * Clears delayed timers used for round completion and round transitions.
   */
  const clearRoundTimers = useCallback(() => {
    if (reviewRestartTimeoutRef.current !== null) {
      window.clearTimeout(reviewRestartTimeoutRef.current);
      reviewRestartTimeoutRef.current = null;
    }

    if (roundTransitionTimeoutRef.current !== null) {
      window.clearTimeout(roundTransitionTimeoutRef.current);
      roundTransitionTimeoutRef.current = null;
    }

    if (roundSuccessTimeoutRef.current !== null) {
      window.clearTimeout(roundSuccessTimeoutRef.current);
      roundSuccessTimeoutRef.current = null;
    }

    setIsReviewBlinkActive(false);
  }, []);

  /**
   * Starts the reveal countdown and the shorter reveal blink effect.
   */
  const scheduleRevealEnd = useCallback(() => {
    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
    }

    setIsRevealBlinkActive(true);
    revealFrameRef.current = window.requestAnimationFrame(() => {
      revealBlinkTimeoutRef.current = window.setTimeout(() => {
        setIsRevealBlinkActive(false);
      }, REVEAL_BLINK_DURATION_MS);

      revealTimeoutRef.current = window.setTimeout(() => {
        setGameState((prev) => (prev.phase === "reveal" ? { ...prev, phase: "recall" } : prev));
      }, REVEAL_DURATION_MS);
    });
  }, []);

  /**
   * Persists the best score whenever the current run exceeds it.
   */
  const syncBestScore = useCallback((score: number) => {
    setBestScore((prevBest) => {
      const nextBest = Math.max(prevBest, score);
      if (nextBest === prevBest) {
        return prevBest;
      }

      try {
        localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
      } catch {
        // Ignore storage failure in restricted browser modes.
      }

      return nextBest;
    });
  }, []);

  /**
   * Loads and starts a round for the target level and tile count.
   */
  const startRound = useCallback(
    async (targetLevel: number, targetTiles: number, targetScore: number, previousPattern: number[] = []) => {
      clearRevealTimer();
      clearRoundTimers();

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

      const resolvedPattern =
        previousPattern.length > 0
          ? extendPattern(previousPattern, nextPattern, modeConfig.grid, safeTiles)
          : nextPattern;

      setGameState({
        level: targetLevel,
        gridSize: modeConfig.grid,
        tilesToRemember: safeTiles,
        pattern: resolvedPattern,
        userSelections: [],
        mistakes: 0,
        phase: "reveal",
        score: targetScore,
      });
      setIsLoadingRound(false);
      scheduleRevealEnd();
    },
    [clearRevealTimer, clearRoundTimers, difficultyMode, scheduleRevealEnd],
  );

  /**
   * Starts a new run from the currently selected difficulty mode.
   */
  const startGame = useCallback(() => {
    const modeConfig = getDifficultyConfig(difficultyMode);
    setHasStarted(true);
    void startRound(1, modeConfig.startTiles, 0);
  }, [difficultyMode, startRound]);

  /**
   * Advances the player to the next round after a successful recall.
   */
  const handleRoundSuccess = useCallback(() => {
    const modeConfig = getDifficultyConfig(difficultyMode);
    const nextLevel = gameState.level + 1;
    const nextScore = gameState.score + 1;
    const nextTiles = Math.min(gameState.tilesToRemember + 1, modeConfig.maxTiles);
    const scheduledRound = {
      level: nextLevel,
      score: nextScore,
      tiles: nextTiles,
      pattern: [...gameState.pattern],
    };

    syncBestScore(nextScore);

    if (roundTransitionTimeoutRef.current !== null) {
      window.clearTimeout(roundTransitionTimeoutRef.current);
    }

    if (roundSuccessTimeoutRef.current !== null) {
      window.clearTimeout(roundSuccessTimeoutRef.current);
      roundSuccessTimeoutRef.current = null;
    }

    setGameState({
      level: nextLevel,
      gridSize: modeConfig.grid,
      tilesToRemember: nextTiles,
      pattern: [],
      userSelections: [],
      mistakes: 0,
      score: nextScore,
      phase: "idle",
    });
    setIsLoadingRound(true);
    setWrongSelections([]);
    roundTransitionTimeoutRef.current = window.setTimeout(() => {
      roundTransitionTimeoutRef.current = null;
      void startRound(scheduledRound.level, scheduledRound.tiles, scheduledRound.score, scheduledRound.pattern);
    }, BETWEEN_ROUNDS_MS);
  }, [difficultyMode, gameState.level, gameState.pattern, gameState.score, gameState.tilesToRemember, startRound, syncBestScore]);

  /**
   * Handles a tile press during recall and tracks correct or incorrect choices.
   */
  const handleTileClick = useCallback(
    (tileIndex: number) => {
      let wrongSelection: number | null = null;

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

          return {
            ...prev,
            userSelections: updatedSelections,
            phase: hasCompletedRound ? "idle" : prev.phase,
          };
        }

        const nextMistakes = prev.mistakes + 1;
        wrongSelection = tileIndex;

        if (nextMistakes >= MAX_MISTAKES) {
          return { ...prev, mistakes: nextMistakes, phase: "review" };
        }

        return { ...prev, mistakes: nextMistakes };
      });

      if (wrongSelection !== null) {
        const wrongTile = wrongSelection;
        setWrongSelections((currentWrong) => [...currentWrong, wrongTile]);
      }
    },
    [wrongSelections],
  );

  /**
   * Resets the game when the user switches difficulty modes.
   */
  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as DifficultyMode;
    const nextConfig = getDifficultyConfig(nextMode);

    clearRevealTimer();
    clearRoundTimers();
    setDifficultyMode(nextMode);
    setHasStarted(false);
    setIsLoadingRound(false);
    setIsRevealBlinkActive(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(nextConfig));
  };

  /**
   * Returns from the game-over modal to the start screen.
   */
  const returnToStart = useCallback(() => {
    clearRevealTimer();
    clearRoundTimers();
    setHasStarted(false);
    setIsLoadingRound(false);
    setIsRevealBlinkActive(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(getDifficultyConfig(difficultyMode)));
  }, [clearRevealTimer, clearRoundTimers, difficultyMode]);

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

  /**
   * Detects completed rounds and schedules the next-round transition once.
   */
  useEffect(() => {
    if (
      !hasStarted ||
      isLoadingRound ||
      gameState.phase !== "idle" ||
      gameState.pattern.length === 0 ||
      gameState.userSelections.length !== gameState.pattern.length
    ) {
      return;
    }

    if (roundSuccessTimeoutRef.current !== null) {
      return;
    }

    roundSuccessTimeoutRef.current = window.setTimeout(() => {
      roundSuccessTimeoutRef.current = null;
      handleRoundSuccess();
    }, 120);
  }, [
    gameState.pattern.length,
    gameState.phase,
    gameState.userSelections.length,
    handleRoundSuccess,
    hasStarted,
    isLoadingRound,
  ]);

  /**
   * Shows the answer blink after three mistakes, then restarts the same round.
   */
  useEffect(() => {
    if (gameState.phase !== "review" || isLoadingRound) {
      return;
    }

    if (reviewRestartTimeoutRef.current !== null) {
      return;
    }

    setIsReviewBlinkActive(true);
    reviewRestartTimeoutRef.current = window.setTimeout(() => {
      reviewRestartTimeoutRef.current = null;
      void startRound(gameState.level, gameState.tilesToRemember, gameState.score, gameState.pattern);
    }, REVIEW_BLINK_DURATION_MS);
  }, [gameState.level, gameState.pattern, gameState.phase, gameState.score, gameState.tilesToRemember, isLoadingRound, startRound]);

  /**
   * Cleans up active timers when the component unmounts.
   */
  useEffect(() => {
    return () => {
      clearRevealTimer();
      clearRoundTimers();
    };
  }, [clearRevealTimer, clearRoundTimers]);

  const phaseHint: Record<Phase, string> = {
    idle: "Get ready for the next pattern.",
    reveal: "Observe the blue pattern.",
    recall: "Tap the same tiles from memory.",
    review: "Answer view: blue means clicked correct, purple means missed, red means wrong.",
  };

  const totalBlueTiles = gameState.pattern.length > 0 ? gameState.pattern.length : gameState.tilesToRemember;
  const correctTiles = gameState.userSelections.length;
  const remainingTiles = Math.max(totalBlueTiles - correctTiles, 0);

  return (
    <>
      <section className="mx-auto flex min-h-[calc(100dvh-9.5rem)] w-full max-w-5xl flex-col rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-6">
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
            <div className="order-1 flex min-h-[300px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
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
                  blinkReveal={isRevealBlinkActive}
                  blinkAnswers={isReviewBlinkActive}
                  onTileClick={handleTileClick}
                />
              )}
            </div>

            <aside className="order-2 w-full shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:w-72">
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
    </>
  );
}
