/**
 * VictorOS Standard API Response Architecture
 * Enforces predictable JSON payloads across route handlers and server endpoints.
 */

import { toSafeErrorResponse } from "./errors";
import { HTTP_STATUS } from "./constants";
import { logger } from "./logger";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createApiResponse<T>(data: T, meta?: unknown): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta !== undefined ? { meta } : {}),
  };
}

export function createApiError(error: unknown): ApiErrorResponse {
  return toSafeErrorResponse(error);
}

/**
 * Standard route error wrapper for Express / Node HTTP route handlers.
 */
export async function executeApiHandler<T>(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  handler: () => Promise<T>,
  statusCode = HTTP_STATUS.OK
): Promise<void> {
  try {
    const result = await handler();
    res.status(statusCode).json(createApiResponse(result));
  } catch (err) {
    const errorResponse = createApiError(err);
    logger.error("API Route execution error", err, { statusCode: errorResponse.error.statusCode });
    res.status(errorResponse.error.statusCode).json(errorResponse);
  }
}
