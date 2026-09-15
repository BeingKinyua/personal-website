/**
 * VictorOS Backend Foundation Exports
 */

// Shared
export * from "./shared/constants";
export * from "./shared/errors";
export * from "./shared/logger";
export * from "./shared/utils";
export * from "./shared/env";
export * from "./shared/api";

// Supabase
export type { Database, Json } from "./supabase/types";
export * from "./supabase/client";
export * from "./supabase/server";
export * from "./supabase/admin";

// Auth & Authorization
export * from "./auth/roles";
export * from "./auth/authorization";
export {
  getCurrentUser,
  getCurrentProfile,
  requireUser,
  requireAdmin,
  requireAuthContext,
  type CurrentAuthContext,
} from "./auth/session";

// Domain Services & Repositories
export * from "./projects/types";
export * from "./projects/schemas";
export * from "./projects/repository";
export * from "./projects/service";

export * from "./articles/types";
export * from "./articles/schemas";
export * from "./articles/repository";
export * from "./articles/service";

export * from "./labs/types";
export * from "./labs/schemas";
export * from "./labs/repository";
export * from "./labs/service";

export * from "./knowledge/types";
export * from "./knowledge/schemas";
export * from "./knowledge/repository";
export * from "./knowledge/service";

export * from "./media/types";
export * from "./media/schemas";
export * from "./media/repository";
export * from "./media/service";

// Actions
export * from "./actions/safeAction";
