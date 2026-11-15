/**
 * Tovu Browser-Safe Library Exports
 * Strictly excludes server-only Supabase clients, service-role keys, and server secrets.
 * Server modules must import from "./server" instead.
 */

// Shared (browser-safe)
export * from "./shared/constants";
export * from "./shared/errors";
export * from "./shared/utils";
export { getPublicEnv, isSupabaseConfigured, isDevFixtureModeEnabled } from "./shared/env";

// Supabase (browser client + types only)
export type { Database, Json } from "./supabase/types";
export { getSupabaseBrowserClient } from "./supabase/client";

// Role definitions (pure constants/guards)
export * from "./auth/roles";

// Domain Types & Zod Schemas (browser-safe)
export * from "./projects/types";
export * from "./projects/schemas";
export * from "./articles/types";
export * from "./articles/schemas";
export * from "./labs/types";
export * from "./labs/schemas";
export * from "./knowledge/types";
export * from "./knowledge/schemas";
export * from "./media/types";
export * from "./media/schemas";
