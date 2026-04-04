import React, { useMemo } from "react";
import { SafeAreaView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { attachAuthToken } from "@medhatile/api";
import { AUTH_STORAGE_KEY } from "@medhatile/auth";
import { DIFFICULTY_MODES } from "@medhatile/game";

attachAuthToken(() => null);

/**
 * Renders the React Native CLI starter shell for the shared MedhaTile app.
 */
export function MobileApp(): React.JSX.Element {
  const storageNote = useMemo(() => `Auth storage key: ${AUTH_STORAGE_KEY}`, []);

  void AsyncStorage.getItem(AUTH_STORAGE_KEY);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>MedhaTile Mobile</Text>
        <Text style={{ fontSize: 16, color: "#475569", marginBottom: 12 }}>
          Shared packages are wired for auth, API, game rules, and types.
        </Text>
        <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 18 }}>{storageNote}</Text>
        <Text style={{ fontSize: 14, color: "#0f172a", fontWeight: "600", marginBottom: 8 }}>Difficulty presets</Text>
        {DIFFICULTY_MODES.map((mode) => (
          <Text key={mode.mode} style={{ fontSize: 14, color: "#334155", marginBottom: 6 }}>
            {mode.label}: {mode.grid}x{mode.grid} starting at {mode.startTiles} tiles
          </Text>
        ))}
      </View>
    </SafeAreaView>
  );
}
