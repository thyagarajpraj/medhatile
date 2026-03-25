import type { AuthTokenPayload } from "../features/auth/types/auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthTokenPayload;
    }
  }
}

export {};
