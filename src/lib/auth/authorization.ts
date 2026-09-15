/**
 * VictorOS Authorization Rules & Policies
 * Centralized policy definitions determining permissions based on profile and role.
 * Never use hardcoded emails or user IDs; all permissions are governed by role capabilities.
 */

import { ROLES, type Role } from "./roles";
import { AuthorizationError } from "../shared/errors";
import type { Database } from "../supabase/types";

export type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Validates if profile can view / access the future Command Center
 */
export function canAccessCommandCenter(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN || profile.role === ROLES.EDITOR;
}

/**
 * Validates if profile can create, update, or archive projects
 */
export function canManageProjects(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN || profile.role === ROLES.EDITOR;
}

/**
 * Validates if profile can create, update, or archive articles
 */
export function canManageArticles(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN || profile.role === ROLES.EDITOR;
}

/**
 * Validates if profile can create or update lab experiments
 */
export function canManageLabs(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN || profile.role === ROLES.EDITOR;
}

/**
 * Validates if profile can create or update knowledge graph concepts
 */
export function canManageKnowledge(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN || profile.role === ROLES.EDITOR;
}

/**
 * Validates if profile can upload or delete media assets in storage buckets
 */
export function canManageMedia(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN || profile.role === ROLES.EDITOR;
}

/**
 * Validates if profile can perform hard deletions of resources
 */
export function canDeleteContent(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN;
}

/**
 * Validates if profile can manage user roles and system settings
 */
export function canManageSystem(profile: ProfileRecord | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.ADMIN;
}

/* =========================================================================
   ASSERTION HELPERS (Throws AuthorizationError when check fails)
   ========================================================================= */

export function assertCanManageProjects(profile: ProfileRecord | null): asserts profile is ProfileRecord {
  if (!canManageProjects(profile)) {
    throw new AuthorizationError("You do not have permission to manage projects.");
  }
}

export function assertCanManageArticles(profile: ProfileRecord | null): asserts profile is ProfileRecord {
  if (!canManageArticles(profile)) {
    throw new AuthorizationError("You do not have permission to manage articles.");
  }
}

export function assertCanManageLabs(profile: ProfileRecord | null): asserts profile is ProfileRecord {
  if (!canManageLabs(profile)) {
    throw new AuthorizationError("You do not have permission to manage labs.");
  }
}

export function assertCanManageKnowledge(profile: ProfileRecord | null): asserts profile is ProfileRecord {
  if (!canManageKnowledge(profile)) {
    throw new AuthorizationError("You do not have permission to manage knowledge concepts.");
  }
}

export function assertCanManageMedia(profile: ProfileRecord | null): asserts profile is ProfileRecord {
  if (!canManageMedia(profile)) {
    throw new AuthorizationError("You do not have permission to manage media assets.");
  }
}

export function assertCanDelete(profile: ProfileRecord | null): asserts profile is ProfileRecord {
  if (!canDeleteContent(profile)) {
    throw new AuthorizationError("Admin privileges are strictly required to perform deletion.");
  }
}
