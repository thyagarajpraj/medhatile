import type { AuthSession } from "@medhatile/shared-types";

const SESSION_STORAGE_KEY = "medhatile_web_session";

/**
 * Reads a previously stored auth session from local storage.
 */
export function readSession(): AuthSession | null {
  const rawValue = globalThis.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Persists or clears the current auth session in local storage.
 */
export function writeSession(session: AuthSession | null): void {
  if (!session) {
    globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  globalThis.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
