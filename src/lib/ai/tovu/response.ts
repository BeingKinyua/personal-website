/**
 * Tovu Intelligence Layer — Response Contracts & Zod Validation
 */

import { z } from "zod";

export const TovuActionTypeSchema = z.enum([
  "open_project",
  "open_article",
  "open_lab",
  "open_concept",
  "navigate",
  "search",
]);

export type TovuActionType = z.infer<typeof TovuActionTypeSchema>;

export const TovuActionSchema = z.object({
  label: z.string().min(1),
  action: TovuActionTypeSchema,
  target: z.string().optional(),
});

export type TovuAction = z.infer<typeof TovuActionSchema>;

export const TovuReferenceTypeSchema = z.enum([
  "project",
  "article",
  "lab",
  "concept",
  "knowledge",
  "experiment",
]);

export type TovuReferenceType = z.infer<typeof TovuReferenceTypeSchema>;

export const TovuReferenceSchema = z.object({
  type: TovuReferenceTypeSchema,
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  badge: z.string().optional(),
});

export type TovuReference = z.infer<typeof TovuReferenceSchema>;

export const TovuResponseSchema = z.object({
  message: z.string().min(1),
  references: z.array(TovuReferenceSchema).default([]),
  actions: z.array(TovuActionSchema).default([]),
  intent: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type TovuResponse = z.infer<typeof TovuResponseSchema>;

/**
 * Validates and safely normalizes any output into a compliant TovuResponse object.
 */
export function sanitizeTovuResponse(data: unknown): TovuResponse {
  const result = TovuResponseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Safe fallback if model output failed schema validation
  const rawObj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const message =
    typeof rawObj.message === "string" && rawObj.message.trim().length > 0
      ? rawObj.message
      : "Tovu online. I have analyzed your system inquiry.";

  return {
    message,
    references: [],
    actions: [{ label: "Examine Work", action: "navigate", target: "work" }],
    intent: "fallback",
    confidence: 0.5,
  };
}

// Backwards-compatible aliases for legacy imports
export const DoomActionTypeSchema = TovuActionTypeSchema;
export type DoomActionType = TovuActionType;
export const DoomActionSchema = TovuActionSchema;
export type DoomAction = TovuAction;
export const DoomReferenceTypeSchema = TovuReferenceTypeSchema;
export type DoomReferenceType = TovuReferenceType;
export const DoomReferenceSchema = TovuReferenceSchema;
export type DoomReference = TovuReference;
export const DoomResponseSchema = TovuResponseSchema;
export type DoomResponse = TovuResponse;
export const sanitizeDoomResponse = sanitizeTovuResponse;
