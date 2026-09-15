/**
 * VictorOS Articles Domain Validation Schemas
 */

import { z } from "zod";
import { CONTENT_STATUS } from "../shared/constants";

export const articleFilterSchema = z.object({
  status: z.enum([CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.ARCHIVED]).optional(),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const createArticleSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(2, "Title is required").max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10, "Article content must have at least 10 characters"),
  reading_time: z.number().int().positive().optional(),
  status: z.enum([CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.ARCHIVED]).default(CONTENT_STATUS.DRAFT),
  featured: z.boolean().default(false),
  cover_image_url: z.string().url("Cover image must be a valid URL").optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
});

export const updateArticleSchema = createArticleSchema.partial();
