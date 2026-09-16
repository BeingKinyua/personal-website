"use server";

/**
 * VictorOS Labs Server Actions
 * Safe action endpoints for laboratory experiments and research tracking.
 */

import { z } from "zod";
import { createSafeAction } from "./safeAction";
import { LabService } from "../labs/service";
import {
  createLabSchema,
  updateLabSchema,
  labFilterSchema,
  attachLabMediaSchema,
} from "../labs/schemas";
import { ROLES } from "../auth/roles";
import { ValidationError } from "../shared/errors";

const service = new LabService();

export const listLabsAction = createSafeAction(
  {
    schema: labFilterSchema,
    actionName: "labs:list",
  },
  async (input) => {
    return service.listLabs(input);
  }
);

export const getLabAction = createSafeAction(
  {
    schema: z.object({ slug: z.string().min(1) }),
    actionName: "labs:getBySlug",
  },
  async ({ slug }) => {
    return service.getLabBySlug(slug);
  }
);

export const getLabByIdAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    actionName: "labs:getById",
  },
  async ({ id }) => {
    return service.getLabById(id);
  }
);

export const createLabAction = createSafeAction(
  {
    schema: createLabSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "labs:create",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.createLab(input, profile);
  }
);

export const updateLabAction = createSafeAction(
  {
    schema: z.object({
      id: z.string().uuid(),
      data: updateLabSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "labs:update",
  },
  async ({ id, data }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.updateLab(id, data, profile);
  }
);

export const archiveLabAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "labs:archive",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.archiveLab(id, profile);
  }
);

export const deleteLabAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.ADMIN,
    actionName: "labs:delete",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.deleteLab(id, profile);
    return { id, deleted: true };
  }
);

export const attachLabMediaAction = createSafeAction(
  {
    schema: z.object({
      labId: z.string().uuid(),
      media: attachLabMediaSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "labs:attachMedia",
  },
  async ({ labId, media }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachMedia(labId, media, profile);
    return { success: true };
  }
);

export const detachLabMediaAction = createSafeAction(
  {
    schema: z.object({
      labId: z.string().uuid(),
      mediaAssetId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "labs:detachMedia",
  },
  async ({ labId, mediaAssetId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachMedia(labId, mediaAssetId, profile);
    return { success: true };
  }
);
