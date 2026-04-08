import axios from "axios";

type ProcessEnvShape = {
  API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
};

function resolveApiBaseUrl(): string {
  const processEnv =
    typeof globalThis === "object" && globalThis && "process" in globalThis
      ? (globalThis as typeof globalThis & { process?: { env?: ProcessEnvShape } }).process?.env
      : undefined;

  const configuredValue = processEnv?.VITE_API_BASE_URL || processEnv?.API_BASE_URL;

  if (configuredValue) {
    return configuredValue.replace(/\/+$/, "");
  }

  const windowLocation =
    typeof window !== "undefined" && typeof window.location === "object" && window.location
      ? window.location
      : undefined;

  if (typeof windowLocation?.hostname === "string") {
    if (windowLocation.hostname === "localhost" || windowLocation.hostname === "127.0.0.1") {
      return "http://127.0.0.1:5000";
    }
  }

  return "https://medhatile.onrender.com";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
