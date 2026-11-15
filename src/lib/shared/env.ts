/**
 * Tovu Environment Configuration
 * Centralized, strongly typed environment access with Vite/Node safety and server-only isolation.
 */

import { AppError } from "./errors";

function readBrowserImportMetaEnv(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    return metaEnv?.[key];
  } catch {
    return undefined;
  }
}

function readProcessEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim();
  if (url && !url.includes(".") && !url.includes("/")) {
    url = `https://${url}.supabase.co`;
  } else if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

function isPlaceholderValue(val: string | undefined, markers: string[]): boolean {
  if (!val || !val.trim()) return true;
  const lower = val.toLowerCase();
  return markers.some((m) => lower.includes(m));
}

/**
 * Validates and retrieves public environment variables safe for browser exposure.
 * Strictly reads only VITE_* (client) or public server aliases; never reads service-role keys.
 */
export function getPublicEnv(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
} {
  const rawUrl =
    readBrowserImportMetaEnv("VITE_SUPABASE_URL") ||
    readProcessEnv("VITE_SUPABASE_URL") ||
    readProcessEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    readProcessEnv("SUPABASE_URL") ||
    "https://placeholder-project.supabase.co";

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  const supabaseAnonKey =
    readBrowserImportMetaEnv("VITE_SUPABASE_ANON_KEY") ||
    readProcessEnv("VITE_SUPABASE_ANON_KEY") ||
    readProcessEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readProcessEnv("SUPABASE_ANON_KEY") ||
    "placeholder-anon-key";

  const appUrl =
    readBrowserImportMetaEnv("VITE_APP_URL") ||
    readProcessEnv("APP_URL") ||
    "http://localhost:3000";

  return {
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
  };
}

/**
 * Validates and retrieves server-only environment variables.
 * Throws an explicit error if accessed in a browser runtime.
 */
export function getServerEnv(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  geminiApiKey?: string;
  sessionSecret?: string;
  nodeEnv: "development" | "test" | "production";
} {
  if (typeof window !== "undefined") {
    throw new AppError(
      "CRITICAL: Attempted to access server-only environment variables in a browser context.",
      "ILLEGAL_CLIENT_ENV_ACCESS",
      500
    );
  }

  const publicConfig = getPublicEnv();
  const serviceRoleKey = readProcessEnv("SUPABASE_SERVICE_ROLE_KEY") || "";
  const nodeEnv =
    (readProcessEnv("NODE_ENV") as "development" | "test" | "production") || "development";

  return {
    ...publicConfig,
    supabaseServiceRoleKey: serviceRoleKey,
    geminiApiKey: readProcessEnv("GEMINI_API_KEY"),
    sessionSecret: readProcessEnv("SESSION_SECRET") || readProcessEnv("TOVU_SESSION_SECRET"),
    nodeEnv,
  };
}

/**
 * Asserts that Supabase credentials are configured before executing database operations.
 */
export function assertSupabaseConfigured(requireAdmin = false): void {
  const env = getPublicEnv();
  if (
    isPlaceholderValue(env.supabaseUrl, ["placeholder-project", "your-project-id"]) ||
    isPlaceholderValue(env.supabaseAnonKey, ["placeholder-anon-key", "your-supabase-anon-key"])
  ) {
    throw new AppError(
      "Supabase connection is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      "SUPABASE_NOT_CONFIGURED",
      503
    );
  }

  if (requireAdmin) {
    const serverEnv = getServerEnv();
    if (
      isPlaceholderValue(serverEnv.supabaseServiceRoleKey, [
        "your-supabase",
        "placeholder",
      ])
    ) {
      throw new AppError(
        "Supabase Admin operations require SUPABASE_SERVICE_ROLE_KEY in server environment.",
        "SERVICE_ROLE_NOT_CONFIGURED",
        503
      );
    }
  }
}

/**
 * Checks whether Supabase is configured with non-placeholder credentials.
 */
export function isSupabaseConfigured(requireAdmin = false): boolean {
  try {
    assertSupabaseConfigured(requireAdmin);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks whether explicit client dev-fixture fallback mode is enabled.
 * Only permitted outside production or when VITE_ENABLE_DEV_FIXTURES="true".
 */
export function isDevFixtureModeEnabled(): boolean {
  const flag =
    readBrowserImportMetaEnv("VITE_ENABLE_DEV_FIXTURES") ||
    readProcessEnv("VITE_ENABLE_DEV_FIXTURES");
  if (flag === "true") return true;
  if (flag === "false") return false;
  const mode =
    readBrowserImportMetaEnv("MODE") ||
    readProcessEnv("NODE_ENV") ||
    "development";
  return mode !== "production" && !isSupabaseConfigured(false);
}
