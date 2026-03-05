import { isDev } from "./env";

const DEFAULT_DEV_API_BASE_URL = "http://127.0.0.1:5000/api";
const DEFAULT_PROD_API_BASE_URL = "/api";

function normalizeApiBaseUrl(rawValue: string): string {
  const trimmedValue = rawValue.trim();
  return trimmedValue.replace(/\/+$/, "");
}

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

export function buildApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
