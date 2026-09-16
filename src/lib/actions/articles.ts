"use server";

/**
 * VictorOS Articles Server Actions
 * Safe action endpoints for public articles and future Command Center publication workflows.
 */

import { z } from "zod";
import { createSafeAction } from "./safeAction";
import { ArticleService } from "../articles/service";
import {
  createArticleSchema,
  updateArticleSchema,
  articleFilterSchema,
} from "../articles/schemas";
import { ROLES } from "../auth/roles";
import { ValidationError } from "../shared/errors";

const service = new ArticleService();

/**
 * List articles with pagination and filtering
 */
export const listArticlesAction = createSafeAction(
  {
    schema: articleFilterSchema,
    actionName: "articles:list",
  },
  async (input, { profile }) => {
    return service.listArticles(input, profile);
  }
);

/**
 * Get article by slug
 */
export const getArticleAction = createSafeAction(
  {
    schema: z.object({ slug: z.string().min(1) }),
    actionName: "articles:getBySlug",
  },
  async ({ slug }, { profile }) => {
    return service.getArticleBySlug(slug, profile);
  }
);

/**
 * Get article by id
 */
export const getArticleByIdAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    actionName: "articles:getById",
  },
  async ({ id }, { profile }) => {
    return service.getArticleById(id, profile);
  }
);

/**
 * Create article (requires editor or admin)
 */
export const createArticleAction = createSafeAction(
  {
    schema: createArticleSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:create",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.createArticle(input, profile);
  }
);

/**
 * Update article (requires editor or admin)
 */
export const updateArticleAction = createSafeAction(
  {
    schema: z.object({
      id: z.string().uuid(),
      data: updateArticleSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:update",
  },
  async ({ id, data }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.updateArticle(id, data, profile);
  }
);

/**
 * Publish article (requires editor or admin)
 */
export const publishArticleAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:publish",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.publishArticle(id, profile);
  }
);

/**
 * Archive article (requires editor or admin)
 */
export const archiveArticleAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:archive",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.archiveArticle(id, profile);
  }
);

/**
 * Delete article permanently (requires admin)
 */
export const deleteArticleAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.ADMIN,
    actionName: "articles:delete",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.deleteArticle(id, profile);
    return { id, deleted: true };
  }
);

// --- Relations Actions ---

export const attachArticleTagAction = createSafeAction(
  {
    schema: z.object({
      articleId: z.string().uuid(),
      tagId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:attachTag",
  },
  async ({ articleId, tagId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachTag(articleId, tagId, profile);
    return { success: true };
  }
);

export const detachArticleTagAction = createSafeAction(
  {
    schema: z.object({
      articleId: z.string().uuid(),
      tagId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:detachTag",
  },
  async ({ articleId, tagId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachTag(articleId, tagId, profile);
    return { success: true };
  }
);

export const attachArticleTechnologyAction = createSafeAction(
  {
    schema: z.object({
      articleId: z.string().uuid(),
      technologyId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:attachTechnology",
  },
  async ({ articleId, technologyId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachTechnology(articleId, technologyId, profile);
    return { success: true };
  }
);

export const detachArticleTechnologyAction = createSafeAction(
  {
    schema: z.object({
      articleId: z.string().uuid(),
      technologyId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:detachTechnology",
  },
  async ({ articleId, technologyId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachTechnology(articleId, technologyId, profile);
    return { success: true };
  }
);

export const attachArticleMediaAction = createSafeAction(
  {
    schema: z.object({
      articleId: z.string().uuid(),
      mediaAssetId: z.string().uuid(),
      role: z.string().optional().default("header"),
      orderIndex: z.number().int().optional().default(0),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:attachMedia",
  },
  async ({ articleId, mediaAssetId, role, orderIndex }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachMedia(articleId, mediaAssetId, role, orderIndex, profile);
    return { success: true };
  }
);

export const detachArticleMediaAction = createSafeAction(
  {
    schema: z.object({
      articleId: z.string().uuid(),
      mediaAssetId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "articles:detachMedia",
  },
  async ({ articleId, mediaAssetId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachMedia(articleId, mediaAssetId, profile);
    return { success: true };
  }
);
