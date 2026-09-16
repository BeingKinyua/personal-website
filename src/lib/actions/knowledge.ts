"use server";

/**
 * VictorOS Knowledge Server Actions
 * Safe action endpoints for engineering concepts, mental models, and knowledge graphs.
 */

import { z } from "zod";
import { createSafeAction } from "./safeAction";
import { KnowledgeService } from "../knowledge/service";
import {
  createConceptSchema,
  updateConceptSchema,
  conceptFilterSchema,
  attachContentConceptSchema,
  conceptRelationshipSchema,
} from "../knowledge/schemas";
import { ROLES } from "../auth/roles";
import { ValidationError } from "../shared/errors";

const service = new KnowledgeService();

export const listConceptsAction = createSafeAction(
  {
    schema: conceptFilterSchema,
    actionName: "knowledge:list",
  },
  async (input) => {
    return service.listConcepts(input);
  }
);

export const getConceptAction = createSafeAction(
  {
    schema: z.object({ slug: z.string().min(1) }),
    actionName: "knowledge:getBySlug",
  },
  async ({ slug }) => {
    return service.getConceptBySlug(slug);
  }
);

export const getConceptByIdAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    actionName: "knowledge:getById",
  },
  async ({ id }) => {
    return service.getConceptById(id);
  }
);

export const createConceptAction = createSafeAction(
  {
    schema: createConceptSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "knowledge:create",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.createConcept(input, profile);
  }
);

export const updateConceptAction = createSafeAction(
  {
    schema: z.object({
      id: z.string().uuid(),
      data: updateConceptSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "knowledge:update",
  },
  async ({ id, data }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.updateConcept(id, data, profile);
  }
);

export const deleteConceptAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.ADMIN,
    actionName: "knowledge:delete",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.deleteConcept(id, profile);
    return { id, deleted: true };
  }
);

// --- Content-Concept Associations ---

export const attachContentConceptAction = createSafeAction(
  {
    schema: attachContentConceptSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "knowledge:attachToContent",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachContentConcept(input, profile);
    return { success: true };
  }
);

export const detachContentConceptAction = createSafeAction(
  {
    schema: z.object({
      contentType: z.enum(["project", "article", "lab"]),
      contentId: z.string().uuid(),
      conceptId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "knowledge:detachFromContent",
  },
  async ({ contentType, contentId, conceptId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachContentConcept(contentType, contentId, conceptId, profile);
    return { success: true };
  }
);

export const getConceptsForContentAction = createSafeAction(
  {
    schema: z.object({
      contentType: z.enum(["project", "article", "lab"]),
      contentId: z.string().uuid(),
    }),
    actionName: "knowledge:getForContent",
  },
  async ({ contentType, contentId }) => {
    return service.getConceptsForContent(contentType, contentId);
  }
);

// --- Concept Relationships ---

export const linkConceptsAction = createSafeAction(
  {
    schema: conceptRelationshipSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "knowledge:linkConcepts",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.linkConcepts(input, profile);
    return { success: true };
  }
);

export const unlinkConceptsAction = createSafeAction(
  {
    schema: z.object({
      sourceConceptId: z.string().uuid(),
      targetConceptId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "knowledge:unlinkConcepts",
  },
  async ({ sourceConceptId, targetConceptId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.unlinkConcepts(sourceConceptId, targetConceptId, profile);
    return { success: true };
  }
);

export const getRelatedConceptsAction = createSafeAction(
  {
    schema: z.object({ conceptId: z.string().uuid() }),
    actionName: "knowledge:getRelated",
  },
  async ({ conceptId }) => {
    return service.getRelatedConcepts(conceptId);
  }
);
