export type AuthMode = "login" | "register";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes email input before auth requests are submitted.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates auth form input and returns a user-facing error message when invalid.
 */
export function validateAuthInput(
  mode: AuthMode,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (mode === "register" && password !== confirmPassword) {
    return "Confirm Password must match Password.";
  }

  return null;
}
