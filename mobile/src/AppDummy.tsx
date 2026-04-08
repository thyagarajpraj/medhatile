import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App(): React.JSX.Element {
  const [tapCount, setTapCount] = useState(0);
  const [status, setStatus] = useState("Waiting for interaction");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Health Check</Text>
          <Text style={styles.title}>MedhaTile Mobile Dummy Page</Text>
          <Text style={styles.body}>
            This screen avoids the live API flow so we can confirm Metro, Android launch, rendering, and touch input are all working correctly.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>App status</Text>
          <Text style={styles.value}>{status}</Text>
          <Text style={styles.label}>Tap count</Text>
          <Text style={styles.value}>{tapCount}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => {
              setTapCount((count) => count + 1);
              setStatus("Touch handling is working");
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonLabel}>Tap me</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setTapCount(0);
              setStatus("State reset completed");
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonLabel}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>What this verifies</Text>
          <Text style={styles.checklistItem}>1. The app launches from Android without crashing.</Text>
          <Text style={styles.checklistItem}>2. React Native is rendering text and layout.</Text>
          <Text style={styles.checklistItem}>3. Button presses update state immediately.</Text>
          <Text style={styles.checklistItem}>4. Hot reload can be tested safely on this page.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4efe6",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 18,
    padding: 24,
  },
  heroCard: {
    gap: 10,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#132238",
  },
  eyebrow: {
    color: "#f8c15c",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: "#d6deeb",
    lineHeight: 22,
  },
  infoCard: {
    gap: 6,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dfd6c8",
  },
  label: {
    color: "#8a6f49",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: "#132238",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#d46f4d",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#dfd6c8",
  },
  secondaryButtonLabel: {
    color: "#132238",
    textAlign: "center",
    fontWeight: "700",
  },
  checklistCard: {
    gap: 8,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#ecdcb8",
  },
  checklistTitle: {
    color: "#132238",
    fontSize: 18,
    fontWeight: "700",
  },
  checklistItem: {
    color: "#4b5563",
    lineHeight: 20,
  },
});
