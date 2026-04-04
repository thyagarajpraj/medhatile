import { buildApiUrl } from "../../../config/api";
import { buildRequestHeaders, parseApiError } from "../../../lib/http";
import type { AuthCredentials, AuthSession, AuthUser } from "../types/auth";

/**
 * Parses a backend user payload into the frontend auth-user shape.
 */
function parseAuthUser(payload: unknown): AuthUser {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid authenticated user payload");
  }

  const candidate = payload as Partial<AuthUser>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.bestScore !== "number"
  ) {
    throw new Error("Invalid authenticated user payload");
  }

  return {
    id: candidate.id,
    email: candidate.email,
    bestScore: candidate.bestScore,
  };
}

/**
 * Parses a backend auth response into the frontend auth-session shape.
 */
function parseAuthSession(payload: unknown): AuthSession {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid auth response");
  }

  const candidate = payload as Partial<AuthSession>;
  if (typeof candidate.token !== "string") {
    throw new Error("Invalid auth response");
  }

  return {
    token: candidate.token,
    user: parseAuthUser(candidate.user),
  };
}

/**
 * Registers a new user with email/password credentials.
 */
export async function registerFromApi(credentials: AuthCredentials): Promise<AuthSession> {
  const response = await fetch(buildApiUrl("/auth/register"), {
    method: "POST",
    headers: buildRequestHeaders(undefined, true),
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to register");
  }

  return parseAuthSession((await response.json()) as unknown);
}

/**
 * Logs an existing user in with email/password credentials.
 */
export async function loginFromApi(credentials: AuthCredentials): Promise<AuthSession> {
  const response = await fetch(buildApiUrl("/auth/login"), {
    method: "POST",
    headers: buildRequestHeaders(undefined, true),
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to sign in");
  }

  return parseAuthSession((await response.json()) as unknown);
}

/**
 * Restores the current authenticated user from a stored bearer token.
 */
export async function fetchCurrentUserFromApi(authToken: string): Promise<AuthUser> {
  const response = await fetch(buildApiUrl("/auth/me"), {
    headers: buildRequestHeaders(authToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(response, "Failed to restore session");
  }

  const payload = (await response.json()) as { user?: unknown };
  return parseAuthUser(payload.user);
}
