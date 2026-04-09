import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { getCurrentUser, getLeaderboard, login, register, setAuthToken } from "@medhatile/shared-api";
import type { AuthCredentials, AuthSession, LeaderboardEntry } from "@medhatile/shared-types";
import { AuthGate } from "./features/auth/AuthGate";
import { clearStoredSession, readStoredSession, storeSession } from "./features/auth/authStorage";
import type { AuthMode } from "./features/auth/authValidation";
import { Game2048Screen } from "./features/game2048/Game2048Screen";
import { createInitialGameState, type GameViewState } from "./features/game2048/game2048";
import { LeaderboardScreen } from "./features/leaderboard/LeaderboardScreen";
import { ChooseGameScreen } from "./features/navigation/ChooseGameScreen";

type Screen = "login" | "choose-game" | "game-2048" | "leaderboard";

/**
 * Extracts a user-facing API error message from a thrown request error.
 */
function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "response" in error) {
    const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;

    if (message) {
      return message;
    }
  }

  return fallback;
}

export default function AppMain(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("login");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [game, setGame] = useState<GameViewState>(() => createInitialGameState());
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  /**
   * Persists the current auth session to storage and syncs the API token.
   */
  async function persistSession(nextSession: AuthSession | null): Promise<void> {
    setSession(nextSession);
    setAuthToken(nextSession?.token ?? null);

    if (nextSession) {
      await storeSession(nextSession);
      return;
    }

    await clearStoredSession();
  }

  /**
   * Clears the mobile session and returns the user to the auth gate.
   */
  async function signOut(nextStatusMessage: string | null = null): Promise<void> {
    await persistSession(null);
    setEntries([]);
    setGame(createInitialGameState());
    setAuthErrorMessage(null);
    setStatusMessage(nextStatusMessage);
    setScreen("login");
  }

  /**
   * Restores a stored session and validates it against the backend before reuse.
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession(): Promise<void> {
      try {
        const storedSession = await readStoredSession();

        if (!storedSession) {
          return;
        }

        setAuthToken(storedSession.token);
        const response = await getCurrentUser();
        const validatedSession: AuthSession = {
          token: storedSession.token,
          user: response.user,
        };

        if (!isMounted) {
          return;
        }

        await persistSession(validatedSession);
        setScreen("choose-game");
        setStatusMessage(null);
      } catch {
        setAuthToken(null);

        if (!isMounted) {
          return;
        }

        await clearStoredSession();
        setSession(null);
        setScreen("login");
        setStatusMessage("Your previous session expired. Sign in again.");
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Submits login or registration requests for the mobile auth gate.
   */
  async function handleAuthenticate(mode: AuthMode, credentials: AuthCredentials): Promise<void> {
    setIsAuthSubmitting(true);
    setAuthErrorMessage(null);

    try {
      const nextSession = mode === "login" ? await login(credentials) : await register(credentials);
      await persistSession(nextSession);
      setStatusMessage(null);
      setScreen("choose-game");
    } catch (error) {
      setAuthErrorMessage(extractApiErrorMessage(error, "Authentication failed"));
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  /**
   * Loads leaderboard entries and routes authenticated users to the leaderboard screen.
   */
  async function loadLeaderboard(): Promise<void> {
    try {
      const response = await getLeaderboard();
      setEntries(response.entries);
      setStatusMessage(null);
      setScreen("leaderboard");
    } catch (error) {
      const status =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401) {
        await signOut("Your session expired. Sign in again.");
        return;
      }

      setStatusMessage("Unable to load leaderboard");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={screen !== "game-2048"}
      >
        <View style={styles.shell}>
          <Text style={styles.appTitle}>MedhaTile Mobile</Text>

          {isRestoringSession ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Restoring your session...</Text>
              <Text style={styles.subtleText}>We are validating your saved mobile session before opening the game.</Text>
            </View>
          ) : null}

          {!isRestoringSession && session ? (
            <View style={styles.authenticatedStack}>
              <View style={styles.topBar}>
                <Text style={styles.subtleText}>Signed in as {session.user.email}</Text>
                <View style={styles.navRow}>
                  <Pressable onPress={() => setScreen("choose-game")} style={styles.secondaryPill}>
                    <Text style={styles.secondaryPillLabel}>Home</Text>
                  </Pressable>
                  <Pressable onPress={() => setScreen("game-2048")} style={styles.secondaryPill}>
                    <Text style={styles.secondaryPillLabel}>2048</Text>
                  </Pressable>
                  <Pressable onPress={() => void loadLeaderboard()} style={styles.secondaryPill}>
                    <Text style={styles.secondaryPillLabel}>Leaderboard</Text>
                  </Pressable>
                  <Pressable onPress={() => void signOut()} style={styles.outlinePill}>
                    <Text style={styles.outlinePillLabel}>Logout</Text>
                  </Pressable>
                </View>
              </View>

              {statusMessage ? (
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>{statusMessage}</Text>
                </View>
              ) : null}

              {screen === "choose-game" ? (
                <ChooseGameScreen onOpen2048={() => setScreen("game-2048")} onOpenLeaderboard={() => void loadLeaderboard()} />
              ) : null}

              {screen === "game-2048" ? (
                <Game2048Screen
                  game={game}
                  onGameChange={setGame}
                  onSessionChange={persistSession}
                  onStatusMessageChange={setStatusMessage}
                  onUnauthorized={() => signOut("Your session expired. Sign in again.")}
                  session={session}
                />
              ) : null}

              {screen === "leaderboard" ? <LeaderboardScreen entries={entries} /> : null}
            </View>
          ) : null}

          {!isRestoringSession && !session ? (
            <View style={styles.card}>
              <AuthGate
                errorMessage={authErrorMessage}
                isSubmitting={isAuthSubmitting}
                statusMessage={statusMessage}
                onAuthenticate={handleAuthenticate}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8eef7",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  shell: {
    flexGrow: 1,
    gap: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
  },
  authenticatedStack: {
    gap: 16,
  },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#132238",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#132238",
  },
  subtleText: {
    color: "#64748b",
    lineHeight: 20,
  },
  topBar: {
    gap: 10,
  },
  navRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryPill: {
    backgroundColor: "#132238",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryPillLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },
  outlinePill: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  outlinePillLabel: {
    color: "#132238",
    fontWeight: "700",
  },
  statusCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 12,
  },
  statusText: {
    color: "#1d4ed8",
  },
});
