/**
 * VictorOS Intelligence Layer — Dr. Doom Response Contracts & Zod Validation
 */

import { z } from "zod";

export const DoomActionTypeSchema = z.enum([
  "open_project",
  "open_article",
  "open_lab",
  "open_concept",
  "navigate",
  "search",
]);

export type DoomActionType = z.infer<typeof DoomActionTypeSchema>;

export const DoomActionSchema = z.object({
  label: z.string().min(1),
  action: DoomActionTypeSchema,
  target: z.string().optional(),
});

export type DoomAction = z.infer<typeof DoomActionSchema>;

export const DoomReferenceTypeSchema = z.enum([
  "project",
  "article",
  "lab",
  "concept",
  "knowledge",
  "experiment",
]);

export type DoomReferenceType = z.infer<typeof DoomReferenceTypeSchema>;

export const DoomReferenceSchema = z.object({
  type: DoomReferenceTypeSchema,
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  badge: z.string().optional(),
});

export type DoomReference = z.infer<typeof DoomReferenceSchema>;

export const DoomResponseSchema = z.object({
  message: z.string().min(1),
  references: z.array(DoomReferenceSchema).default([]),
  actions: z.array(DoomActionSchema).default([]),
  intent: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type DoomResponse = z.infer<typeof DoomResponseSchema>;

/**
 * Validates and safely normalizes any output into a compliant DoomResponse object.
 */
export function sanitizeDoomResponse(data: unknown): DoomResponse {
  const result = DoomResponseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Safe fallback if model output failed schema validation
  const rawObj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const message =
    typeof rawObj.message === "string" && rawObj.message.trim().length > 0
      ? rawObj.message
      : "DR. DOOM online. I have analyzed your system inquiry.";

  return {
    message,
    references: [],
    actions: [{ label: "Examine Work", action: "navigate", target: "work" }],
    intent: "fallback",
    confidence: 0.5,
  };
}
