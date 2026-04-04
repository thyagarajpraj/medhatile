import type { AuthCredentials, AuthSession, User } from "@medhatile/shared-types";
import { api } from "./api";

export async function login(data: AuthCredentials): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/api/auth/login", data);
  return response.data;
}

export async function register(data: AuthCredentials): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/api/auth/register", data);
  return response.data;
}

export async function getCurrentUser(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>("/api/auth/me");
  return response.data;
}
