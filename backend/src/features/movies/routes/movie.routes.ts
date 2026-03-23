import { Router, type NextFunction, type Request, type Response } from "express";
import {
  createMovie,
  deleteMovie,
  getMovieById,
  listMovies,
  updateMovie,
} from "../controllers/movie.controller";

export const movieRoutes = Router();

/**
 * Logs movies-router activity for quick local debugging.
 */
const logMovieRouterTraffic = (req: Request, _res: Response, next: NextFunction): void => {
  console.log(`MOVIES ROUTER ${req.method} base=${req.baseUrl} path=${req.path}`);
  next();
};

movieRoutes.use(logMovieRouterTraffic);

movieRoutes.get("/", listMovies);
movieRoutes.get("/:id", getMovieById);
movieRoutes.post("/", createMovie);
movieRoutes.put("/:id", updateMovie);
movieRoutes.delete("/:id", deleteMovie);
