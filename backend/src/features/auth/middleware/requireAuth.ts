import { type NextFunction, type Request, type Response } from "express";
import { verifyAuthToken } from "../lib/token";

/**
 * Requires a valid bearer token before allowing access to a protected route.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorizationHeader = req.header("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  const authUser = verifyAuthToken(token);

  if (!authUser) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.authUser = authUser;
  next();
}
