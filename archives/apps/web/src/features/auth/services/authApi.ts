import { getCurrentUser, login, register, setAuthToken } from "@medhatile/api";
import type { AuthCredentials, AuthSession, AuthUser } from "../types/auth";

/**
 * Registers a new user with email/password credentials.
 */
export async function registerFromApi(credentials: AuthCredentials): Promise<AuthSession> {
  return register(credentials);
}

/**
 * Logs an existing user in with email/password credentials.
 */
export async function loginFromApi(credentials: AuthCredentials): Promise<AuthSession> {
  return login(credentials);
}

/**
 * Restores the current authenticated user from a stored bearer token.
 */
export async function fetchCurrentUserFromApi(authToken: string): Promise<AuthUser> {
  setAuthToken(authToken);
  const response = await getCurrentUser();
  return response.user;
}
