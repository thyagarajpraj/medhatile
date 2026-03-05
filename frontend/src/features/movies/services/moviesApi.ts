import { API_BASE_URL, buildApiUrl } from "../../../config/api";
import type { Movie, MovieListResponse, MoviePayload, MovieUpdatePayload } from "../types/movie";

export const MOVIES_API_BASE_URL = API_BASE_URL;

async function parseError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return new Error(payload.error);
    }
  } catch {
    // Ignore parse failures and use fallback.
  }

  return new Error(fallback);
}

export async function fetchMoviesFromApi(params?: {
  page?: number;
  limit?: number;
  title?: string;
}): Promise<MovieListResponse> {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  if (params?.title) {
    query.set("title", params.title);
  }

  const queryString = query.toString();
  const endpoint = queryString ? `${buildApiUrl("/movies")}?${queryString}` : buildApiUrl("/movies");
  if (import.meta.env.DEV) {
    console.log(`[movies-api] GET ${endpoint}`);
  }
  const response = await fetch(endpoint, { cache: "no-store" });
  if (import.meta.env.DEV) {
    console.log(`[movies-api] RES ${response.status} ${endpoint}`);
  }

  if (!response.ok) {
    throw await parseError(response, "Failed to fetch movies");
  }

  const payload = (await response.json()) as MovieListResponse;

  if (!Array.isArray(payload.movies)) {
    throw new Error("Invalid movies payload");
  }

  return payload;
}

export async function fetchMovieByIdFromApi(id: string): Promise<Movie> {
  const endpoint = buildApiUrl(`/movies/${id}`);
  if (import.meta.env.DEV) {
    console.log(`[movies-api] GET ${endpoint}`);
  }
  const response = await fetch(endpoint, { cache: "no-store" });

  if (!response.ok) {
    throw await parseError(response, "Failed to fetch movie");
  }

  const payload = (await response.json()) as { movie?: Movie };
  if (!payload.movie) {
    throw new Error("Invalid movie payload");
  }

  return payload.movie;
}

export async function createMovieFromApi(payload: MoviePayload): Promise<Movie> {
  const endpoint = buildApiUrl("/movies");
  if (import.meta.env.DEV) {
    console.log(`[movies-api] POST ${endpoint}`);
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to create movie");
  }

  const body = (await response.json()) as { movie?: Movie };
  if (!body.movie) {
    throw new Error("Invalid create movie payload");
  }

  return body.movie;
}

export async function updateMovieFromApi(id: string, payload: MovieUpdatePayload): Promise<Movie> {
  const endpoint = buildApiUrl(`/movies/${id}`);
  if (import.meta.env.DEV) {
    console.log(`[movies-api] PUT ${endpoint}`);
  }
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to update movie");
  }

  const body = (await response.json()) as { movie?: Movie };
  if (!body.movie) {
    throw new Error("Invalid update movie payload");
  }

  return body.movie;
}

export async function deleteMovieFromApi(id: string): Promise<void> {
  const endpoint = buildApiUrl(`/movies/${id}`);
  if (import.meta.env.DEV) {
    console.log(`[movies-api] DELETE ${endpoint}`);
  }
  const response = await fetch(endpoint, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to delete movie");
  }
}
