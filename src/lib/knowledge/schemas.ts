/**
 * VictorOS Knowledge Domain Validation Schemas
 */

import { z } from "zod";

export const conceptFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const createConceptSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(2).max(150),
  category: z.string().min(1),
  definition: z.string().min(10).max(2000),
  key_points: z.array(z.string()).optional().nullable(),
  related_concepts: z.array(z.string()).optional().nullable(),
  order_index: z.number().int().default(0),
});

export const updateConceptSchema = createConceptSchema.partial();

export const attachContentConceptSchema = z.object({
  content_type: z.enum(["project", "article", "lab"]),
  content_id: z.string().uuid("Content ID must be a valid UUID"),
  concept_id: z.string().uuid("Concept ID must be a valid UUID"),
});

export const conceptRelationshipSchema = z.object({
  source_concept_id: z.string().uuid("Source concept ID must be a valid UUID"),
  target_concept_id: z.string().uuid("Target concept ID must be a valid UUID"),
  relationship_type: z.string().min(2).max(50).default("relates_to"),
});
