import { Router } from "express";
import {
  createMovie,
  deleteMovie,
  getMovieById,
  listMovies,
  updateMovie,
} from "../controllers/movie.controller";

export const movieRoutes = Router();

movieRoutes.use((req, _res, next) => {
  console.log(`MOVIES ROUTER ${req.method} base=${req.baseUrl} path=${req.path}`);
  next();
});

movieRoutes.get("/", listMovies);
movieRoutes.get("/:id", getMovieById);
movieRoutes.post("/", createMovie);
movieRoutes.put("/:id", updateMovie);
movieRoutes.delete("/:id", deleteMovie);
