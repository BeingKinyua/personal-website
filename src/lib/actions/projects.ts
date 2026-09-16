"use server";

/**
 * VictorOS Projects Server Actions
 * Safe action endpoints for public presentation and future Command Center management.
 */

import { z } from "zod";
import { createSafeAction } from "./safeAction";
import { ProjectService } from "../projects/service";
import {
  createProjectSchema,
  updateProjectSchema,
  projectFilterSchema,
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
  attachMediaSchema,
  attachTagSchema,
  attachTechnologySchema,
} from "../projects/schemas";
import { ROLES } from "../auth/roles";
import { ValidationError } from "../shared/errors";

const service = new ProjectService();

/**
 * List projects with pagination and filtering
 */
export const listProjectsAction = createSafeAction(
  {
    schema: projectFilterSchema,
    actionName: "projects:list",
  },
  async (input, { profile }) => {
    return service.listProjects(input, profile);
  }
);

/**
 * Get project by slug
 */
export const getProjectAction = createSafeAction(
  {
    schema: z.object({ slug: z.string().min(1) }),
    actionName: "projects:getBySlug",
  },
  async ({ slug }, { profile }) => {
    return service.getProjectBySlug(slug, profile);
  }
);

/**
 * Get project by id
 */
export const getProjectByIdAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    actionName: "projects:getById",
  },
  async ({ id }, { profile }) => {
    return service.getProjectById(id, profile);
  }
);

/**
 * Create a new project (requires editor or admin)
 */
export const createProjectAction = createSafeAction(
  {
    schema: createProjectSchema,
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:create",
  },
  async (input, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.createProject(input, profile);
  }
);

/**
 * Update project details (requires editor or admin)
 */
export const updateProjectAction = createSafeAction(
  {
    schema: z.object({
      id: z.string().uuid(),
      data: updateProjectSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:update",
  },
  async ({ id, data }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.updateProject(id, data, profile);
  }
);

/**
 * Publish project (requires editor or admin)
 */
export const publishProjectAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:publish",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.publishProject(id, profile);
  }
);

/**
 * Archive project (requires editor or admin)
 */
export const archiveProjectAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:archive",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.archiveProject(id, profile);
  }
);

/**
 * Delete project permanently (requires admin)
 */
export const deleteProjectAction = createSafeAction(
  {
    schema: z.object({ id: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.ADMIN,
    actionName: "projects:delete",
  },
  async ({ id }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.deleteProject(id, profile);
    return { id, deleted: true };
  }
);

// --- Sections Actions ---

export const getProjectSectionsAction = createSafeAction(
  {
    schema: z.object({ projectId: z.string().uuid() }),
    actionName: "projects:getSections",
  },
  async ({ projectId }) => {
    return service.getProjectSections(projectId);
  }
);

export const createProjectSectionAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      section: createSectionSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:createSection",
  },
  async ({ projectId, section }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.createProjectSection(projectId, section, profile);
  }
);

export const updateProjectSectionAction = createSafeAction(
  {
    schema: z.object({
      sectionId: z.string().uuid(),
      data: updateSectionSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:updateSection",
  },
  async ({ sectionId, data }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    return service.updateProjectSection(sectionId, data, profile);
  }
);

export const deleteProjectSectionAction = createSafeAction(
  {
    schema: z.object({ sectionId: z.string().uuid() }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:deleteSection",
  },
  async ({ sectionId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.deleteProjectSection(sectionId, profile);
    return { sectionId, deleted: true };
  }
);

export const reorderProjectSectionsAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      orders: reorderSectionsSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:reorderSections",
  },
  async ({ projectId, orders }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.reorderProjectSections(projectId, orders, profile);
    return { success: true };
  }
);

// --- Relations Actions ---

export const attachProjectTagAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      tagId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:attachTag",
  },
  async ({ projectId, tagId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachTag(projectId, tagId, profile);
    return { success: true };
  }
);

export const detachProjectTagAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      tagId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:detachTag",
  },
  async ({ projectId, tagId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachTag(projectId, tagId, profile);
    return { success: true };
  }
);

export const attachProjectTechnologyAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      technologyId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:attachTechnology",
  },
  async ({ projectId, technologyId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachTechnology(projectId, technologyId, profile);
    return { success: true };
  }
);

export const detachProjectTechnologyAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      technologyId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:detachTechnology",
  },
  async ({ projectId, technologyId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachTechnology(projectId, technologyId, profile);
    return { success: true };
  }
);

export const attachProjectMediaAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      media: attachMediaSchema,
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:attachMedia",
  },
  async ({ projectId, media }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.attachMedia(projectId, media, profile);
    return { success: true };
  }
);

export const detachProjectMediaAction = createSafeAction(
  {
    schema: z.object({
      projectId: z.string().uuid(),
      mediaAssetId: z.string().uuid(),
    }),
    requireAuth: true,
    requireRole: ROLES.EDITOR,
    actionName: "projects:detachMedia",
  },
  async ({ projectId, mediaAssetId }, { profile }) => {
    if (!profile) throw new ValidationError("Profile required.");
    await service.detachMedia(projectId, mediaAssetId, profile);
    return { success: true };
  }
);
