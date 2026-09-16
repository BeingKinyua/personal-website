/**
 * VictorOS Labs Domain Validation Schemas
 */

import { z } from "zod";
import { LAB_STATUS } from "../shared/constants";

export const labStatusEnum = z.enum([
  "exploring",
  "building",
  "paused",
  "completed",
  "archived",
  "active",
  "experimental",
]);

export const labFilterSchema = z.object({
  status: labStatusEnum.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const createLabSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(2).max(150),
  description: z.string().min(5).max(500),
  category: z.string().min(1),
  status: labStatusEnum.default("building"),
  stars: z.number().int().nonnegative().default(0),
  live_url: z.string().url().optional().nullable(),
  github_url: z.string().url().optional().nullable(),
  order_index: z.number().int().default(0),
});

export const updateLabSchema = createLabSchema.partial();

export const attachLabMediaSchema = z.object({
  media_asset_id: z.string().uuid("Media asset ID must be a valid UUID"),
  role: z.string().max(50).default("preview"),
  order_index: z.number().int().optional().default(0),
});
