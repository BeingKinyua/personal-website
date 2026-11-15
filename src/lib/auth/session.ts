/**
 * Tovu Server-Side Session & Authentication Helpers
 * Resolves request-scoped Supabase RLS client, current user, and profile,
 * enforcing authentication and authorization boundaries.
 */

import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";
import { createSupabaseServerClient, createSupabaseRequestClient } from "../supabase/server";
import type { Database } from "../supabase/types";
import { AuthenticationError, AuthorizationError } from "../shared/errors";
import { isSupabaseConfigured } from "../shared/env";
import { ROLES } from "./roles";

export type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"];

export interface CurrentAuthContext {
  user: User;
  profile: ProfileRecord;
}

export interface RequestAuthContext {
  client: SupabaseClient<Database> | null;
  user: User | null;
  profile: ProfileRecord | null;
}

export interface RequiredRequestAuthContext {
  client: SupabaseClient<Database>;
  user: User;
  profile: ProfileRecord;
}

/**
 * Resolves the authenticated Supabase user and profile from an incoming Express request
 * using Authorization Bearer JWT or SSR auth cookies, plus a request-scoped RLS client.
 */
export async function resolveRequestAuthContext(
  req: Pick<Request, "headers">,
  res?: Pick<Response, "getHeader" | "setHeader">
): Promise<RequestAuthContext> {
  if (!isSupabaseConfigured(false)) {
    return { client: null, user: null, profile: null };
  }

  const { client, bearerToken, hasSupabaseAuthCookie } =
    await createSupabaseRequestClient(req, res);

  // Fast path: anonymous visitors with no Bearer header and no Supabase cookie
  if (!bearerToken && !hasSupabaseAuthCookie) {
    return { client, user: null, profile: null };
  }

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return { client, user: null, profile: null };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { client, user, profile: null };
  }

  return { client, user, profile };
}

/**
 * Enforces an authenticated user and resolved profile on an Express request.
 */
export async function requireRequestAuthContext(
  req: Pick<Request, "headers">,
  res?: Pick<Response, "getHeader" | "setHeader">
): Promise<RequiredRequestAuthContext> {
  if (!isSupabaseConfigured(false)) {
    throw new AuthenticationError("Authentication service is unavailable: Supabase is not configured.");
  }

  const ctx = await resolveRequestAuthContext(req, res);
  if (!ctx.client || !ctx.user) {
    throw new AuthenticationError("Authentication required. Please sign in to proceed.");
  }
  if (!ctx.profile) {
    throw new AuthenticationError("User profile could not be resolved for active session.");
  }

  return {
    client: ctx.client,
    user: ctx.user,
    profile: ctx.profile,
  };
}

/**
 * Retrieves the currently authenticated Supabase user from an explicit client, or null if unauthenticated.
 */
export async function getCurrentUser(client?: SupabaseClient<Database>): Promise<User | null> {
  if (!client && !isSupabaseConfigured(false)) return null;
  const supabase = client || (await createSupabaseServerClient());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Resolves the authenticated user's profile and assigned role from the profiles table.
 */
export async function getCurrentProfile(client?: SupabaseClient<Database>): Promise<ProfileRecord | null> {
  if (!client && !isSupabaseConfigured(false)) return null;
  const supabase = client || (await createSupabaseServerClient());
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Enforces that an active authenticated user session exists.
 */
export async function requireUser(client?: SupabaseClient<Database>): Promise<User> {
  const user = await getCurrentUser(client);
  if (!user) {
    throw new AuthenticationError("Authentication required. Please sign in to proceed.");
  }
  return user;
}

/**
 * Enforces that an authenticated user exists AND holds the 'admin' role.
 */
export async function requireAdmin(client?: SupabaseClient<Database>): Promise<CurrentAuthContext> {
  const supabase = client || (await createSupabaseServerClient());
  const user = await requireUser(supabase);
  const profile = await getCurrentProfile(supabase);

  if (!profile || profile.role !== ROLES.ADMIN) {
    throw new AuthorizationError("Administrator access required for this operation.");
  }

  return { user, profile };
}

/**
 * Enforces that an authenticated user exists and returns both user and profile context.
 */
export async function requireAuthContext(client?: SupabaseClient<Database>): Promise<CurrentAuthContext> {
  const supabase = client || (await createSupabaseServerClient());
  const user = await requireUser(supabase);
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    throw new AuthenticationError("User profile could not be resolved for active session.");
  }

  return { user, profile };
}
