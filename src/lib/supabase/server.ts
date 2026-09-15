/**
 * VictorOS Supabase Server Client
 * Designed for server execution (Server Components, Route Handlers, Server Actions, and Express API routes).
 * Respects Row Level Security (RLS) policies by passing the caller's session token or cookies.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "../shared/env";
import { AppError } from "../shared/errors";
import type { Database } from "./types";

export interface CookieAdapter {
  get: (name: string) => string | undefined | Promise<string | undefined>;
  set?: (name: string, value: string, options: CookieOptions) => void | Promise<void>;
  remove?: (name: string, options: CookieOptions) => void | Promise<void>;
}

/**
 * Creates an authenticated Supabase server client honoring RLS.
 * Compatible with Next.js App Router (cookies()) and standard server environments.
 */
export async function createSupabaseServerClient(cookieStore?: CookieAdapter): Promise<SupabaseClient<Database>> {
  if (typeof window !== "undefined") {
    throw new AppError(
      "Illegal access: Supabase Server client must only be initialized on the server.",
      "ILLEGAL_CLIENT_USAGE",
      500
    );
  }

  const { supabaseUrl, supabaseAnonKey } = getServerEnv();

  if (cookieStore) {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        async get(name: string) {
          return await cookieStore.get(name);
        },
        async set(name: string, value: string, options: CookieOptions) {
          if (cookieStore.set) {
            await cookieStore.set(name, value, options);
          }
        },
        async remove(name: string, options: CookieOptions) {
          if (cookieStore.remove) {
            await cookieStore.remove(name, options);
          }
        },
      },
    });
  }

  // Fallback for standard server-side operations where request cookies are not bound
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates a server client with an explicit user Bearer access token.
 * Passes the caller's JWT directly to Supabase so RLS identifies auth.uid().
 */
export function createSupabaseClientWithToken(accessToken: string): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getServerEnv();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
