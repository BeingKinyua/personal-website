/**
 * VictorOS Projects Domain Validation Schemas
 */

import { z } from "zod";
import { CONTENT_STATUS } from "../shared/constants";

export const projectFilterSchema = z.object({
  status: z.enum([CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.ARCHIVED]).optional(),
  category: z.string().optional(),
  technology: z.string().optional(),
  tag: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const createProjectSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(2, "Title is required").max(200),
  subtitle: z.string().max(300).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  version: z.string().max(50).optional().nullable(),
  status: z.enum([CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.ARCHIVED]).default(CONTENT_STATUS.DRAFT),
  featured: z.boolean().default(false),
  hero_image_url: z.string().url("Hero image must be a valid URL").optional().nullable(),
  github_url: z.string().url("GitHub URL must be a valid URL").optional().nullable(),
  live_url: z.string().url("Live URL must be a valid URL").optional().nullable(),
  metrics: z.record(z.string(), z.any()).optional().nullable(),
  technologies: z.array(z.string()).optional().nullable(),
  architecture_nodes: z.array(z.record(z.string(), z.any())).optional().nullable(),
  architecture_lines: z.array(z.record(z.string(), z.any())).optional().nullable(),
  order_index: z.number().int().optional().default(0),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createSectionSchema = z.object({
  title: z.string().min(1, "Section title is required").max(200),
  content: z.string().min(1, "Section content is required"),
  order_index: z.number().int().optional().default(0),
});

export const updateSectionSchema = createSectionSchema.partial();

export const reorderSectionsSchema = z.array(
  z.object({
    id: z.string().uuid("Section ID must be a valid UUID"),
    order_index: z.number().int().min(0),
  })
);

export const attachMediaSchema = z.object({
  media_asset_id: z.string().uuid("Media asset ID must be a valid UUID"),
  role: z.string().max(50).default("gallery"),
  order_index: z.number().int().optional().default(0),
});

export const attachTagSchema = z.object({
  tag_id: z.string().uuid("Tag ID must be a valid UUID"),
});

export const attachTechnologySchema = z.object({
  technology_id: z.string().uuid("Technology ID must be a valid UUID"),
});
