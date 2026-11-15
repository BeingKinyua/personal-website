/**
 * Tovu Supabase Server Client
 * Designed for server execution (Express API routes and server handlers).
 * Respects Row Level Security (RLS) policies by passing the caller's session token or cookies.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";
import { getServerEnv } from "../shared/env";
import { AppError } from "../shared/errors";
import type { Database } from "./types";
import { parseCookieHeader } from "../auth/visitorSession";

export interface CookieAdapter {
  get: (name: string) => string | undefined | Promise<string | undefined>;
  set?: (name: string, value: string, options: CookieOptions) => void | Promise<void>;
  remove?: (name: string, options: CookieOptions) => void | Promise<void>;
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || "/"}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const sameSite =
      typeof options.sameSite === "string"
        ? options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)
        : "Lax";
    parts.push(`SameSite=${sameSite}`);
  }
  return parts.join("; ");
}

export function createExpressCookieAdapter(
  req: Pick<Request, "headers">,
  res?: Pick<Response, "getHeader" | "setHeader">
): CookieAdapter {
  const parsed = parseCookieHeader(req.headers.cookie);

  const writeSetCookie = (cookieStr: string) => {
    if (!res) return;
    const existing = res.getHeader("Set-Cookie");
    if (!existing) {
      res.setHeader("Set-Cookie", [cookieStr]);
    } else if (Array.isArray(existing)) {
      res.setHeader("Set-Cookie", [...existing.map(String), cookieStr]);
    } else {
      res.setHeader("Set-Cookie", [String(existing), cookieStr]);
    }
  };

  return {
    get(name: string) {
      return parsed[name];
    },
    set(name: string, value: string, options: CookieOptions) {
      parsed[name] = value;
      writeSetCookie(serializeCookie(name, value, options));
    },
    remove(name: string, options: CookieOptions) {
      delete parsed[name];
      writeSetCookie(serializeCookie(name, "", { ...options, maxAge: 0 }));
    },
  };
}

/**
 * Creates an authenticated Supabase server client honoring RLS.
 */
export async function createSupabaseServerClient(
  cookieStore?: CookieAdapter
): Promise<SupabaseClient<Database>> {
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

  // Anonymous RLS client when neither cookies nor Bearer token are provided
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
  if (typeof window !== "undefined") {
    throw new AppError(
      "Illegal access: Supabase Server token client must only be initialized on the server.",
      "ILLEGAL_CLIENT_USAGE",
      500
    );
  }

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

/**
 * Creates a request-scoped Supabase client from Express Request headers (Bearer token or SSR cookies).
 */
export async function createSupabaseRequestClient(
  req: Pick<Request, "headers">,
  res?: Pick<Response, "getHeader" | "setHeader">
): Promise<{
  client: SupabaseClient<Database>;
  bearerToken: string | null;
  hasSupabaseAuthCookie: boolean;
}> {
  const authHeader = req.headers.authorization;
  const bearerMatch =
    typeof authHeader === "string" ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  const bearerToken = bearerMatch?.[1]?.trim() || null;

  const cookies = parseCookieHeader(req.headers.cookie);
  const hasSupabaseAuthCookie = Object.keys(cookies).some((name) =>
    name.startsWith("sb-")
  );

  if (bearerToken) {
    return {
      client: createSupabaseClientWithToken(bearerToken),
      bearerToken,
      hasSupabaseAuthCookie,
    };
  }

  const cookieAdapter = createExpressCookieAdapter(req, res);
  return {
    client: await createSupabaseServerClient(cookieAdapter),
    bearerToken: null,
    hasSupabaseAuthCookie,
  };
}
