/**
 * VictorOS Environment Configuration
 * Centralized, strongly typed environment access with validation and server-only isolation.
 */

import { z } from "zod";
import { AppError } from "./errors";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty").optional(),
  APP_URL: z.string().url("APP_URL must be a valid URL").optional().default("http://localhost:3000"),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required for admin operations").optional(),
  GEMINI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and retrieves public environment variables safe for browser exposure.
 */
export function getPublicEnv(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
} {
  let url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder-project.supabase.co";

  url = url.trim();
  if (url && !url.includes(".") && !url.includes("/")) {
    url = `https://${url}.supabase.co`;
  } else if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "placeholder-anon-key";

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return {
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return {
    ...publicConfig,
    supabaseServiceRoleKey: serviceRoleKey,
    geminiApiKey: process.env.GEMINI_API_KEY,
    nodeEnv: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
  };
}

/**
 * Asserts that Supabase credentials are configured before executing database operations.
 */
export function assertSupabaseConfigured(requireAdmin = false): void {
  const env = getPublicEnv();
  if (
    !env.supabaseUrl ||
    env.supabaseUrl.includes("placeholder-project") ||
    env.supabaseUrl.includes("your-project-id") ||
    !env.supabaseAnonKey ||
    env.supabaseAnonKey.includes("placeholder-anon-key") ||
    env.supabaseAnonKey.includes("your-supabase-anon-key")
  ) {
    throw new AppError(
      "Supabase connection is not yet configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      "SUPABASE_NOT_CONFIGURED",
      500
    );
  }

  if (requireAdmin) {
    const serverEnv = getServerEnv();
    if (!serverEnv.supabaseServiceRoleKey || serverEnv.supabaseServiceRoleKey.includes("your-supabase") || serverEnv.supabaseServiceRoleKey.includes("placeholder")) {
      throw new AppError(
        "Supabase Admin operations require SUPABASE_SERVICE_ROLE_KEY to be configured in server environment.",
        "SERVICE_ROLE_NOT_CONFIGURED",
        500
      );
    }
  }
}

/**
 * Checks whether Supabase is configured with non-placeholder credentials
 */
export function isSupabaseConfigured(requireAdmin = false): boolean {
  try {
    assertSupabaseConfigured(requireAdmin);
    return true;
  } catch {
    return false;
  }
}
