/**
 * VictorOS Shared Backend Constants
 * Core constants used across authentication, domains, pagination, and system boundaries.
 */

export const SYSTEM = {
  NAME: "Tovu",
  VERSION: "3.2.0",
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const CONTENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type ContentStatus = typeof CONTENT_STATUS[keyof typeof CONTENT_STATUS];

export const PROJECT_LIFECYCLE_STATUS = {
  IDEA: "idea",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export type ProjectLifecycleStatus = typeof PROJECT_LIFECYCLE_STATUS[keyof typeof PROJECT_LIFECYCLE_STATUS];

export const LAB_STATUS = {
  EXPLORING: "exploring",
  BUILDING: "building",
  PAUSED: "paused",
  COMPLETED: "completed",
  ARCHIVED: "archived",
  // Backward-compatibility aliases
  ACTIVE: "building",
  EXPERIMENTAL: "exploring",
} as const;

export type LabStatus =
  | "exploring"
  | "building"
  | "paused"
  | "completed"
  | "archived"
  | "active"
  | "experimental";

export const MEDIA_BUCKETS = {
  PROJECTS: "project-media",
  ARTICLES: "article-media",
  LABS: "lab-media",
  AVATARS: "avatars",
  SYSTEM: "system-assets",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
