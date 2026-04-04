import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { GameSection } from "./components/GameSection";
import { API_BASE_URL } from "./config/api";
import { isProd } from "./config/env";
import { AuthGate } from "./features/auth/components/AuthGate";
import { fetchCurrentUserFromApi, loginFromApi, registerFromApi } from "./features/auth/services/authApi";
import { clearStoredAuthSession, readStoredAuthSession, storeAuthSession } from "./features/auth/services/authStorage";
import type { AuthCredentials, AuthMode, AuthSession } from "./features/auth/types/auth";
import { LeaderboardSection } from "./features/leaderboard/components/LeaderboardSection";
import { MoviesSection } from "./features/movies/components/MoviesSection";

/**
 * Renders the top-level app shell and development-only route navigation.
 */
function App() {
  const storedSession = useMemo(() => readStoredAuthSession(), []);
  const [authSession, setAuthSession] = useState<AuthSession | null>(storedSession);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(storedSession));
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(
    storedSession ? "Restoring your session..." : null,
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.info(
      `[env-check] mode=${import.meta.env.MODE} prod=${String(isProd)} dev=${String(isDev)} apiBase=${API_BASE_URL}`,
    );
  }, []);

  useEffect(() => {
    if (!storedSession) {
      setIsRestoringSession(false);
      return;
    }

    let isActive = true;

    void fetchCurrentUserFromApi(storedSession.token)
      .then((user) => {
        if (!isActive) {
          return;
        }

        const nextSession = {
          token: storedSession.token,
          user,
        };

        storeAuthSession(nextSession);
        setAuthSession(nextSession);
        setAuthErrorMessage(null);
        setAuthStatusMessage(null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        clearStoredAuthSession();
        setAuthSession(null);
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
   * Clears the active auth session and returns the app to the auth gate.
   */
  const signOut = (message: string) => {
    clearStoredAuthSession();
    setAuthSession(null);
    setAuthErrorMessage(null);
    setAuthStatusMessage(message);
  };

  /**
   * Handles unauthorized API responses by expiring the local session.
   */
  const handleUnauthorized = () => {
    signOut("Your session expired. Sign in again.");
  };

  /**
   * Updates the stored session after backend-backed user details change.
   */
  const updateAuthenticatedUser = (updates: Partial<AuthSession["user"]>) => {
    setAuthSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        user: {
          ...currentSession.user,
          ...updates,
        },
      };

      storeAuthSession(nextSession);
      return nextSession;
    });
  };

  /**
   * Authenticates the current user through either login or self-registration.
   */
  const authenticate = async (mode: AuthMode, credentials: AuthCredentials) => {
    setIsAuthSubmitting(true);
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    try {
      const session = mode === "register" ? await registerFromApi(credentials) : await loginFromApi(credentials);

      storeAuthSession(session);
      setAuthSession(session);
      setAuthErrorMessage(null);
      setAuthStatusMessage(mode === "register" ? "Account created successfully." : null);
    } catch (error) {
      setAuthErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  if (isRestoringSession) {
    return (
      <main className="min-h-dvh overflow-y-auto bg-[radial-gradient(circle_at_20%_10%,_#eef2ff_0%,_#f8f9fa_55%,_#e2e8f0_100%)] px-3 py-3 sm:px-4 sm:py-4">
        <section className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-5xl items-center justify-center py-3 sm:min-h-[calc(100dvh-2rem)]">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 p-6 text-center text-sm text-slate-600 shadow-xl">
            Restoring your session...
          </div>
        </section>
      </main>
    );
  }

  if (!authSession) {
    return (
      <main className="min-h-dvh overflow-y-auto bg-[radial-gradient(circle_at_20%_10%,_#eef2ff_0%,_#f8f9fa_55%,_#e2e8f0_100%)] px-3 py-3 sm:px-4 sm:py-4">
        <AuthGate
          errorMessage={authErrorMessage}
          isSubmitting={isAuthSubmitting}
          statusMessage={authStatusMessage}
          onAuthenticate={authenticate}
        />
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-y-auto bg-[radial-gradient(circle_at_20%_10%,_#eef2ff_0%,_#f8f9fa_55%,_#e2e8f0_100%)] px-3 py-3 sm:px-4 sm:py-4">
      <section className="mx-auto mb-3 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-sm backdrop-blur-sm sm:p-3">
        <h1 className="px-2 text-sm font-extrabold uppercase tracking-wide text-slate-800 sm:text-base">
          MedhaTile
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Game
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Leaderboard
            </NavLink>
            {!isProd && (
              <NavLink
                to="/movies"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Movies
              </NavLink>
            )}
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            {authSession.user.email}
          </span>
          <button
            type="button"
            onClick={() => signOut("Signed out successfully.")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Sign Out
          </button>
        </div>
      </section>

      <Routes>
        <Route
          path="/"
          element={
            <GameSection
              accountBestScore={authSession.user.bestScore}
              accountEmail={isProd ? authSession.user.email : undefined}
              authToken={authSession.token}
              onAccountBestScoreChange={(bestScore) => updateAuthenticatedUser({ bestScore })}
              onSignOut={isProd ? () => signOut("Signed out successfully.") : undefined}
              onUnauthorized={handleUnauthorized}
            />
          }
        />
        <Route path="/leaderboard" element={<LeaderboardSection authToken={authSession.token} />} />
        {!isProd && (
          <Route path="/movies" element={<MoviesSection authToken={authSession.token} onUnauthorized={handleUnauthorized} />} />
        )}
        <Route path="*" element={<Navigate to={isProd && location.pathname === "/movies" ? "/" : "/"} replace />} />
      </Routes>
    </main>
  );
}

export default App;
