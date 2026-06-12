import { Pressable, StyleSheet, Text, View } from "react-native";

type ChooseGameScreenProps = {
  onOpen2048: () => void;
  onOpenIdentifying: () => void;
  onOpenLeaderboard: () => void;
};

/**
 * Renders the mobile choose-game landing screen for the current foundation milestone.
 */
export function ChooseGameScreen({ onOpen2048, onOpenIdentifying, onOpenLeaderboard }: ChooseGameScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Tile Game</Text>
      <Text style={styles.subtitle}>Pick the challenge you want to open on mobile for this session.</Text>

      <Pressable onPress={onOpen2048} style={styles.primaryCard}>
        <Text style={styles.kicker}>2048</Text>
        <Text style={styles.cardTitle}>Merge matching numbers and keep the board alive.</Text>
        <Text style={styles.cardText}>This is the active tile game available on mobile right now.</Text>
      </Pressable>

      <Pressable onPress={onOpenIdentifying} style={styles.primaryCard}>
        <Text style={[styles.kicker, styles.kickerIdentifying]}>Identifying Tiles</Text>
        <Text style={styles.cardTitle}>Memorize the pattern, then recall the same tiles.</Text>
        <Text style={styles.cardText}>Train memory and focus through timed recall rounds.</Text>
      </Pressable>

      <Pressable onPress={onOpenLeaderboard} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>Open Leaderboard</Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#132238",
  },
  subtitle: {
    color: "#64748b",
    lineHeight: 22,
  },
  primaryCard: {
    gap: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  kicker: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  kickerIdentifying: {
    color: "#7c3aed",
  },
  cardTitle: {
    color: "#132238",
    fontSize: 16,
    fontWeight: "700",
  },
  cardText: {
    color: "#64748b",
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: "#132238",
    padding: 14,
    borderRadius: 14,
  },
  secondaryButtonLabel: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
});
