/**
 * VictorOS Structured Backend Logger
 * Features contextual metadata, automated credential masking, and ISO timestamps.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "key",
  "apikey",
  "service_role",
  "service_role_key",
  "anon_key",
  "jwt",
]);

/**
 * Recursively masks sensitive fields in metadata payloads.
 */
export function maskSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 4 || data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Detect potential JWTs or long auth tokens
    if (data.length > 50 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
      return "[REDACTED_JWT]";
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item, depth + 1));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        sanitized[k] = "[REDACTED]";
      } else {
        sanitized[k] = maskSensitiveData(v, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
}

export interface LogContext {
  domain?: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: unknown;
}

class BackendLogger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext = {}, minLevel: LogLevel = "info") {
    this.context = context;
    this.minLevel = minLevel;
  }

  public child(additionalContext: LogContext): BackendLogger {
    return new BackendLogger({ ...this.context, ...additionalContext }, this.minLevel);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_WEIGHTS[level] >= LOG_LEVEL_WEIGHTS[this.minLevel];
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const mergedMeta = { ...this.context, ...meta };
    const safeMeta = Object.keys(mergedMeta).length > 0 ? maskSensitiveData(mergedMeta) : undefined;

    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(safeMeta ? { meta: safeMeta } : {}),
    });
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message, meta));
    }
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message, meta));
    }
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, meta));
    }
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      const errorMeta: Record<string, unknown> = { ...meta };

      if (error instanceof Error) {
        errorMeta.errorName = error.name;
        errorMeta.errorMessage = error.message;
        if (process.env.NODE_ENV !== "production") {
          errorMeta.stack = error.stack;
        }
      } else if (error) {
        errorMeta.errorRaw = String(error);
      }

      console.error(this.format("error", message, errorMeta));
    }
  }
}

export const logger = new BackendLogger(
  { system: "VictorOS" },
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug")
);
