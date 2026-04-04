import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, saveScore } from "@medhatile/shared-api";
import {
  createInitialGameState,
  DIFFICULTY_MODES,
  extendPattern,
  generatePattern,
  getDifficultyConfig,
  type DifficultyMode,
  type IdentifyGameState,
  type Phase,
} from "./logic";
import { GameRouteSelect } from "../navigation/GameRouteSelect";

const BEST_SCORE_KEY = "medhatile_best_score";
const LEGACY_BEST_SCORE_KEY = "medhatile_identifying_best_score";
const REVEAL_BLINK_DURATION_MS = 1000;
const REVEAL_DURATION_MS = 1000;
const REVIEW_BLINK_DURATION_MS = 1000;
const BETWEEN_ROUNDS_MS = 450;
const MAX_MISTAKES = 3;
type TileState = "default" | "reveal" | "selected_correct" | "answer" | "wrong";
type IdentifyingTilesPageProps = {
  accountBestScore: number;
  accountEmail: string;
  onAccountBestScoreChange: (bestScore: number) => void;
  onSignOut: () => void;
  onUnauthorized: () => void;
};

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready",
  reveal: "Observe",
  recall: "Recall",
  review: "Answer",
};

const PHASE_HINTS: Record<Phase, string> = {
  idle: "Get ready for the next pattern.",
  reveal: "Observe the highlighted tiles.",
  recall: "Tap the same tiles from memory.",
  review: "Blue means clicked correct, purple means missed, red means wrong.",
};

/**
 * Returns whether the provided error represents an unauthorized API response.
 */
function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { response?: { status?: number } }).response?.status === 401;
}

/**
 * Saves the latest identifying-game best score to browser storage.
 */
function persistLocalBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Ignore storage write failures.
  }
}

/**
 * Reads the current or legacy identifying-game best score from browser storage.
 */
function readLocalBestScore(): number {
  try {
    const storedBest = Number(localStorage.getItem(BEST_SCORE_KEY) ?? "0");
    const legacyStoredBest = Number(localStorage.getItem(LEGACY_BEST_SCORE_KEY) ?? "0");
    const nextBest = Math.max(
      Number.isNaN(storedBest) ? 0 : storedBest,
      Number.isNaN(legacyStoredBest) ? 0 : legacyStoredBest,
    );

    if (nextBest > 0) {
      localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
    }

    return nextBest;
  } catch {
    return 0;
  }
}

/**
 * Requests the next identifying pattern from the backend.
 */
async function fetchPatternFromApi(gridSize: number, count: number): Promise<number[]> {
  const response = await api.get<{ pattern: number[] }>("/api/game/pattern", {
    params: { gridSize, count },
  });

  if (!Array.isArray(response.data.pattern) || response.data.pattern.length !== count) {
    throw new Error("Invalid pattern payload");
  }

  return response.data.pattern;
}

/**
 * Renders the identifying-game tile grid and per-tile answer states.
 */
function MemoryBoard({
  gridSize,
  pattern,
  userSelections,
  wrongSelections,
  phase,
  blinkReveal,
  blinkAnswers,
  onTileClick,
}: {
  gridSize: number;
  pattern: number[];
  userSelections: number[];
  wrongSelections: number[];
  phase: Phase;
  blinkReveal: boolean;
  blinkAnswers: boolean;
  onTileClick: (index: number) => void;
}) {
  const totalTiles = gridSize * gridSize;
  const patternSet = new Set(pattern);
  const selectionSet = new Set(userSelections);
  const wrongSet = new Set(wrongSelections);
  const boardMaxWidth = gridSize >= 8 ? 300 : gridSize >= 6 ? 360 : 430;

  const getState = (index: number): TileState => {
    if (phase === "reveal" && patternSet.has(index)) {
      return "reveal";
    }

    if (wrongSet.has(index)) {
      return "wrong";
    }

    if (selectionSet.has(index) && patternSet.has(index)) {
      return "selected_correct";
    }

    if (phase === "review" && patternSet.has(index)) {
      return "answer";
    }

    return "default";
  };

  const getTileAriaLabel = (index: number, tileState: TileState): string => {
    const tileNumber = index + 1;

    if (tileState === "reveal") {
      return `Tile ${tileNumber}, highlighted target tile`;
    }

    if (tileState === "selected_correct") {
      return `Tile ${tileNumber}, correct selection`;
    }

    if (tileState === "answer") {
      return `Tile ${tileNumber}, missed correct answer`;
    }

    if (tileState === "wrong") {
      return `Tile ${tileNumber}, wrong selection`;
    }

    return `Tile ${tileNumber}, hidden`;
  };

  return (
    <div className="identify-board-frame" style={{ maxWidth: `${boardMaxWidth}px` }}>
      <div
        className="memory-board"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`${gridSize} by ${gridSize} memory tile board`}
      >
        {Array.from({ length: totalTiles }).map((_, index) => {
          const tileState = getState(index);
          const shouldBlink =
            (blinkReveal && tileState === "reveal") ||
            (blinkAnswers && (tileState === "answer" || tileState === "selected_correct"));
          const marker =
            tileState === "selected_correct" ? "OK" : tileState === "answer" ? "." : tileState === "wrong" ? "X" : "";

          return (
            <button
              key={index}
              type="button"
              className="tile memory-tile"
              data-state={tileState}
              data-blink={shouldBlink ? "true" : "false"}
              disabled={phase !== "recall"}
              onClick={() => onTileClick(index)}
              aria-label={getTileAriaLabel(index, tileState)}
              aria-pressed={tileState === "selected_correct" || tileState === "wrong"}
            >
              {marker || ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renders the identifying-tiles game screen and coordinates round progression.
 */
export function IdentifyingTilesPage({
  accountBestScore,
  accountEmail,
  onAccountBestScoreChange,
  onSignOut,
  onUnauthorized,
}: IdentifyingTilesPageProps) {
  const revealTimeoutRef = useRef<number | null>(null);
  const revealBlinkTimeoutRef = useRef<number | null>(null);
  const revealFrameRef = useRef<number | null>(null);
  const reviewRestartTimeoutRef = useRef<number | null>(null);
  const roundTransitionTimeoutRef = useRef<number | null>(null);
  const roundSuccessTimeoutRef = useRef<number | null>(null);

  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>("easy");
  const [gameState, setGameState] = useState<IdentifyGameState>(() =>
    createInitialGameState(getDifficultyConfig("easy")),
  );
  const [wrongSelections, setWrongSelections] = useState<number[]>([]);
  const [localBestScore, setLocalBestScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [isRevealBlinkActive, setIsRevealBlinkActive] = useState(false);
  const [isReviewBlinkActive, setIsReviewBlinkActive] = useState(false);

  const currentModeConfig = useMemo(() => getDifficultyConfig(difficultyMode), [difficultyMode]);
  const effectiveBestScore = Math.max(localBestScore, accountBestScore);

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

  const syncLocalBestScore = useCallback((score: number) => {
    setLocalBestScore((previousBest) => {
      const nextBest = Math.max(previousBest, score);

      if (nextBest !== previousBest) {
        persistLocalBestScore(nextBest);
      }

      return nextBest;
    });
  }, []);

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

      const nextPattern = await (async () => {
        try {
          return await fetchPatternFromApi(modeConfig.grid, safeTiles);
        } catch (error) {
          if (isUnauthorizedError(error)) {
            onUnauthorized();
            return null;
          }

          return generatePattern(modeConfig.grid, safeTiles);
        }
      })();

      if (!nextPattern) {
        return;
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
    [clearRevealTimer, clearRoundTimers, difficultyMode, onUnauthorized, scheduleRevealEnd],
  );

  const startGame = useCallback(() => {
    const modeConfig = getDifficultyConfig(difficultyMode);
    setHasStarted(true);
    void startRound(1, modeConfig.startTiles, 0);
  }, [difficultyMode, startRound]);

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

    syncLocalBestScore(nextScore);

    void saveScore({ score: nextScore, level: nextLevel })
      .then((payload) => {
        if (payload.bestScore > accountBestScore) {
          onAccountBestScoreChange(payload.bestScore);
        }
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          onUnauthorized();
        }
      });

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
  }, [
    accountBestScore,
    difficultyMode,
    gameState.level,
    gameState.pattern,
    gameState.score,
    gameState.tilesToRemember,
    onAccountBestScoreChange,
    onUnauthorized,
    startRound,
    syncLocalBestScore,
  ]);

  const handleTileClick = useCallback(
    (tileIndex: number) => {
      if (gameState.phase !== "recall") {
        return;
      }

      if (gameState.userSelections.includes(tileIndex) || wrongSelections.includes(tileIndex)) {
        return;
      }

      if (gameState.pattern.includes(tileIndex)) {
        const updatedSelections = [...gameState.userSelections, tileIndex];
        const hasCompletedRound = updatedSelections.length === gameState.pattern.length;

        setGameState({
          ...gameState,
          userSelections: updatedSelections,
          phase: hasCompletedRound ? "idle" : gameState.phase,
        });
        return;
      }

      const nextMistakes = gameState.mistakes + 1;
      setWrongSelections((currentWrong) => [...currentWrong, tileIndex]);
      setGameState({
        ...gameState,
        mistakes: nextMistakes,
        phase: nextMistakes >= MAX_MISTAKES ? "review" : gameState.phase,
      });
    },
    [gameState, wrongSelections],
  );

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as DifficultyMode;
    const nextConfig = getDifficultyConfig(nextMode);

    clearRevealTimer();
    clearRoundTimers();
    setDifficultyMode(nextMode);
    setHasStarted(false);
    setIsLoadingRound(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(nextConfig));
  };

  const returnToStart = useCallback(() => {
    clearRevealTimer();
    clearRoundTimers();
    setHasStarted(false);
    setIsLoadingRound(false);
    setWrongSelections([]);
    setGameState(createInitialGameState(getDifficultyConfig(difficultyMode)));
  }, [clearRevealTimer, clearRoundTimers, difficultyMode]);

  useEffect(() => {
    const storedBest = readLocalBestScore();

    if (storedBest > 0) {
      setLocalBestScore(storedBest);
    }
  }, []);

  useEffect(() => {
    if (accountBestScore <= localBestScore) {
      return;
    }

    setLocalBestScore(accountBestScore);
    persistLocalBestScore(accountBestScore);
  }, [accountBestScore, localBestScore]);

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
  }, [
    gameState.level,
    gameState.pattern,
    gameState.phase,
    gameState.score,
    gameState.tilesToRemember,
    isLoadingRound,
    startRound,
  ]);

  useEffect(() => {
    return () => {
      clearRevealTimer();
      clearRoundTimers();
    };
  }, [clearRevealTimer, clearRoundTimers]);

  const totalBlueTiles = gameState.pattern.length > 0 ? gameState.pattern.length : gameState.tilesToRemember;
  const correctTiles = gameState.userSelections.length;
  const remainingTiles = Math.max(totalBlueTiles - correctTiles, 0);

  return (
    <main className="shell" aria-labelledby="identifying-page-title">
      <div className="panel identifying-panel identifying-panel-sleek">
        <div className="panel-inner">
          <header className="identifying-header" aria-label="Identifying Tiles header">
            <div>
              <h1 className="identifying-title" id="identifying-page-title">
                MedhaTile
              </h1>
              <p className="identifying-subtitle">Build your mind, one tile at a time.</p>
            </div>
            <div className="identifying-account-actions">
              <span className="identifying-account-chip" aria-label={`Signed in as ${accountEmail}`}>
                {accountEmail}
              </span>
              <GameRouteSelect id="identifying-game-switcher" />
              <button
                className="ghost-button identifying-signout-button"
                type="button"
                onClick={onSignOut}
                aria-label="Sign out of MedhaTile"
              >
                Sign Out
              </button>
            </div>
          </header>

          <section className="identifying-stats-card" aria-labelledby="identifying-game-stats-heading">
            <p className="identifying-section-label" id="identifying-game-stats-heading">
              Game Stats
            </p>
            <div className="identifying-pill-row">
              <span className="identifying-pill">Phase: {PHASE_LABELS[gameState.phase]}</span>
              <span className="identifying-pill">Mode: {currentModeConfig.label}</span>
              <span className="identifying-pill">Level: {gameState.level}</span>
              <span className="identifying-pill">Score: {gameState.score}</span>
              <span className="identifying-pill">Best: {effectiveBestScore}</span>
            </div>
          </section>

          {!hasStarted ? (
            <section className="identifying-start-panel" aria-labelledby="identifying-start-heading">
              <div className="identifying-start-card identifying-surface-soft">
                <h2 className="identifying-start-title" id="identifying-start-heading">
                  Start Your Recall Session
                </h2>
                <div className="identifying-start-controls">
                  <label className="field identifying-difficulty-field">
                    <span>Difficulty</span>
                    <select
                      value={difficultyMode}
                      onChange={handleModeChange}
                      className="select-input"
                      aria-label="Select difficulty mode"
                    >
                      {DIFFICULTY_MODES.map((mode) => (
                        <option key={mode.mode} value={mode.mode}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="identifying-start-copy">
                  Train memory and focus through timed recall rounds with gradually increasing challenge.
                </p>
                <button
                  className="primary-button identifying-start-button"
                  onClick={startGame}
                  type="button"
                  aria-label={`Start identifying tiles game in ${currentModeConfig.label} mode`}
                >
                  Start Training
                </button>
                <p className="muted identifying-start-best">Best Score: {effectiveBestScore}</p>
              </div>
            </section>
          ) : (
            <section className="identifying-game-layout" aria-label="Identifying Tiles game area">
              <section className="identifying-board-panel identifying-surface-soft" aria-labelledby="identifying-board-heading">
                <div className="sr-only" id="identifying-board-heading">
                  Memory board
                </div>
                {isLoadingRound ? (
                  <div className="status identifying-loading-state" aria-live="polite">
                    Preparing round...
                  </div>
                ) : (
                  <MemoryBoard
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
              </section>

              <aside className="identifying-side-panel identifying-surface-soft" aria-labelledby="identifying-progress-heading">
                <section className="identifying-progress-card">
                  <p className="identifying-section-label" id="identifying-progress-heading">
                    Tile Progress
                  </p>
                  <div className="identifying-pill-row identifying-pill-row-compact">
                    <span className="identifying-pill">Blue Tiles: {totalBlueTiles}</span>
                    <span className="identifying-pill">Correct: {correctTiles}</span>
                    <span className="identifying-pill">Remaining: {remainingTiles}</span>
                    <span className="identifying-pill">
                      Mistakes: {gameState.mistakes}/{MAX_MISTAKES}
                    </span>
                  </div>
                </section>

                <p className="identifying-phase-hint" aria-live="polite">
                  {PHASE_HINTS[gameState.phase]}
                </p>

                {gameState.phase === "review" ? (
                  <div className="identifying-review-legend" aria-label="Review legend">
                    <span className="identifying-legend-pill identifying-legend-pill-correct">[OK] Clicked Correct</span>
                    <span className="identifying-legend-pill identifying-legend-pill-answer">[.] Missed Correct</span>
                    <span className="identifying-legend-pill identifying-legend-pill-wrong">[WRONG] Wrong Click</span>
                  </div>
                ) : null}

                <button
                  className="ghost-button identifying-back-button"
                  type="button"
                  onClick={returnToStart}
                  aria-label="Return to the identifying tiles start screen"
                >
                  Back to Start
                </button>
              </aside>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
