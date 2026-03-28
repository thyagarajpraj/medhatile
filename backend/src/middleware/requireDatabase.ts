import { type NextFunction, type Request, type Response } from "express";
import { connectDB, isDatabaseReady } from "../config/db";

/**
 * Ensures database-backed routes only continue when MongoDB is reachable.
 */
export async function requireDatabase(_req: Request, res: Response, next: NextFunction): Promise<void> {
  if (isDatabaseReady()) {
    next();
    return;
  }

  const isConnected = await connectDB();

  if (!isConnected) {
    res.status(503).json({ error: "Database unavailable" });
    return;
  }

  next();
}
