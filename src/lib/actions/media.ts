"use server";

/**
 * VictorOS Media Server Actions
 * Safe action endpoints for media assets and storage tracking.
 */

import { z } from "zod";
import { createSafeAction } from "./safeAction";
import { MediaService } from "../media/service";
import { uploadMediaSchema, mediaFilterSchema } from "../media/schemas";
import { ROLES } from "../auth/roles";
import { ValidationError } from "../shared/errors";

const service = new MediaService();

export const listMediaAction = createSafeAction(
  {
    schema: mediaFilterSchema,
    actionName: "media:list",
  },
  async (input) => {
    return service.listMedia(input);
  }
);

export const getMediaByIdAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    actionName: "media:getById",
  },
  async ({ id }) => {
    return service.getMediaById(id);
  }
);

export const registerMediaAction = createSafeAction(
  {
    schema: uploadMediaSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "media:register",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.registerMedia(input, profile);
  }
);

export const deleteMediaAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.ADMIN,
    actionName: "media:delete",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.deleteMedia(id, profile);
    return { id, deleted: true };
  }
);
