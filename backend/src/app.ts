import cors from "cors";
import express, { type Request, type Response } from "express";
import { movieRoutes } from "./features/movies/routes/movie.routes";
import { gameRoutes } from "./routes/game.routes";

const app = express();
const getFrontendOrigin = (): string => process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const isHttpDebugEnabled = (): boolean => process.env.DEBUG_HTTP === "true";

app.use(cors({ origin: getFrontendOrigin() }));
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
  const isMoviesRequest = req.originalUrl.startsWith("/api/movies");
  if (!isMoviesRequest) {
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

app.use("/api/movies", movieRoutes);
app.use("/api", gameRoutes);

app.use((req: Request, res: Response) => {
  if (req.originalUrl.startsWith("/api/movies")) {
    console.warn(`MOVIES 404 ${req.method} ${req.originalUrl}`);
  }
  res.status(404).json({ error: "Route not found" });
});

export default app;
