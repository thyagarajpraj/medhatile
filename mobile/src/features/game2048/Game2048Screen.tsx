import { Pressable, StyleSheet, Text, View } from "react-native";
import { saveScore } from "@medhatile/shared-api";
import type { AuthSession } from "@medhatile/shared-types";
import { applyMove, cellColor, createInitialGameState, type Direction, type GameViewState } from "./game2048";

type Game2048ScreenProps = {
  game: GameViewState;
  onGameChange: (game: GameViewState) => void;
  onSessionChange: (session: AuthSession) => Promise<void>;
  onStatusMessageChange: (message: string | null) => void;
  onUnauthorized: () => Promise<void>;
  session: AuthSession;
};

/**
 * Renders the mobile 2048 game screen and score actions.
 */
export function Game2048Screen({
  game,
  onGameChange,
  onSessionChange,
  onStatusMessageChange,
  onUnauthorized,
  session,
}: Game2048ScreenProps) {
  /**
   * Applies the chosen move direction to the current 2048 board.
   */
  function handleMove(direction: Direction): void {
    onGameChange(applyMove(game, direction));
  }

  /**
   * Saves the current 2048 score to the backend and syncs best score state.
   */
  async function handleSaveScore(): Promise<void> {
    try {
      const response = await saveScore({ score: game.score, level: 1 });
      await onSessionChange({
        ...session,
        user: {
          ...session.user,
          bestScore: response.bestScore,
        },
      });
      onStatusMessageChange(response.message);
    } catch (error) {
      const status =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401) {
        await onUnauthorized();
        return;
      }

      onStatusMessageChange("Unable to save your score");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtleText}>Signed in as {session.user.email}</Text>
      <Text style={styles.title}>2048</Text>
      <Text style={styles.scoreText}>Score: {game.score}</Text>
      <Text style={styles.subtleText}>Best: {Math.max(session.user.bestScore, game.score)}</Text>

      <View style={styles.board}>
        {game.board.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((value, columnIndex) => (
              <View
                key={`tile-${rowIndex}-${columnIndex}`}
                style={[styles.tile, { backgroundColor: cellColor(value) }]}
              >
                <Text style={styles.tileLabel}>{value || "."}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable onPress={() => handleMove("up")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>Up</Text>
        </Pressable>
        <View style={styles.directionRow}>
          <Pressable onPress={() => handleMove("left")} style={[styles.secondaryButton, styles.flexButton]}>
            <Text style={styles.secondaryButtonLabel}>Left</Text>
          </Pressable>
          <Pressable onPress={() => handleMove("down")} style={[styles.secondaryButton, styles.flexButton]}>
            <Text style={styles.secondaryButtonLabel}>Down</Text>
          </Pressable>
          <Pressable onPress={() => handleMove("right")} style={[styles.secondaryButton, styles.flexButton]}>
            <Text style={styles.secondaryButtonLabel}>Right</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => void handleSaveScore()} style={styles.primaryButton}>
        <Text style={styles.primaryButtonLabel}>Save score</Text>
      </Pressable>
      <Pressable onPress={() => onGameChange(createInitialGameState())} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>Reset board</Text>
      </Pressable>
      {game.gameOver ? <Text style={styles.gameOverText}>Game over. Save your score or reset the board.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  subtleText: {
    color: "#64748b",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#132238",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#132238",
  },
  board: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  tileLabel: {
    fontWeight: "800",
    color: "#132238",
  },
  controls: {
    gap: 10,
  },
  directionRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
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
  gameOverText: {
    color: "#be123c",
    fontWeight: "700",
  },
});
