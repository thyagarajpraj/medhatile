import type { AuthSession } from "@medhatile/types";

/**
 * Represents the storage adapter required for cross-platform auth persistence.
 */
export type SessionStorageAdapter = {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
};

export const AUTH_STORAGE_KEY = "medhatile_auth_session";

/**
 * Returns whether a value matches the persisted auth-session shape.
 */
export function isAuthSession(value: unknown): value is AuthSession {
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
 * Reads the stored auth session using the provided storage adapter.
 */
export async function readStoredAuthSession(storage: SessionStorageAdapter, storageKey = AUTH_STORAGE_KEY): Promise<AuthSession | null> {
  try {
    const rawValue = await storage.getItem(storageKey);
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
 * Persists the auth session using the provided storage adapter.
 */
export async function storeAuthSession(storage: SessionStorageAdapter, session: AuthSession, storageKey = AUTH_STORAGE_KEY): Promise<void> {
  await storage.setItem(storageKey, JSON.stringify(session));
}

/**
 * Clears the persisted auth session using the provided storage adapter.
 */
export async function clearStoredAuthSession(storage: SessionStorageAdapter, storageKey = AUTH_STORAGE_KEY): Promise<void> {
  await storage.removeItem(storageKey);
}
