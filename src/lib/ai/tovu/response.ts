/**
 * Tovu Intelligence Layer — Response Contracts, Grounding, and Zod Validation
 */

import { z } from "zod";
import type { EvidenceItem } from "./retrieval";

export const VALID_NAV_TARGETS = new Set([
  "home",
  "work",
  "journal",
  "lab",
  "knowledge",
  "about",
  "contact",
]);

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
  conversationId: z.string().optional(),
  fallbackUsed: z.boolean().optional(),
  persistenceStatus: z.enum(["persisted", "ephemeral", "failed"]).optional(),
});

export type TovuResponse = z.infer<typeof TovuResponseSchema>;

function normalizeEvidenceType(type: string): "project" | "article" | "lab" | "concept" {
  if (type === "experiment") return "lab";
  if (type === "knowledge") return "concept";
  if (type === "project" || type === "article" || type === "lab" || type === "concept") {
    return type;
  }
  return "project";
}

/**
 * Filters and validates references and UI actions strictly against retrieved evidence
 * and canonical section IDs so the LLM cannot hallucinate non-existent slugs or routes.
 */
export function groundTovuResponse(
  response: TovuResponse,
  evidence: EvidenceItem[],
  suggestedAction?: { label: string; action: string; target?: string }
): TovuResponse {
  const evidenceByKey = new Map<string, EvidenceItem>();
  for (const item of evidence) {
    evidenceByKey.set(`${item.sourceType}:${item.slug.toLowerCase()}`, item);
    evidenceByKey.set(`${item.sourceType}:${item.sourceId.toLowerCase()}`, item);
  }

  const seenRefs = new Set<string>();
  const groundedReferences: TovuReference[] = [];

  for (const ref of response.references || []) {
    const normalizedType = normalizeEvidenceType(ref.type);
    const slugKey = (ref.slug || ref.id || "").toLowerCase();
    const idKey = (ref.id || ref.slug || "").toLowerCase();
    const matched =
      evidenceByKey.get(`${normalizedType}:${slugKey}`) ||
      evidenceByKey.get(`${normalizedType}:${idKey}`);

    if (!matched) continue;

    const dedupeKey = `${matched.sourceType}:${matched.slug}`;
    if (seenRefs.has(dedupeKey)) continue;
    seenRefs.add(dedupeKey);

    groundedReferences.push({
      type: matched.sourceType,
      id: matched.sourceId,
      title: matched.title,
      slug: matched.slug,
      badge: ref.badge || matched.sourceType.toUpperCase(),
    });
  }

  const seenActions = new Set<string>();
  const groundedActions: TovuAction[] = [];

  const candidateActions: Array<{ label: string; action: string; target?: string }> = [
    ...(response.actions || []),
    ...(suggestedAction ? [suggestedAction] : []),
  ];

  for (const act of candidateActions) {
    const parsedAction = TovuActionSchema.safeParse(act);
    if (!parsedAction.success) continue;
    const validAct = parsedAction.data;
    const target = (validAct.target || "").trim();

    if (validAct.action === "navigate") {
      if (!VALID_NAV_TARGETS.has(target)) continue;
    } else if (validAct.action === "open_project") {
      const matched =
        evidenceByKey.get(`project:${target.toLowerCase()}`);
      if (!matched) continue;
      validAct.target = matched.slug;
    } else if (validAct.action === "open_article") {
      const matched =
        evidenceByKey.get(`article:${target.toLowerCase()}`);
      if (!matched) continue;
      validAct.target = matched.slug;
    } else if (validAct.action === "open_lab") {
      const matched =
        evidenceByKey.get(`lab:${target.toLowerCase()}`);
      if (!matched) continue;
      validAct.target = matched.slug;
    } else if (validAct.action === "open_concept") {
      const matched =
        evidenceByKey.get(`concept:${target.toLowerCase()}`);
      if (!matched) continue;
      validAct.target = matched.slug;
    } else if (validAct.action === "search") {
      if (!target) continue;
    }

    const actionKey = `${validAct.action}:${validAct.target || ""}`;
    if (seenActions.has(actionKey)) continue;
    seenActions.add(actionKey);
    groundedActions.push(validAct);
  }

  if (groundedActions.length === 0) {
    if (suggestedAction) {
      const parsedSuggested = TovuActionSchema.safeParse(suggestedAction);
      if (parsedSuggested.success && VALID_NAV_TARGETS.has(parsedSuggested.data.target || "")) {
        groundedActions.push(parsedSuggested.data);
      }
    }
    if (groundedActions.length === 0) {
      groundedActions.push({ label: "Examine Work", action: "navigate", target: "work" });
    }
  }

  return {
    ...response,
    references: groundedReferences,
    actions: groundedActions.slice(0, 4),
  };
}

/**
 * Validates and safely normalizes any output into a compliant TovuResponse object.
 */
export function sanitizeTovuResponse(data: unknown): TovuResponse {
  const result = TovuResponseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

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
    fallbackUsed: true,
  };
}
