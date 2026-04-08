import { StyleSheet, Text, View } from "react-native";
import type { LeaderboardEntry } from "@medhatile/shared-types";

type LeaderboardScreenProps = {
  entries: LeaderboardEntry[];
};

/**
 * Renders the mobile leaderboard screen.
 */
export function LeaderboardScreen({ entries }: LeaderboardScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {entries.length === 0 ? <Text style={styles.emptyText}>No leaderboard entries loaded yet.</Text> : null}
      {entries.map((entry, index) => (
        <View key={entry.id} style={styles.entryCard}>
          <Text style={styles.entryTitle}>
            #{index + 1} {entry.email}
          </Text>
          <Text style={styles.entryMeta}>Score: {entry.score}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#132238",
  },
  emptyText: {
    color: "#64748b",
  },
  entryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  entryTitle: {
    fontWeight: "700",
    color: "#132238",
  },
  entryMeta: {
    color: "#64748b",
    marginTop: 4,
  },
});
