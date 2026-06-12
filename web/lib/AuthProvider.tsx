"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, login, register, setAuthToken } from "@medhatile/shared-api";
import type { AuthCredentials, AuthSession } from "@medhatile/shared-types";
import type { AuthMode } from "@/src/features/auth/AuthGate";
import { readSession, writeSession } from "@/src/features/auth/sessionStorage";

type AuthContextValue = {
  session: AuthSession | null;
  isRestoringSession: boolean;
  setSession: (nextSession: AuthSession | null) => void;
  signOut: () => void;
  authenticate: (mode: AuthMode, credentials: AuthCredentials) => Promise<void>;
  authErrorMessage: string | null;
  authStatusMessage: string | null;
  isAuthSubmitting: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Exposes shared auth state to client components in the Next.js app.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

/**
 * Boots auth state, restores persisted sessions, and exposes auth actions.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const storedSession = useMemo(() => readSession(), []);
  const [session, setSessionState] = useState<AuthSession | null>(storedSession);
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
        setSessionState(nextSession);
        setAuthErrorMessage(null);
        setAuthStatusMessage(null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setAuthToken(null);
        writeSession(null);
        setSessionState(null);
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

  const setSession = useCallback((nextSession: AuthSession | null) => {
    writeSession(nextSession);
    setSessionState(nextSession);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    writeSession(null);
    setSessionState(null);
    router.push("/login");
  }, [router]);

  const authenticate = useCallback(
    async (mode: AuthMode, credentials: AuthCredentials) => {
      setIsAuthSubmitting(true);
      setAuthErrorMessage(null);
      setAuthStatusMessage(null);

      try {
        const nextSession = mode === "register" ? await register(credentials) : await login(credentials);
        writeSession(nextSession);
        setAuthToken(nextSession.token);
        setSessionState(nextSession);
        setAuthErrorMessage(null);
        setAuthStatusMessage(null);
        router.replace("/");
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
    },
    [router],
  );

  const value = useMemo(
    () => ({
      session,
      isRestoringSession,
      setSession,
      signOut,
      authenticate,
      authErrorMessage,
      authStatusMessage,
      isAuthSubmitting,
    }),
    [
      session,
      isRestoringSession,
      setSession,
      signOut,
      authenticate,
      authErrorMessage,
      authStatusMessage,
      isAuthSubmitting,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Renders the session-restore loading state used before protected routes mount.
 */
export function SessionRestoreScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/70 p-6 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-brand-500/30" />
        <p className="text-sm font-semibold text-brand-800">Restoring your session...</p>
      </div>
    </div>
  );
}
