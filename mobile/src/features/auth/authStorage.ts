import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthSession } from "@medhatile/shared-types";

const STORAGE_KEY = "medhatile_mobile_session";

/**
 * Reads a previously stored mobile auth session from AsyncStorage.
 */
export async function readStoredSession(): Promise<AuthSession | null> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Persists the active mobile auth session in AsyncStorage.
 */
export async function storeSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clears the active mobile auth session from AsyncStorage.
 */
export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
