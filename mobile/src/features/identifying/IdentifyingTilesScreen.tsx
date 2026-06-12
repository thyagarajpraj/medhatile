import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, saveScore } from "@medhatile/shared-api";
import type { AuthSession } from "@medhatile/shared-types";
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

const BEST_SCORE_KEY = "medhatile_best_score";
const REVEAL_BLINK_DURATION_MS = 1000;
const REVEAL_DURATION_MS = 1000;
const REVIEW_BLINK_DURATION_MS = 1000;
const BETWEEN_ROUNDS_MS = 450;
const MAX_MISTAKES = 3;

type TileState = "default" | "reveal" | "selected_correct" | "answer" | "wrong";

type IdentifyingTilesScreenProps = {
  accountBestScore: number;
  onAccountBestScoreChange: (bestScore: number) => void;
  onUnauthorized: () => Promise<void>;
  session: AuthSession;
  onBackToStart: () => void;
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
  review: "OK: correct, .: missed, X: wrong click.",
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
 * Saves the latest identifying-game best score to storage.
 */
async function persistLocalBestScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Ignore storage write failures.
  }
}

/**
 * Reads the current best score from storage.
 */
async function readLocalBestScore(): Promise<number> {
  try {
    const storedBest = await AsyncStorage.getItem(BEST_SCORE_KEY);
    return storedBest ? Number(storedBest) : 0;
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
 * Renders the identifying-game tile grid.
 */
function MemoryBoard({
  gridSize,
  pattern,
  userSelections,
  wrongSelections,
  phase,
  blinkReveal,
  blinkAnswers,
  blinkAnim,
  onTileClick,
}: {
  gridSize: number;
  pattern: number[];
  userSelections: number[];
  wrongSelections: number[];
  phase: Phase;
  blinkReveal: boolean;
  blinkAnswers: boolean;
  blinkAnim: Animated.Value;
  onTileClick: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const patternSet = useMemo(() => new Set(pattern), [pattern]);
  const selectionSet = useMemo(() => new Set(userSelections), [userSelections]);
  const wrongSet = useMemo(() => new Set(wrongSelections), [wrongSelections]);

  // Max width is 380 or screen width minus padding
  const boardSize = Math.min(width - 40, 380);
  const gapSize = 6;
  const tileSize = (boardSize - (gridSize + 1) * gapSize) / gridSize;

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

  const getTileStyles = (state: TileState) => {
    switch (state) {
      case "reveal":
        return styles.tileReveal;
      case "selected_correct":
        return styles.tileCorrect;
      case "wrong":
        return styles.tileWrong;
      case "answer":
        return styles.tileAnswer;
      default:
        return styles.tileDefault;
    }
  };

  const getTileTextStyles = (state: TileState) => {
    if (state === "default") {
      return styles.tileTextDefault;
    }
    return styles.tileTextActive;
  };

  return (
    <View style={[styles.board, { width: boardSize, height: boardSize, padding: gapSize, gap: gapSize }]}>
      {Array.from({ length: gridSize }).map((_, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.boardRow, { gap: gapSize }]}>
          {Array.from({ length: gridSize }).map((_, colIndex) => {
            const index = rowIndex * gridSize + colIndex;
            const tileState = getState(index);
            const shouldBlink =
              (blinkReveal && tileState === "reveal") ||
              (blinkAnswers && (tileState === "answer" || tileState === "selected_correct"));

            const marker =
              tileState === "selected_correct"
                ? "OK"
                : tileState === "answer"
                  ? "."
                  : tileState === "wrong"
                    ? "X"
                    : "";

            return (
              <Pressable
                key={`tile-${index}`}
                disabled={phase !== "recall"}
                onPress={() => onTileClick(index)}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tileSize, height: tileSize },
                  getTileStyles(tileState),
                  pressed && phase === "recall" && styles.tilePressed,
                ]}
              >
                <Animated.View style={shouldBlink ? { opacity: blinkAnim } : null}>
                  <Text style={[getTileTextStyles(tileState), { fontSize: gridSize >= 8 ? 14 : 18 }]}>
                    {marker}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Main identifying tiles memory training screen component.
 */
export function IdentifyingTilesScreen({
  accountBestScore,
  onAccountBestScoreChange,
  onUnauthorized,
  session,
  onBackToStart,
}: IdentifyingTilesScreenProps) {
  const revealTimeoutRef = useRef<any>(null);
  const revealBlinkTimeoutRef = useRef<any>(null);
  const reviewRestartTimeoutRef = useRef<any>(null);
  const roundTransitionTimeoutRef = useRef<any>(null);
  const roundSuccessTimeoutRef = useRef<any>(null);

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

  const blinkAnim = useRef(new Animated.Value(1)).current;

  const currentModeConfig = useMemo(() => getDifficultyConfig(difficultyMode), [difficultyMode]);
  const effectiveBestScore = Math.max(localBestScore, accountBestScore);

  const clearRevealTimer = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (revealBlinkTimeoutRef.current !== null) {
      clearTimeout(revealBlinkTimeoutRef.current);
      revealBlinkTimeoutRef.current = null;
    }

    setIsRevealBlinkActive(false);
  }, []);

  const clearRoundTimers = useCallback(() => {
    if (reviewRestartTimeoutRef.current !== null) {
      clearTimeout(reviewRestartTimeoutRef.current);
      reviewRestartTimeoutRef.current = null;
    }

    if (roundTransitionTimeoutRef.current !== null) {
      clearTimeout(roundTransitionTimeoutRef.current);
      roundTransitionTimeoutRef.current = null;
    }

    if (roundSuccessTimeoutRef.current !== null) {
      clearTimeout(roundSuccessTimeoutRef.current);
      roundSuccessTimeoutRef.current = null;
    }

    setIsReviewBlinkActive(false);
  }, []);

  // Set up repeating blink animation loop
  useEffect(() => {
    if (isRevealBlinkActive || isReviewBlinkActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.35,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => {
        animation.stop();
        blinkAnim.setValue(1);
      };
    } else {
      blinkAnim.setValue(1);
    }
  }, [isRevealBlinkActive, isReviewBlinkActive, blinkAnim]);

  const scheduleRevealEnd = useCallback(() => {
    setIsRevealBlinkActive(true);
    revealBlinkTimeoutRef.current = setTimeout(() => {
      setIsRevealBlinkActive(false);
    }, REVEAL_BLINK_DURATION_MS);

    revealTimeoutRef.current = setTimeout(() => {
      setGameState((prev) => (prev.phase === "reveal" ? { ...prev, phase: "recall" } : prev));
    }, REVEAL_DURATION_MS);
  }, []);

  const syncLocalBestScore = useCallback((score: number) => {
    setLocalBestScore((previousBest) => {
      const nextBest = Math.max(previousBest, score);

      if (nextBest !== previousBest) {
        void persistLocalBestScore(nextBest);
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
            await onUnauthorized();
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
      .catch(async (error) => {
        if (isUnauthorizedError(error)) {
          await onUnauthorized();
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
    roundTransitionTimeoutRef.current = setTimeout(() => {
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

  const handleModeChange = (mode: DifficultyMode) => {
    const nextConfig = getDifficultyConfig(mode);

    clearRevealTimer();
    clearRoundTimers();
    setDifficultyMode(mode);
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

  // Load local best score on mount
  useEffect(() => {
    void readLocalBestScore().then((storedBest) => {
      if (storedBest > 0) {
        setLocalBestScore(storedBest);
      }
    });
  }, []);

  // Sync with account best score
  useEffect(() => {
    if (accountBestScore <= localBestScore) {
      return;
    }

    setLocalBestScore(accountBestScore);
    void persistLocalBestScore(accountBestScore);
  }, [accountBestScore, localBestScore]);

  // Handle round completion transitions
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

    roundSuccessTimeoutRef.current = setTimeout(() => {
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

  // Handle wrong selection review restarts
  useEffect(() => {
    if (gameState.phase !== "review" || isLoadingRound) {
      return;
    }

    if (reviewRestartTimeoutRef.current !== null) {
      return;
    }

    setIsReviewBlinkActive(true);
    reviewRestartTimeoutRef.current = setTimeout(() => {
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

  // Clean up timers on unmount
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
    <View style={styles.container}>
      <Text style={styles.appSubtitle}>Build your mind, one tile at a time.</Text>

      <View style={styles.statsCard}>
        <Text style={styles.sectionLabel}>Game Stats</Text>
        <View style={styles.pillRow}>
          <Text style={styles.pill}>Phase: {PHASE_LABELS[gameState.phase]}</Text>
          <Text style={styles.pill}>Mode: {currentModeConfig.label}</Text>
          <Text style={styles.pill}>Level: {gameState.level}</Text>
          <Text style={styles.pill}>Score: {gameState.score}</Text>
          <Text style={styles.pill}>Best: {effectiveBestScore}</Text>
        </View>
      </View>

      {!hasStarted ? (
        <View style={styles.card}>
          <Text style={styles.startTitle}>Start Your Recall Session</Text>

          <Text style={styles.fieldLabel}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_MODES.map((mode) => (
              <Pressable
                key={mode.mode}
                onPress={() => handleModeChange(mode.mode)}
                style={[
                  styles.difficultyPill,
                  difficultyMode === mode.mode && styles.activeDifficultyPill,
                ]}
              >
                <Text
                  style={[
                    styles.difficultyPillLabel,
                    difficultyMode === mode.mode && styles.activeDifficultyPillLabel,
                  ]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.startCopy}>
            Train memory and focus through timed recall rounds with gradually increasing challenge.
          </Text>

          <Pressable onPress={startGame} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Start Training</Text>
          </Pressable>
          <Text style={styles.bestScoreText}>Best Score: {effectiveBestScore}</Text>
        </View>
      ) : (
        <View style={styles.gameLayout}>
          <View style={styles.boardContainer}>
            {isLoadingRound ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#1d4ed8" />
                <Text style={styles.loadingText}>Preparing round...</Text>
              </View>
            ) : (
              <MemoryBoard
                gridSize={gameState.gridSize}
                pattern={gameState.pattern}
                userSelections={gameState.userSelections}
                wrongSelections={wrongSelections}
                phase={gameState.phase}
                blinkReveal={isRevealBlinkActive}
                blinkAnswers={isReviewBlinkActive}
                blinkAnim={blinkAnim}
                onTileClick={handleTileClick}
              />
            )}
          </View>

          <View style={styles.sidePanel}>
            <View style={styles.progressCard}>
              <Text style={styles.sectionLabel}>Tile Progress</Text>
              <View style={styles.pillRow}>
                <Text style={styles.pill}>Blue Tiles: {totalBlueTiles}</Text>
                <Text style={styles.pill}>Correct: {correctTiles}</Text>
                <Text style={styles.pill}>Remaining: {remainingTiles}</Text>
                <Text style={styles.pill}>
                  Mistakes: {gameState.mistakes}/{MAX_MISTAKES}
                </Text>
              </View>
            </View>

            <Text style={styles.phaseHint}>{PHASE_HINTS[gameState.phase]}</Text>

            {gameState.phase === "review" ? (
              <View style={styles.legendContainer}>
                <Text style={[styles.legendPill, styles.legendPillCorrect]}>[OK] Clicked Correct</Text>
                <Text style={[styles.legendPill, styles.legendPillAnswer]}>[.] Missed Correct</Text>
                <Text style={[styles.legendPill, styles.legendPillWrong]}>[X] Wrong Click</Text>
              </View>
            ) : null}

            <Pressable onPress={returnToStart} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonLabel}>Back to Start</Text>
            </Pressable>

            <Pressable onPress={onBackToStart} style={styles.outlineButton}>
              <Text style={styles.outlineButtonLabel}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  appSubtitle: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 18,
  },
  statsCard: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  startTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#132238",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  activeDifficultyPill: {
    backgroundColor: "#132238",
    borderColor: "#132238",
  },
  difficultyPillLabel: {
    fontWeight: "700",
    color: "#132238",
  },
  activeDifficultyPillLabel: {
    color: "#ffffff",
  },
  startCopy: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#132238",
    padding: 14,
    borderRadius: 14,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
  bestScoreText: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748b",
  },
  gameLayout: {
    gap: 16,
  },
  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingState: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
  },
  board: {
    alignSelf: "center",
    backgroundColor: "#cbd5e1",
    borderRadius: 20,
    justifyContent: "space-between",
  },
  boardRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  tile: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  tilePressed: {
    opacity: 0.7,
  },
  tileDefault: {
    backgroundColor: "#e2e8f0",
  },
  tileReveal: {
    backgroundColor: "#3b82f6",
  },
  tileCorrect: {
    backgroundColor: "#10b981",
  },
  tileWrong: {
    backgroundColor: "#ef4444",
  },
  tileAnswer: {
    backgroundColor: "#a855f7",
  },
  tileTextDefault: {
    display: "none",
  },
  tileTextActive: {
    fontWeight: "900",
    color: "#ffffff",
  },
  sidePanel: {
    gap: 12,
  },
  progressCard: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  phaseHint: {
    fontSize: 14,
    color: "#334155",
    fontStyle: "italic",
    lineHeight: 20,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendPill: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legendPillCorrect: {
    backgroundColor: "#10b981",
  },
  legendPillAnswer: {
    backgroundColor: "#a855f7",
  },
  legendPillWrong: {
    backgroundColor: "#ef4444",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryButtonLabel: {
    color: "#132238",
    textAlign: "center",
    fontWeight: "700",
  },
  outlineButton: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 14,
  },
  outlineButtonLabel: {
    color: "#64748b",
    textAlign: "center",
    fontWeight: "700",
  },
});
