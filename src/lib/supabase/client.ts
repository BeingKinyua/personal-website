/**
 * Tovu Supabase Browser Client
 * Intended for client-side execution within browser components.
 * Employs only the public anonymous key and respects Row Level Security (RLS).
 */

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv, isSupabaseConfigured } from "../shared/env";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Retrieves the singleton Supabase browser client, or null if Supabase is not configured.
 * Safe for use in browser/client components.
 */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  if (!isSupabaseConfigured(false)) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
