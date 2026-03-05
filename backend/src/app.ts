import cors from "cors";
import express, { type Request, type Response } from "express";
import { movieRoutes } from "./features/movies/routes/movie.routes";
import gameRoutes from "./routes/game.routes";

const app = express();
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

app.use((req, _res, next) => {
  if (isHttpDebugEnabled()) {
    const origin = req.headers.origin || "-";
    const referer = req.headers.referer || "-";
    console.log(`[http-debug] ${req.method} ${req.originalUrl} origin=${origin} referer=${referer}`);
  }
  next();
});

app.use((req, res, next) => {
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
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/game", gameRoutes);
app.use("/api/movies", movieRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
