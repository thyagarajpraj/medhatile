import { AUTH_STORAGE_KEY } from "@medhatile/auth";
import type { AuthSession } from "../types/auth";

/**
 * Returns whether an unknown value matches the persisted auth-session shape.
 */
function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;
  return (
    typeof candidate.token === "string" &&
    typeof candidate.user?.id === "string" &&
    typeof candidate.user?.email === "string" &&
    typeof candidate.user?.bestScore === "number"
  );
}

/**
 * Reads the stored auth session from localStorage when available.
 */
export function readStoredAuthSession(): AuthSession | null {
  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return isAuthSession(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

/**
 * Persists the current auth session to localStorage.
 */
export function storeAuthSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clears the stored auth session from localStorage.
 */
export function clearStoredAuthSession(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
