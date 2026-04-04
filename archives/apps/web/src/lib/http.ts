/**
 * Represents a backend API error that includes the HTTP response status.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Extracts a user-facing error message from an HTTP response payload.
 */
export async function parseApiError(response: Response, fallback: string): Promise<ApiError> {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    if (payload.error) {
      return new ApiError(response.status, payload.error);
    }

    if (payload.message) {
      return new ApiError(response.status, payload.message);
    }
  } catch {
    // Ignore parse failures and fall back to the provided message.
  }

  return new ApiError(response.status, fallback);
}

/**
 * Builds JSON and bearer-token headers for authenticated API requests.
 */
export function buildRequestHeaders(authToken?: string, includeJsonContentType = false): HeadersInit {
  return {
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

/**
 * Returns whether an unknown thrown value carries the provided HTTP status code.
 */
export function hasHttpStatus(error: unknown, status: number): boolean {
  if (error instanceof ApiError) {
    return error.status === status;
  }

  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }

  const response = (error as { response?: { status?: number } }).response;
  return response?.status === status;
}
