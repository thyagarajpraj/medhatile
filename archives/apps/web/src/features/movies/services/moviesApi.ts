import { api, createMovie, deleteMovie, getMovie, getMovies, setAuthToken, updateMovie } from "@medhatile/api";
import type { Movie, MovieListResponse, MoviePayload, MovieUpdatePayload } from "../types/movie";

export const MOVIES_API_BASE_URL = String(api.defaults.baseURL ?? "");

/**
 * Fetches a paginated list of movies using the optional query filters.
 */
export async function fetchMoviesFromApi(params?: {
  page?: number;
  limit?: number;
  title?: string;
}, authToken?: string): Promise<MovieListResponse> {
  setAuthToken(authToken);
  const payload = await getMovies(params ?? {});

  if (!Array.isArray(payload.movies)) {
    throw new Error("Invalid movies payload");
  }

  return payload;
}

/**
 * Fetches a single movie document by id.
 */
export async function fetchMovieByIdFromApi(id: string, authToken?: string): Promise<Movie> {
  setAuthToken(authToken);
  const payload = await getMovie(id);
  if (!payload.movie) {
    throw new Error("Invalid movie payload");
  }

  return payload.movie;
}

/**
 * Creates a movie through the backend API and returns the saved document.
 */
export async function createMovieFromApi(payload: MoviePayload, authToken?: string): Promise<Movie> {
  setAuthToken(authToken);
  const body = await createMovie(payload);
  if (!body.movie) {
    throw new Error("Invalid create movie payload");
  }

  return body.movie;
}

/**
 * Updates a movie by id and returns the persisted document snapshot.
 */
export async function updateMovieFromApi(id: string, payload: MovieUpdatePayload, authToken?: string): Promise<Movie> {
  setAuthToken(authToken);
  const body = await updateMovie(id, payload);
  if (!body.movie) {
    throw new Error("Invalid update movie payload");
  }

  return body.movie;
}

/**
 * Deletes a movie by id.
 */
export async function deleteMovieFromApi(id: string, authToken?: string): Promise<void> {
  setAuthToken(authToken);
  await deleteMovie(id);
}
