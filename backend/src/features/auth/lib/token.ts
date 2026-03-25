import { createHmac, timingSafeEqual } from "crypto";
import type { AuthTokenPayload } from "../types/auth";

const TOKEN_HEADER = {
  alg: "HS256",
  typ: "JWT",
};

const DEFAULT_TOKEN_LIFETIME_HOURS = 24;

/**
 * Returns the configured JWT secret, falling back to a dev-only value locally.
 */
function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  return configuredSecret && configuredSecret.length > 0 ? configuredSecret : "medhatile-dev-jwt-secret";
}

/**
 * Parses the configured token lifetime in hours.
 */
function getTokenLifetimeHours(): number {
  const configuredHours = Number(process.env.JWT_EXPIRES_IN_HOURS);
  if (!Number.isInteger(configuredHours) || configuredHours <= 0) {
    return DEFAULT_TOKEN_LIFETIME_HOURS;
  }
  return configuredHours;
}

/**
 * Encodes a JSON-serializable value into a base64url token segment.
 */
function encodeTokenSegment(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/**
 * Signs a JWT header and payload pair with the configured HMAC secret.
 */
function signUnsignedToken(unsignedToken: string): string {
  return createHmac("sha256", getJwtSecret()).update(unsignedToken).digest("base64url");
}

/**
 * Compares the provided token signature with the expected HMAC safely.
 */
function isValidSignature(unsignedToken: string, signature: string): boolean {
  const expectedSignature = signUnsignedToken(unsignedToken);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Builds a signed JWT for an authenticated user session.
 */
export function signAuthToken(user: { id: string; email: string }): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + getTokenLifetimeHours() * 60 * 60;
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    iat: issuedAt,
    exp: expiresAt,
  };

  const headerSegment = encodeTokenSegment(TOKEN_HEADER);
  const payloadSegment = encodeTokenSegment(payload);
  const unsignedToken = `${headerSegment}.${payloadSegment}`;
  const signature = signUnsignedToken(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

/**
 * Verifies a signed JWT and returns its payload when the token is still valid.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }

  const [headerSegment, payloadSegment, signature] = segments;
  const unsignedToken = `${headerSegment}.${payloadSegment}`;

  if (!isValidSignature(unsignedToken, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as Partial<AuthTokenPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      payload.exp <= now
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
