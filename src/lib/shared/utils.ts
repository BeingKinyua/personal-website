/**
 * VictorOS Shared Backend Utilities
 * Clean, tested helpers for pagination, slug generation, ID validation, and data formatting.
 */

import { SYSTEM } from "./constants";

/**
 * Validates whether a string is a valid UUID v4 format
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Standardizes slugs for projects, articles, and concepts.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "") // remove invalid characters
    .replace(/[\s_-]+/g, "-") // collapse spaces and underscores to dashes
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(params?: PaginationParams): ParsedPagination {
  let page = Number(params?.page) || 1;
  let limit = Number(params?.limit) || SYSTEM.DEFAULT_PAGE_SIZE;

  if (page < 1) page = 1;
  if (limit < 1) limit = SYSTEM.DEFAULT_PAGE_SIZE;
  if (limit > SYSTEM.MAX_PAGE_SIZE) limit = SYSTEM.MAX_PAGE_SIZE;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/**
 * Strips HTML tags or unsafe characters from strings
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, "").trim();
}
