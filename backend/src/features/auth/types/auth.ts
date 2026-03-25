/**
 * Represents the identity claims embedded in a signed auth token.
 */
export type AuthTokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

/**
 * Represents the authenticated user shape returned to the frontend.
 */
export type AuthUser = {
  id: string;
  email: string;
  bestScore: number;
};

/**
 * Represents the successful auth response payload returned by the backend.
 */
export type AuthResponse = {
  token: string;
  user: AuthUser;
};
