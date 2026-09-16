/**
 * VictorOS Backend Error Architecture
 * Standardized typed error classes and safe serialization for HTTP and Server Action boundaries.
 */

import { HTTP_STATUS } from "./constants";

export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code = "INTERNAL_SERVER_ERROR",
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Capture stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 401 Unauthenticated Error
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required. Please sign in.", details?: ErrorDetails) {
    super(message, "UNAUTHENTICATED", HTTP_STATUS.UNAUTHORIZED, details);
  }
}

/**
 * 403 Forbidden / Unauthorized Error
 */
export class AuthorizationError extends AppError {
  constructor(message = "Access denied. Insufficient permissions.", details?: ErrorDetails) {
    super(message, "FORBIDDEN", HTTP_STATUS.FORBIDDEN, details);
  }
}

export { AuthorizationError as ForbiddenError };

/**
 * 400 Validation Error (e.g. invalid Zod input or malformed payload)
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed for the supplied input.", details?: ErrorDetails) {
    super(message, "VALIDATION_ERROR", HTTP_STATUS.BAD_REQUEST, details);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource", identifier?: string, details?: ErrorDetails) {
    const msg = identifier ? `${resource} '${identifier}' was not found.` : `${resource} was not found.`;
    super(msg, "NOT_FOUND", HTTP_STATUS.NOT_FOUND, details);
  }
}

/**
 * 409 Conflict Error (e.g. duplicate unique slug or resource conflict)
 */
export class ConflictError extends AppError {
  constructor(message = "Resource conflict detected.", details?: ErrorDetails) {
    super(message, "CONFLICT", HTTP_STATUS.CONFLICT, details);
  }
}

/**
 * 429 Too Many Requests Error (Rate limiting)
 */
export class TooManyRequestsError extends AppError {
  constructor(message = "Rate limit exceeded. Please slow down and try again later.", details?: ErrorDetails) {
    super(message, "RATE_LIMIT_EXCEEDED", HTTP_STATUS.TOO_MANY_REQUESTS, details);
  }
}

export { TooManyRequestsError as RateLimitError };

/**
 * 500 Database Error (Never leaks raw SQL or credentials to public consumers)
 */
export class DatabaseError extends AppError {
  constructor(message = "A database operation failed.", details?: ErrorDetails) {
    super(message, "DATABASE_ERROR", HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * 502 External Service Error (e.g. Supabase Auth API down, Gemini API error)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message = "External service request failed.", details?: ErrorDetails) {
    super(`${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", HTTP_STATUS.BAD_GATEWAY, details);
  }
}

/**
 * Safe client error representation
 */
export interface SafeErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: ErrorDetails;
  };
}

/**
 * Transforms any caught error into a safe client response.
 * Completely suppresses stack traces, raw SQL queries, and internal server credentials.
 */
export function toSafeErrorResponse(error: unknown): SafeErrorResponse {
  if (error instanceof AppError && error.isOperational) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
    };
  }

  // Handle generic / unexpected runtime errors securely
  const isDev = process.env.NODE_ENV !== "production";
  const message = isDev && error instanceof Error ? error.message : "An unexpected system error occurred.";

  return {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    },
  };
}
