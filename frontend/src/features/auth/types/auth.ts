/**
 * Represents the available password-auth screen modes.
 */
export type AuthMode = "login" | "register";

/**
 * Represents the password-auth credentials sent to the backend.
 */
export type AuthCredentials = {
  email: string;
  password: string;
};

/**
 * Represents the authenticated user returned by the backend.
 */
export type AuthUser = {
  id: string;
  email: string;
  bestScore: number;
};

/**
 * Represents the persisted authenticated session in the SPA.
 */
export type AuthSession = {
  token: string;
  user: AuthUser;
};
