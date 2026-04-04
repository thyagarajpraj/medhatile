import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentUser, getLeaderboard, login, register, saveScore, setAuthToken } from "@medhatile/shared-api";
import { boardsAreEqual, calculateScore, checkGameOver, createStartingBoard, moveTiles, spawnTile } from "@medhatile/shared-game";
import type { AuthCredentials, AuthSession, Board, LeaderboardEntry } from "@medhatile/shared-types";
import { AuthGate, type AuthMode } from "./features/auth/AuthGate";
import { readSession, writeSession } from "./features/auth/sessionStorage";
import { IdentifyingTilesPage } from "./features/identifying/IdentifyingTilesPage";
import { GameRouteSelect } from "./features/navigation/GameRouteSelect";

type Direction = "up" | "down" | "left" | "right";
type GameViewState = {
  board: Board;
  score: number;
  gameOver: boolean;
};

/**
 * Creates the initial 2048-style board state.
 */
function createInitialGameState(): GameViewState {
  const board = createStartingBoard(4);

  return {
    board,
    score: calculateScore(board),
    gameOver: checkGameOver(board),
  };
}

/**
 * Renders the current 2048 board.
 */
function BoardView({ board }: { board: Board }) {
  return (
    <div className="board">
      {board.flat().map((value, index) => (
        <div key={`${index}-${value}`} className="tile" data-value={value}>
          {value || "."}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the 2048 game page.
 */
function GamePage({
  session,
  onSessionChange,
}: {
  session: AuthSession;
  onSessionChange: (session: AuthSession | null) => void;
}) {
  const [game, setGame] = useState<GameViewState>(() => createInitialGameState());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => saveScore({ score: game.score, level: 1 }),
    onSuccess: (response) => {
      setSaveMessage(response.message);
      onSessionChange({
        ...session,
        user: {
          ...session.user,
          bestScore: response.bestScore,
        },
      });
    },
    onError: () => {
      setSaveMessage("Unable to save your score right now.");
    },
  });

  /**
   * Applies a move to the board when the selected direction changes the grid.
   */
  const applyMove = (direction: Direction) => {
    setSaveMessage(null);

    setGame((current) => {
      if (current.gameOver) {
        return current;
      }

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const directionMap: Partial<Record<string, Direction>> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      const direction = directionMap[event.key];
      if (direction) {
        event.preventDefault();
        applyMove(direction);
      }
    };

    globalThis.window.addEventListener("keydown", handleKeyDown);
    return () => globalThis.window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="page-grid">
      <div className="card">
        <div className="topbar">
          <div>
            <h2 style={{ marginBottom: 6 }}>2048</h2>
            <p className="muted" style={{ margin: 0 }}>
              Use your arrow keys or the move buttons. Reach higher tiles and save your score to the backend.
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={() => setGame(createInitialGameState())}>
            Reset board
          </button>
        </div>
        <div className="game-layout">
          <BoardView board={game.board} />
          <div className="card">
            <p><strong>Score:</strong> {game.score}</p>
            <p><strong>Best:</strong> {Math.max(session.user.bestScore, game.score)}</p>
            <p><strong>Status:</strong> {game.gameOver ? "Game over" : "In progress"}</p>
            {saveMessage ? <div className="status">{saveMessage}</div> : null}
            <div className="moves" style={{ marginTop: 12 }}>
              <span className="spacer" />
              <button className="ghost-button" onClick={() => applyMove("up")} type="button">Up</button>
              <span className="spacer" />
              <button className="ghost-button" onClick={() => applyMove("left")} type="button">Left</button>
              <button className="ghost-button" onClick={() => applyMove("down")} type="button">Down</button>
              <button className="ghost-button" onClick={() => applyMove("right")} type="button">Right</button>
            </div>
            <button className="primary-button" style={{ marginTop: 14, width: "100%" }} onClick={() => saveMutation.mutate()} type="button">
              {saveMutation.isPending ? "Saving..." : "Save score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the choose-game landing screen.
 */
function GameSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="page-grid">
      <div className="card">
        <h2>Choose Your Tile Game</h2>
        <p className="muted">Pick the kind of challenge you want to play for this session.</p>
        <div className="game-options">
          <button type="button" className="game-option-card" onClick={() => navigate("/games/adding")}>
            <span className="game-option-kicker">2048</span>
            <strong>Merge matching numbers and keep the board alive.</strong>
            <span className="muted">This is the current 2048-style game you’re seeing now.</span>
          </button>
          <button type="button" className="game-option-card" onClick={() => navigate("/games/identifying")}>
            <span className="game-option-kicker">Identifying Tiles</span>
            <strong>Memorize the highlighted pattern, then identify the same tiles.</strong>
            <span className="muted">This brings back the memory game we were developing earlier.</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loads and renders leaderboard entries for the current user.
 */
function LeaderboardPage({ onUnauthorized }: { onUnauthorized: () => void }) {
  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        return await getLeaderboard();
      } catch (error) {
        const status =
          typeof error === "object" && error && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 401) {
          onUnauthorized();
        }

        throw error;
      }
    },
  });

  const entries: LeaderboardEntry[] = leaderboardQuery.data?.entries ?? [];

  return (
    <div className="card">
      <h2>Leaderboard</h2>
      <p className="muted">Top saved scores from the shared backend.</p>
      {leaderboardQuery.isLoading ? <div className="status">Loading leaderboard...</div> : null}
      {leaderboardQuery.isError ? <div className="status error">Unable to load the leaderboard.</div> : null}
      <div className="leaderboard">
        {entries.map((entry, index) => (
          <div className="leaderboard-item" key={entry.id}>
            <div>
              <strong>#{index + 1}</strong> {entry.email}
            </div>
            <div>{entry.score}</div>
          </div>
        ))}
        {!leaderboardQuery.isLoading && entries.length === 0 ? <div className="leaderboard-item">No scores yet.</div> : null}
      </div>
    </div>
  );
}

/**
 * Wraps protected in-app routes and shared session-driven controls.
 */
function ProtectedShell({
  session,
  onSessionChange,
}: {
  session: AuthSession;
  onSessionChange: (session: AuthSession | null) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Clears the active session and returns the user to the auth gate.
   */
  const signOut = () => {
    setAuthToken(null);
    writeSession(null);
    onSessionChange(null);
    navigate("/login", { replace: true });
  };

  const handleBestScoreChange = (bestScore: number) => {
    onSessionChange({
      ...session,
      user: {
        ...session.user,
        bestScore,
      },
    });
  };

  if (location.pathname === "/games/identifying") {
    return (
      <IdentifyingTilesPage
        accountBestScore={session.user.bestScore}
        accountEmail={session.user.email}
        onAccountBestScoreChange={handleBestScoreChange}
        onSignOut={signOut}
        onUnauthorized={signOut}
      />
    );
  }

  return (
    <div className="shell">
      <div className="panel">
        <div className="panel-inner">
          <div className="topbar">
            <div>
              <h1 style={{ marginBottom: 4 }}>MedhaTile</h1>
              <p className="muted" style={{ margin: 0 }}>
                Signed in as {session.user.email}
              </p>
            </div>
            <div className="topbar-actions">
              <GameRouteSelect />
              <NavLink to="/leaderboard">Leaderboard</NavLink>
              <button className="ghost-button" onClick={signOut} type="button">
                Logout
              </button>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<GameSelectionPage />} />
            <Route path="/games/adding" element={<GamePage onSessionChange={onSessionChange} session={session} />} />
            <Route
              path="/games/identifying"
              element={
                <Navigate replace to="/games/identifying" />
              }
            />
            <Route path="/leaderboard" element={<LeaderboardPage onUnauthorized={signOut} />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

/**
 * Boots the authenticated web app and coordinates auth restoration.
 */
export default function App() {
  const navigate = useNavigate();
  const storedSession = useMemo(() => readSession(), []);
  const [session, setSession] = useState<AuthSession | null>(storedSession);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(storedSession));
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(
    storedSession ? "Restoring your session..." : null,
  );

  useEffect(() => {
    setAuthToken(session?.token ?? null);
  }, [session]);

  useEffect(() => {
    if (!storedSession) {
      setIsRestoringSession(false);
      return;
    }

    let isActive = true;
    setAuthToken(storedSession.token);

    void getCurrentUser()
      .then(({ user }) => {
        if (!isActive) {
          return;
        }

        const nextSession = {
          token: storedSession.token,
          user,
        };

        writeSession(nextSession);
        setSession(nextSession);
        setAuthErrorMessage(null);
        setAuthStatusMessage(null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setAuthToken(null);
        writeSession(null);
        setSession(null);
        setAuthErrorMessage(null);
        setAuthStatusMessage("Your previous session expired. Sign in again.");
      })
      .finally(() => {
        if (isActive) {
          setIsRestoringSession(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [storedSession]);

  /**
   * Stores a newly authenticated session and enters the protected app.
   */
  const handleAuthenticated = (nextSession: AuthSession) => {
    writeSession(nextSession);
    setAuthToken(nextSession.token);
    setSession(nextSession);
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);
    navigate("/", { replace: true });
  };

  /**
   * Updates the shared session state after nested pages mutate user data.
   */
  const handleSessionChange = (nextSession: AuthSession | null) => {
    writeSession(nextSession);
    setSession(nextSession);
  };

  /**
   * Performs login or registration and normalizes auth error handling.
   */
  const authenticate = async (mode: AuthMode, credentials: AuthCredentials) => {
    setIsAuthSubmitting(true);
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    try {
      const nextSession = mode === "register" ? await register(credentials) : await login(credentials);
      handleAuthenticated(nextSession);
    } catch (error: unknown) {
      const fallback = mode === "login" ? "Failed to sign in" : "Failed to register";
      const message =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setAuthErrorMessage(message ?? fallback);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  if (isRestoringSession) {
    return (
      <div className="shell">
        <div className="panel auth-card">
          <div className="panel-inner">
            <div className="card">
              <div className="status" style={{ marginBottom: 0 }}>
                Restoring your session...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate replace to="/" />
          ) : (
            <AuthGate
              errorMessage={authErrorMessage}
              isSubmitting={isAuthSubmitting}
              statusMessage={authStatusMessage}
              onAuthenticate={authenticate}
            />
          )
        }
      />
      <Route
        path="/*"
        element={
          session ? (
            <ProtectedShell onSessionChange={handleSessionChange} session={session} />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
    </Routes>
  );
}
