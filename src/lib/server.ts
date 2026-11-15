/**
 * Tovu Server-Only Backend Exports
 * Never import this file from browser/client React components.
 */

// Re-export shared & schemas
export * from "./index";
export * from "./shared/logger";
export * from "./shared/api";
export { getServerEnv, assertSupabaseConfigured } from "./shared/env";

// Server & Admin Supabase Clients
export * from "./supabase/server";
export * from "./supabase/admin";

// Auth & Authorization
export * from "./auth/authorization";
export * from "./auth/visitorSession";
export {
  resolveRequestAuthContext,
  requireRequestAuthContext,
  getCurrentUser,
  getCurrentProfile,
  requireUser,
  requireAdmin,
  requireAuthContext,
  type CurrentAuthContext,
  type RequestAuthContext,
  type RequiredRequestAuthContext,
} from "./auth/session";

// Repositories & Domain Services
export * from "./projects/repository";
export * from "./projects/service";
export * from "./articles/repository";
export * from "./articles/service";
export * from "./labs/repository";
export * from "./labs/service";
export * from "./knowledge/repository";
export * from "./knowledge/service";
export * from "./media/repository";
export * from "./media/service";

// Actions
export * from "./actions/safeAction";
