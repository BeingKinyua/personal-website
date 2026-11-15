/**
 * Canonical API Client for Tovu Frontend
 * Handles typed requests to /api/v1/* with credentials, abort cancellation,
 * structured errors, and explicit dev-fixture fallback detection.
 */

import { isDevFixtureModeEnabled } from "../lib/shared/env";

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code = "API_ERROR",
    statusCode = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ApiEnvelopeSuccess<T> {
  success: true;
  data: T;
  meta?: unknown;
}

export interface ApiEnvelopeError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export function shouldFallbackToDevFixture(err: unknown): boolean {
  if (!isDevFixtureModeEnabled()) {
    return false;
  }
  if (err instanceof ApiClientError) {
    return (
      err.code === "SUPABASE_NOT_CONFIGURED" ||
      err.code === "SERVICE_ROLE_NOT_CONFIGURED" ||
      err.statusCode === 503
    );
  }
  return false;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = path.startsWith("/api/") ? path : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method || "GET";

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw err;
    }
    throw new ApiClientError(
      err instanceof Error ? err.message : "Network request failed",
      "NETWORK_ERROR",
      0
    );
  }

  let payload: ApiEnvelopeSuccess<T> | ApiEnvelopeError | null = null;
  try {
    payload = (await response.json()) as ApiEnvelopeSuccess<T> | ApiEnvelopeError;
  } catch {
    if (!response.ok) {
      throw new ApiClientError(
        `Request failed with status ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }
    throw new ApiClientError("Invalid JSON response from server", "INVALID_RESPONSE", response.status);
  }

  if (!response.ok || !payload || payload.success === false) {
    const errObj = payload && "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      errObj?.message || `Request failed with status ${response.status}`,
      errObj?.code || "API_ERROR",
      errObj?.statusCode || response.status,
      errObj?.details
    );
  }

  return payload.data;
}
