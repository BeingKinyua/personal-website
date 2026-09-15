/**
 * VictorOS Role Definitions & Hierarchy
 * Centralized typing and utilities for user roles.
 */

import { ROLES, type RoleType } from "../shared/constants";

export { ROLES };
export type Role = RoleType;

/**
 * Numeric role hierarchy weights.
 * Higher weight encompasses permissions of lower weights.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.VIEWER]: 10,
  [ROLES.EDITOR]: 20,
  [ROLES.ADMIN]: 30,
};

/**
 * Type guard for validating role values.
 */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && Object.values(ROLES).includes(value as Role);
}

/**
 * Validates if a user's role meets or exceeds the required role in hierarchy.
 */
export function hasRole(userRole: Role | undefined | null, requiredRole: Role): boolean {
  if (!userRole || !ROLE_HIERARCHY[userRole]) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Validates if a user's role matches any in an allowed set.
 */
export function hasAnyRole(userRole: Role | undefined | null, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
