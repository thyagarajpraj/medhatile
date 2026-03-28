import { isDev } from "./env";

const DEFAULT_DEV_API_BASE_URL = "http://127.0.0.1:5000/api";
const DEFAULT_PROD_API_BASE_URL = "https://medhatile.onrender.com/api";

/**
 * Trims and strips trailing slashes from an API base URL candidate.
 */
function normalizeApiBaseUrl(rawValue: string): string {
  const trimmedValue = rawValue.trim();
  return trimmedValue.replace(/\/+$/, "");
}

/**
 * Resolves the runtime API base URL from env configuration and app mode.
 */
function resolveApiBaseUrl(): string {
  const configuredValue = import.meta.env.VITE_API_BASE_URL;
  if (configuredValue && configuredValue.trim().length > 0) {
    return normalizeApiBaseUrl(configuredValue);
  }

  if (isDev) {
    return DEFAULT_DEV_API_BASE_URL;
  }

  return DEFAULT_PROD_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Builds an absolute API URL for the provided API pathname.
 */
export function buildApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
