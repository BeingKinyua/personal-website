/**
 * VictorOS Supabase Admin Client (Service Role)
 *
 * ⚠️ STRICT SECURITY NOTICE:
 * This client utilizes the SUPABASE_SERVICE_ROLE_KEY which completely BYPASSES
 * Row Level Security (RLS) policies in PostgreSQL.
 *
 * It must:
 * 1. NEVER be imported or referenced by Client Components or browser code.
 * 2. NEVER be exposed through public environment variables (NEXT_PUBLIC_*).
 * 3. NEVER be used for normal user requests where user RLS should apply.
 *
 * Appropriate Use Cases:
 * - Machine-to-machine integrations (e.g. background GitHub repository syncing).
 * - System bootstrap and database seeding scripts.
 * - Profile provisioning after initial OAuth/Auth trigger callbacks.
 * - Internal maintenance tasks and administrative role promotions.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv, assertSupabaseConfigured } from "../shared/env";
import { AppError } from "../shared/errors";
import type { Database } from "./types";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Retrieves the singleton Supabase Service-Role Admin Client.
 * Guaranteed to run strictly on the server.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  // 1. Runtime guard: hard-reject if called inside a browser environment
  if (typeof window !== "undefined") {
    throw new AppError(
      "SECURITY VIOLATION: Attempted to initialize Supabase Admin Client in a browser runtime.",
      "SECURITY_VIOLATION_CLIENT_ADMIN",
      500
    );
  }

  if (adminClient) return adminClient;

  // 2. Validate environment configuration
  assertSupabaseConfigured(true);
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

export { getSupabaseAdminClient as createSupabaseAdminClient };
