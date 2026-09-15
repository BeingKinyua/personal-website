/**
 * VictorOS Server-Side Session & Authentication Helpers
 * Resolves current user and profile, enforcing authentication and authorization boundaries.
 */

import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import type { Database } from "../supabase/types";
import { AuthenticationError, AuthorizationError } from "../shared/errors";
import { ROLES } from "./roles";

export type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"];

export interface CurrentAuthContext {
  user: User;
  profile: ProfileRecord;
}

/**
 * Retrieves the currently authenticated Supabase user, or null if unauthenticated.
 */
export async function getCurrentUser(client?: SupabaseClient<Database>): Promise<User | null> {
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
  const user = await getCurrentUser(client);
  if (!user) return null;

  const supabase = client || (await createSupabaseServerClient());
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Enforces that an active authenticated user session exists.
 * Throws an explicit AuthenticationError if unauthenticated.
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
 * Throws AuthenticationError if unauthenticated, or AuthorizationError if unauthorized.
 */
export async function requireAdmin(client?: SupabaseClient<Database>): Promise<CurrentAuthContext> {
  const user = await requireUser(client);
  const profile = await getCurrentProfile(client);

  if (!profile || profile.role !== ROLES.ADMIN) {
    throw new AuthorizationError("Administrator access required for this operation.");
  }

  return { user, profile };
}

/**
 * Enforces that an authenticated user exists and returns both user and profile context.
 */
export async function requireAuthContext(client?: SupabaseClient<Database>): Promise<CurrentAuthContext> {
  const user = await requireUser(client);
  const profile = await getCurrentProfile(client);

  if (!profile) {
    throw new AuthenticationError("User profile could not be resolved for active session.");
  }

  return { user, profile };
}
