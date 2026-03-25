import { type Request, type Response } from "express";
import { User } from "../models/user.model";
import { hashPassword, verifyPassword } from "../lib/password";
import { signAuthToken } from "../lib/token";
import type { AuthResponse, AuthUser } from "../types/auth";

type AuthCredentials = {
  email: string;
  password: string;
};

type ParseCredentialsResult =
  | {
      ok: true;
      value: AuthCredentials;
    }
  | {
      ok: false;
      error: string;
    };

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Converts an authenticated user record into the public response shape.
 */
function toAuthUser(user: {
  _id: string | { toString(): string };
  email: string;
  bestScore?: number;
}): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email,
    bestScore: user.bestScore ?? 0,
  };
}

/**
 * Builds a signed auth response for a validated user.
 */
function buildAuthResponse(user: {
  _id: string | { toString(): string };
  email: string;
  bestScore?: number;
}): AuthResponse {
  const publicUser = toAuthUser(user);
  return {
    token: signAuthToken(publicUser),
    user: publicUser,
  };
}

/**
 * Loads the current authenticated user from persistent storage.
 */
async function loadAuthenticatedUser(userId: string): Promise<{ _id: string; email: string; bestScore: number } | null> {
  const user = await User.findById(userId).select("_id email bestScore").lean();
  if (!user) {
    return null;
  }

  return {
    _id: user._id.toString(),
    email: user.email,
    bestScore: user.bestScore ?? 0,
  };
}

/**
 * Validates and normalizes email/password credentials from a request body.
 */
function parseCredentials(body: unknown): ParseCredentialsResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const candidate = body as Record<string, unknown>;
  const email = typeof candidate.email === "string" ? candidate.email.trim().toLowerCase() : "";
  const password = typeof candidate.password === "string" ? candidate.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Valid email is required" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  return {
    ok: true,
    value: {
      email,
      password,
    },
  };
}

/**
 * Registers a new user with an email and hashed password.
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  const parsed = parseCredentials(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: parsed.value.email }).select("_id").lean();
    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const passwordHash = await hashPassword(parsed.value.password);
    const createdUser = await User.create({
      email: parsed.value.email,
      passwordHash,
      bestScore: 0,
    });

    res.status(201).json(buildAuthResponse(createdUser));
  } catch (error) {
    res.status(500).json({ error: "Failed to register user", details: String(error) });
  }
}

/**
 * Authenticates an existing user and returns a fresh signed token.
 */
export async function loginUser(req: Request, res: Response): Promise<void> {
  const parsed = parseCredentials(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const user = await User.findOne({ email: parsed.value.email });

    if (!user || !(await verifyPassword(parsed.value.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ error: "Failed to log in", details: String(error) });
  }
}

/**
 * Returns the currently authenticated user derived from the bearer token.
 */
export function getCurrentUser(req: Request, res: Response): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  void loadAuthenticatedUser(req.authUser.sub)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "Authenticated user not found" });
        return;
      }

      res.status(200).json({
        user: toAuthUser(user),
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to load authenticated user", details: String(error) });
    });
}
