import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { movieRoutes } from "./features/movies/routes/movie.routes";
import gameRoutes from "./routes/game.routes";

const app = express();

/**
 * Returns whether verbose HTTP request logging is enabled.
 */
const isHttpDebugEnabled = (): boolean => process.env.DEBUG_HTTP === "true";

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
 * Logs inbound requests when debug logging is enabled.
 */
const logHttpDebug = (req: Request, _res: Response, next: NextFunction): void => {
  if (isHttpDebugEnabled()) {
    const origin = req.headers.origin || "-";
    const referer = req.headers.referer || "-";
    console.log(`[http-debug] ${req.method} ${req.originalUrl} origin=${origin} referer=${referer}`);
  }
  next();
};

/**
 * Logs request and response timing for movies API traffic.
 */
const logMovieRequests = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.originalUrl.startsWith("/api/movies")) {
    next();
    return;
  }

  const startedAt = Date.now();
  console.log(`MOVIES IN  ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    console.log(`MOVIES OUT ${res.statusCode} ${req.method} ${req.originalUrl} (${elapsedMs}ms)`);
  });

  next();
};

/**
 * Returns a plain-text process health check response.
 */
const handleHealth = (_req: Request, res: Response): void => {
  res.status(200).send("OK");
};

/**
 * Returns a JSON health payload for API callers.
 */
const handleApiHealth = (_req: Request, res: Response): void => {
  res.status(200).json({ status: "ok" });
};

/**
 * Returns a JSON 404 payload for unknown routes.
 */
const handleNotFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: "Route not found" });
};

app.use(logHttpDebug);
app.use(logMovieRequests);

app.get("/health", handleHealth);
app.get("/api/health", handleApiHealth);

app.use("/api/game", gameRoutes);
app.use("/api/movies", movieRoutes);

app.use(handleNotFound);

export default app;
