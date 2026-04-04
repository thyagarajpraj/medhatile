import axios from "axios";
import type {
  AuthCredentials,
  AuthSession,
  LeaderboardEntry,
  LevelConfig,
  Movie,
  MovieListResponse,
  MoviePayload,
  MovieUpdatePayload,
  User,
} from "@medhatile/types";

const FALLBACK_API_BASE_URL = "https://medhatile.onrender.com/api";

type ProcessEnvShape = {
  API_URL?: string;
  VITE_API_BASE_URL?: string;
};

/**
 * Resolves the shared API base URL across web, mobile, and backend-adjacent tools.
 */
function resolveApiBaseUrl(): string {
  const processEnv =
    typeof globalThis === "object" && globalThis && "process" in globalThis
      ? (globalThis as typeof globalThis & { process?: { env?: ProcessEnvShape } }).process?.env
      : undefined;

  const configuredValue = processEnv?.VITE_API_BASE_URL || processEnv?.API_URL || FALLBACK_API_BASE_URL;

  return configuredValue.replace(/\/+$/, "");
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Registers an auth-token interceptor on the shared API client.
 */
export function attachAuthToken(getToken: () => string | null): void {
  api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }

    return config;
  });
}

/**
 * Sets or clears the shared bearer token on the API client defaults.
 */
export function setAuthToken(token?: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

/**
 * Registers a new user with email/password credentials.
 */
export async function register(data: AuthCredentials): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/auth/register", data);
  return response.data;
}

/**
 * Logs in an existing user with email/password credentials.
 */
export async function login(data: AuthCredentials): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/auth/login", data);
  return response.data;
}

/**
 * Restores the current authenticated user.
 */
export async function getCurrentUser(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>("/auth/me");
  return response.data;
}

/**
 * Loads the backend-controlled game level list.
 */
export async function getLevels(): Promise<{ levels: LevelConfig[] }> {
  const response = await api.get<{ levels: LevelConfig[] }>("/game/levels");
  return response.data;
}

/**
 * Loads backend-controlled game configuration values.
 */
export async function getGameConfig(): Promise<{ roundsPerLevel: number }> {
  const response = await api.get<{ roundsPerLevel: number }>("/game/config");
  return response.data;
}

/**
 * Requests a new memory pattern from the backend.
 */
export async function getPattern(gridSize: number, count: number): Promise<{ pattern: number[] }> {
  const response = await api.get<{ pattern: number[] }>("/game/pattern", {
    params: { gridSize, count },
  });
  return response.data;
}

/**
 * Saves a completed score using the backend game endpoint.
 */
export async function saveScore(data: { score: number; level: number }): Promise<{ success: true; message: string; bestScore: number }> {
  const response = await api.post<{ success: true; message: string; bestScore: number }>("/game/save", data);
  return response.data;
}

/**
 * Syncs the best score for the signed-in account.
 */
export async function syncBestScore(data: { bestScore: number }): Promise<{ success: true; bestScore: number }> {
  const response = await api.post<{ success: true; bestScore: number }>("/game/best-score/sync", data);
  return response.data;
}

/**
 * Loads leaderboard entries from the backend.
 */
export async function getLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  const response = await api.get<{ entries: LeaderboardEntry[] }>("/leaderboard");
  return response.data;
}

/**
 * Loads the movies list with optional filters.
 */
export async function getMovies(params: { page?: number; limit?: number; title?: string }): Promise<MovieListResponse> {
  const response = await api.get<MovieListResponse>("/movies", { params });
  return response.data;
}

/**
 * Loads one movie by id.
 */
export async function getMovie(id: string): Promise<{ movie: Movie }> {
  const response = await api.get<{ movie: Movie }>(`/movies/${id}`);
  return response.data;
}

/**
 * Creates a movie via the shared API client.
 */
export async function createMovie(payload: MoviePayload): Promise<{ movie: Movie }> {
  const response = await api.post<{ movie: Movie }>("/movies", payload);
  return response.data;
}

/**
 * Updates an existing movie by id.
 */
export async function updateMovie(id: string, payload: MovieUpdatePayload): Promise<{ movie: Movie }> {
  const response = await api.put<{ movie: Movie }>(`/movies/${id}`, payload);
  return response.data;
}

/**
 * Deletes an existing movie by id.
 */
export async function deleteMovie(id: string): Promise<{ deleted: true; id: string }> {
  const response = await api.delete<{ deleted: true; id: string }>(`/movies/${id}`);
  return response.data;
}
