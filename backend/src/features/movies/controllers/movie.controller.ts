import { type Request, type Response } from "express";
import { Types } from "mongoose";
import { Movie } from "../models/movie.model";

type MovieWritePayload = {
  title?: string;
  year?: number;
  plot?: string;
  genres?: string[];
};

type ParseResult =
  | { ok: true; value: MovieWritePayload }
  | { ok: false; error: string };

const MIN_YEAR = 1888;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseGenres(value: unknown): string[] | null {
  if (value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.map((item) => item.trim()).filter((item) => item.length > 0);
  }

  return null;
}

function parseMoviePayload(body: unknown, requireTitle: boolean): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const candidate = body as Record<string, unknown>;
  const payload: MovieWritePayload = {};

  if (candidate.title !== undefined) {
    if (typeof candidate.title !== "string" || candidate.title.trim().length === 0) {
      return { ok: false, error: "title must be a non-empty string" };
    }
    payload.title = candidate.title.trim();
  } else if (requireTitle) {
    return { ok: false, error: "title is required" };
  }

  if (candidate.year !== undefined) {
    const year = Number(candidate.year);
    if (!Number.isInteger(year) || year < MIN_YEAR) {
      return { ok: false, error: `year must be an integer >= ${MIN_YEAR}` };
    }
    payload.year = year;
  }

  if (candidate.plot !== undefined) {
    if (typeof candidate.plot !== "string") {
      return { ok: false, error: "plot must be a string" };
    }
    payload.plot = candidate.plot.trim();
  }

  if (candidate.genres !== undefined) {
    const genres = parseGenres(candidate.genres);
    if (!genres) {
      return { ok: false, error: "genres must be a comma-separated string or string[]" };
    }
    payload.genres = genres;
  }

  if (!requireTitle && Object.keys(payload).length === 0) {
    return { ok: false, error: "No valid fields provided for update" };
  }

  return { ok: true, value: payload };
}

export const listMovies = async (req: Request, res: Response): Promise<void> => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 12), 50);
  const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
  const filter = title ? { title: { $regex: escapeRegex(title), $options: "i" } } : {};

  try {
    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .sort({ year: -1, title: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("_id title year plot genres")
        .lean(),
      Movie.countDocuments(filter),
    ]);

    res.json({ movies, page, limit, total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies", details: String(error) });
  }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  try {
    const movie = await Movie.findById(id).select("_id title year plot genres").lean();
    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.json({ movie });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie", details: String(error) });
  }
};

export const createMovie = async (req: Request, res: Response): Promise<void> => {
  const parsed = parseMoviePayload(req.body, true);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const movie = await Movie.create(parsed.value);
    const responseMovie = await Movie.findById(movie._id).select("_id title year plot genres").lean();
    res.status(201).json({ movie: responseMovie });
  } catch (error) {
    res.status(500).json({ error: "Failed to create movie", details: String(error) });
  }
};

export const updateMovie = async (req: Request, res: Response): Promise<void> => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  const parsed = parseMoviePayload(req.body, false);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const movie = await Movie.findByIdAndUpdate(id, parsed.value, {
      returnDocument: "after",
      runValidators: true,
    })
      .select("_id title year plot genres")
      .lean();

    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.json({ movie });
  } catch (error) {
    res.status(500).json({ error: "Failed to update movie", details: String(error) });
  }
};

export const deleteMovie = async (req: Request, res: Response): Promise<void> => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  try {
    const deletedMovie = await Movie.findByIdAndDelete(id).select("_id").lean();
    if (!deletedMovie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.json({ deleted: true, id });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete movie", details: String(error) });
  }
};
