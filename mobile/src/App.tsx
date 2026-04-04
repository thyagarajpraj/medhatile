import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLeaderboard, login, register, saveScore, setAuthToken } from "@medhatile/shared-api";
import { boardsAreEqual, calculateScore, checkGameOver, createStartingBoard, moveTiles, spawnTile } from "@medhatile/shared-game";
import type { AuthSession, Board, LeaderboardEntry } from "@medhatile/shared-types";

type Screen = "login" | "game" | "leaderboard";
type AuthMode = "login" | "register";
type Direction = "up" | "down" | "left" | "right";
type GameViewState = {
  board: Board;
  score: number;
  gameOver: boolean;
};

const STORAGE_KEY = "medhatile_mobile_session";

function createInitialGameState(): GameViewState {
  const board = createStartingBoard(4);

  return {
    board,
    score: calculateScore(board),
    gameOver: checkGameOver(board),
  };
}

function cellColor(value: number): string {
  if (value >= 128) {
    return "#f59e0b";
  }

  if (value >= 32) {
    return "#fbbf24";
  }

  if (value >= 8) {
    return "#dbeafe";
  }

  return value === 0 ? "#eff6ff" : "#ffffff";
}

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("login");
  const [mode, setMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [game, setGame] = useState<GameViewState>(() => createInitialGameState());
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((rawValue) => {
      if (!rawValue) {
        return;
      }

      try {
        const nextSession = JSON.parse(rawValue) as AuthSession;
        setAuthToken(nextSession.token);
        setSession(nextSession);
        setScreen("game");
      } catch {
        void AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  const persistSession = async (nextSession: AuthSession | null) => {
    setSession(nextSession);
    setAuthToken(nextSession?.token ?? null);

    if (nextSession) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      return;
    }

    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const handleAuth = async () => {
    try {
      const nextSession = mode === "login" ? await login({ email, password }) : await register({ email, password });
      await persistSession(nextSession);
      setStatusMessage(null);
      setScreen("game");
    } catch (error) {
      const message =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setStatusMessage(message ?? "Authentication failed");
    }
  };

  const move = (direction: Direction) => {
    setGame((current) => {
      const movedBoard = moveTiles(current.board, direction);

      if (boardsAreEqual(current.board, movedBoard)) {
        return current;
      }

      const nextBoard = spawnTile(movedBoard);
      return {
        board: nextBoard,
        score: calculateScore(nextBoard),
        gameOver: checkGameOver(nextBoard),
      };
    });
  };

  const handleSaveScore = async () => {
    try {
      const response = await saveScore({ score: game.score, level: 1 });
      if (session) {
        await persistSession({
          ...session,
          user: {
            ...session.user,
            bestScore: response.bestScore,
          },
        });
      }
      setStatusMessage(response.message);
    } catch {
      setStatusMessage("Unable to save your score");
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await getLeaderboard();
      setEntries(response.entries);
      setScreen("leaderboard");
      setStatusMessage(null);
    } catch {
      setStatusMessage("Unable to load leaderboard");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#e8eef7" }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 24, padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#132238" }}>MedhaTile Mobile</Text>

          {session ? (
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <Pressable onPress={() => setScreen("game")} style={{ backgroundColor: "#132238", padding: 12, borderRadius: 999 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Game</Text>
              </Pressable>
              <Pressable onPress={loadLeaderboard} style={{ backgroundColor: "#132238", padding: 12, borderRadius: 999 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Leaderboard</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void persistSession(null);
                  setScreen("login");
                }}
                style={{ backgroundColor: "#fff", padding: 12, borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1" }}
              >
                <Text style={{ color: "#132238", fontWeight: "700" }}>Logout</Text>
              </Pressable>
            </View>
          ) : null}

          {statusMessage ? (
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: 12 }}>
              <Text style={{ color: "#1d4ed8" }}>{statusMessage}</Text>
            </View>
          ) : null}

          {!session || screen === "login" ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: "#64748b" }}>Use the same backend account on mobile and web.</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setMode("login")} style={{ backgroundColor: mode === "login" ? "#132238" : "#fff", padding: 12, borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1" }}>
                  <Text style={{ color: mode === "login" ? "#fff" : "#132238", fontWeight: "700" }}>Login</Text>
                </Pressable>
                <Pressable onPress={() => setMode("register")} style={{ backgroundColor: mode === "register" ? "#132238" : "#fff", padding: 12, borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1" }}>
                  <Text style={{ color: mode === "register" ? "#fff" : "#132238", fontWeight: "700" }}>Register</Text>
                </Pressable>
              </View>
              <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#cbd5e1" }} />
              <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#cbd5e1" }} />
              <Pressable onPress={handleAuth} style={{ backgroundColor: "#132238", borderRadius: 14, padding: 14 }}>
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>{mode === "login" ? "Login" : "Create account"}</Text>
              </Pressable>
            </View>
          ) : null}

          {session && screen === "game" ? (
            <View style={{ gap: 14 }}>
              <Text style={{ color: "#64748b" }}>Signed in as {session.user.email}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#132238" }}>Score: {game.score}</Text>
              <View style={{ gap: 8 }}>
                {game.board.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: 8 }}>
                    {row.map((value, columnIndex) => (
                      <View
                        key={`tile-${rowIndex}-${columnIndex}`}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: cellColor(value),
                          borderWidth: 1,
                          borderColor: "#cbd5e1",
                        }}
                      >
                        <Text style={{ fontWeight: "800", color: "#132238" }}>{value || "."}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <View style={{ gap: 10 }}>
                <Pressable onPress={() => move("up")} style={{ backgroundColor: "#fff", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1" }}>
                  <Text style={{ textAlign: "center", fontWeight: "700", color: "#132238" }}>Up</Text>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable onPress={() => move("left")} style={{ flex: 1, backgroundColor: "#fff", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1" }}>
                    <Text style={{ textAlign: "center", fontWeight: "700", color: "#132238" }}>Left</Text>
                  </Pressable>
                  <Pressable onPress={() => move("down")} style={{ flex: 1, backgroundColor: "#fff", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1" }}>
                    <Text style={{ textAlign: "center", fontWeight: "700", color: "#132238" }}>Down</Text>
                  </Pressable>
                  <Pressable onPress={() => move("right")} style={{ flex: 1, backgroundColor: "#fff", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1" }}>
                    <Text style={{ textAlign: "center", fontWeight: "700", color: "#132238" }}>Right</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={handleSaveScore} style={{ backgroundColor: "#132238", padding: 14, borderRadius: 14 }}>
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Save score</Text>
              </Pressable>
              <Pressable onPress={() => setGame(createInitialGameState())} style={{ backgroundColor: "#fff", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1" }}>
                <Text style={{ color: "#132238", textAlign: "center", fontWeight: "700" }}>Reset board</Text>
              </Pressable>
              {game.gameOver ? <Text style={{ color: "#be123c", fontWeight: "700" }}>Game over. Save your score or reset the board.</Text> : null}
            </View>
          ) : null}

          {session && screen === "leaderboard" ? (
            <View style={{ gap: 12 }}>
              {entries.length === 0 ? <Text style={{ color: "#64748b" }}>No leaderboard entries loaded yet.</Text> : null}
              {entries.map((entry, index) => (
                <View key={entry.id} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#dbe4f0" }}>
                  <Text style={{ fontWeight: "700", color: "#132238" }}>#{index + 1} {entry.email}</Text>
                  <Text style={{ color: "#64748b", marginTop: 4 }}>Score: {entry.score}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
