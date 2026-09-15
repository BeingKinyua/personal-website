/**
 * VictorOS Supabase Browser Client
 * Intended for client-side execution within browser components.
 * Employs the public anonymous key and respects Row Level Security (RLS).
 */

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "../shared/env";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Retrieves the singleton Supabase browser client.
 * Safe for use in browser/client components.
 */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
