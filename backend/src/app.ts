import cors from "cors";
import express, { type Request, type Response } from "express";
import gameRoutes from "./routes/game.routes";

const app = express();

const rawOrigins = process.env.FRONTEND_ORIGIN ?? "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 0 ? true : allowedOrigins,
  }),
);

app.use(express.json());

/**
 * Lightweight uptime probe endpoint.
 */
function healthTextHandler(_req: Request, res: Response): void {
  res.status(200).send("OK");
}

/**
 * JSON health endpoint for integrations and dashboards.
 */
function healthJsonHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok" });
}

/**
 * Default 404 fallback for unknown routes.
 */
function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}

app.get("/health", healthTextHandler);
app.get("/api/health", healthJsonHandler);
app.use("/api/game", gameRoutes);
app.use(notFoundHandler);

export default app;