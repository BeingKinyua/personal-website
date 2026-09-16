/**
 * VictorOS Projects Domain Service
 * Encapsulates business logic, input validation, authorization checks, and data transformation.
 */

import { ProjectRepository } from "./repository";
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
} from "./schemas";
import { assertCanManageProjects, assertCanDelete, canAccessCommandCenter } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { CONTENT_STATUS } from "../shared/constants";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import { revalidateContent, CACHE_TAGS } from "../shared/revalidate";
import { logger } from "../shared/logger";
import type {
  Project,
  ProjectFilter,
  CreateProjectInput,
  UpdateProjectInput,
  SectionRow,
  ReorderSectionItem,
} from "./types";

export class ProjectService {
  private repository: ProjectRepository;

  constructor(repository?: ProjectRepository) {
    this.repository = repository || new ProjectRepository();
  }

  /**
   * Retrieves paginated projects list.
   * Non-admin/editor users only see published projects.
   */
  async listProjects(
    rawFilter: unknown = {},
    profile: ProfileRecord | null = null
  ) {
    const parseResult = projectFilterSchema.safeParse(rawFilter);
    if (!parseResult.success) {
      throw new ValidationError("Invalid project filter parameters", {
        errors: parseResult.error.format(),
      });
    }

    const filter: ProjectFilter = { ...parseResult.data };

    // Enforce publication visibility boundary
    if (!canAccessCommandCenter(profile)) {
      filter.status = CONTENT_STATUS.PUBLISHED;
    }

    const { page, limit } = parsePagination({ page: filter.page, limit: filter.limit });
    const { data, total } = await this.repository.findMany(filter);

    return {
      projects: data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Public helper to retrieve published projects directly.
   */
  async getPublishedProjects(filter: ProjectFilter = {}) {
    return this.listProjects({ ...filter, status: CONTENT_STATUS.PUBLISHED }, null);
  }

  /**
   * Retrieves single project by ID with ordered sections.
   */
  async getProjectById(id: string, profile: ProfileRecord | null = null): Promise<Project> {
    if (!id) {
      throw new ValidationError("Project ID is required.");
    }

    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundError("Project", id);
    }

    if (project.status !== CONTENT_STATUS.PUBLISHED && !canAccessCommandCenter(profile)) {
      throw new NotFoundError("Project", id);
    }

    const sections = await this.repository.findSections(project.id);
    return { ...project, sections };
  }

  /**
   * Retrieves single project by unique slug along with ordered sections.
   */
  async getProjectBySlug(slug: string, profile: ProfileRecord | null = null): Promise<Project> {
    if (!slug) {
      throw new ValidationError("Project slug is required.");
    }

    const project = await this.repository.findBySlug(slug);
    if (!project) {
      throw new NotFoundError("Project", slug);
    }

    // Protect draft/archived projects from public viewing
    if (project.status !== CONTENT_STATUS.PUBLISHED && !canAccessCommandCenter(profile)) {
      throw new NotFoundError("Project", slug);
    }

    const sections = await this.repository.findSections(project.id);

    return {
      ...project,
      sections,
    };
  }

  /**
   * Public helper for published project by slug.
   */
  async getPublishedProjectBySlug(slug: string): Promise<Project> {
    return this.getProjectBySlug(slug, null);
  }

  /**
   * Creates a new project. Enforces authorization and slug uniqueness.
   */
  async createProject(rawInput: unknown, profile: ProfileRecord): Promise<Project> {
    assertCanManageProjects(profile);

    const parseResult = createProjectSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid project input", {
        errors: parseResult.error.format(),
      });
    }

    const input: CreateProjectInput = parseResult.data as unknown as CreateProjectInput;

    // Check slug uniqueness
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Project with slug '${input.slug}' already exists.`);
    }

    const created = await this.repository.create(input);

    logger.info("audit:project_created", {
      projectId: created.id,
      slug: created.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.PROJECTS, CACHE_TAGS.PROJECT(created.slug)],
      paths: ["/projects", `/projects/${created.slug}`],
    });

    return created;
  }

  /**
   * Updates an existing project. Enforces authorization and slug uniqueness if changed.
   */
  async updateProject(id: string, rawInput: unknown, profile: ProfileRecord): Promise<Project> {
    assertCanManageProjects(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    const parseResult = updateProjectSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid project update payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: UpdateProjectInput = parseResult.data as unknown as UpdateProjectInput;

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.repository.findBySlug(input.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError(`Project with slug '${input.slug}' already exists.`);
      }
    }

    const updated = await this.repository.update(id, input);

    logger.info("audit:project_updated", {
      projectId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [
        CACHE_TAGS.PROJECTS,
        CACHE_TAGS.PROJECT(existing.slug),
        CACHE_TAGS.PROJECT(updated.slug),
      ],
      paths: ["/projects", `/projects/${existing.slug}`, `/projects/${updated.slug}`],
    });

    return updated;
  }

  /**
   * Explicit publishing transition for a project.
   */
  async publishProject(id: string, profile: ProfileRecord): Promise<Project> {
    assertCanManageProjects(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    // Domain validation: Ensure content readiness before publishing
    if (!existing.title || !existing.slug || !existing.category) {
      throw new ValidationError("Cannot publish project: title, slug, and category are required.");
    }

    const updated = await this.repository.update(id, {
      status: CONTENT_STATUS.PUBLISHED,
    });

    logger.info("audit:project_published", {
      projectId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.PROJECTS, CACHE_TAGS.PROJECT(updated.slug)],
      paths: ["/projects", `/projects/${updated.slug}`],
    });

    return updated;
  }

  /**
   * Transitions project to archived status.
   */
  async archiveProject(id: string, profile: ProfileRecord): Promise<Project> {
    assertCanManageProjects(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    const updated = await this.repository.update(id, {
      status: CONTENT_STATUS.ARCHIVED,
    });

    logger.info("audit:project_archived", {
      projectId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.PROJECTS, CACHE_TAGS.PROJECT(updated.slug)],
      paths: ["/projects", `/projects/${updated.slug}`],
    });

    return updated;
  }

  /**
   * Permanently deletes a project. Strictly requires Admin role.
   */
  async deleteProject(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    await this.repository.delete(id);

    logger.info("audit:project_deleted", {
      projectId: id,
      slug: existing.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.PROJECTS, CACHE_TAGS.PROJECT(existing.slug)],
      paths: ["/projects", `/projects/${existing.slug}`],
    });
  }

  // --- Project Sections Management ---

  async getProjectSections(projectId: string): Promise<SectionRow[]> {
    if (!projectId) {
      throw new ValidationError("Project ID is required.");
    }
    return this.repository.findSections(projectId);
  }

  async createProjectSection(
    projectId: string,
    rawInput: unknown,
    profile: ProfileRecord
  ): Promise<SectionRow> {
    assertCanManageProjects(profile);

    const project = await this.repository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    const parseResult = createSectionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid project section input", {
        errors: parseResult.error.format(),
      });
    }

    const section = await this.repository.createSection(projectId, parseResult.data);

    await revalidateContent({
      tags: [CACHE_TAGS.PROJECT(project.slug)],
      paths: [`/projects/${project.slug}`],
    });

    return section;
  }

  async updateProjectSection(
    sectionId: string,
    rawInput: unknown,
    profile: ProfileRecord
  ): Promise<SectionRow> {
    assertCanManageProjects(profile);

    const section = await this.repository.findSectionById(sectionId);
    if (!section) {
      throw new NotFoundError("Project section", sectionId);
    }

    const parseResult = updateSectionSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid project section update", {
        errors: parseResult.error.format(),
      });
    }

    const updated = await this.repository.updateSection(sectionId, parseResult.data);
    const project = await this.repository.findById(section.project_id);

    if (project) {
      await revalidateContent({
        tags: [CACHE_TAGS.PROJECT(project.slug)],
        paths: [`/projects/${project.slug}`],
      });
    }

    return updated;
  }

  async deleteProjectSection(sectionId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);

    const section = await this.repository.findSectionById(sectionId);
    if (!section) {
      throw new NotFoundError("Project section", sectionId);
    }

    await this.repository.deleteSection(sectionId);
    const project = await this.repository.findById(section.project_id);

    if (project) {
      await revalidateContent({
        tags: [CACHE_TAGS.PROJECT(project.slug)],
        paths: [`/projects/${project.slug}`],
      });
    }
  }

  async reorderProjectSections(
    projectId: string,
    rawOrders: unknown,
    profile: ProfileRecord
  ): Promise<void> {
    assertCanManageProjects(profile);

    const project = await this.repository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    const parseResult = reorderSectionsSchema.safeParse(rawOrders);
    if (!parseResult.success) {
      throw new ValidationError("Invalid section reorder input", {
        errors: parseResult.error.format(),
      });
    }

    await this.repository.reorderSections(projectId, parseResult.data as ReorderSectionItem[]);

    await revalidateContent({
      tags: [CACHE_TAGS.PROJECT(project.slug)],
      paths: [`/projects/${project.slug}`],
    });
  }

  // --- Project Relations Management ---

  async attachTag(projectId: string, tagId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);
    const parse = attachTagSchema.safeParse({ tag_id: tagId });
    if (!parse.success) {
      throw new ValidationError("Invalid tag ID", { errors: parse.error.format() });
    }
    await this.repository.attachTag(projectId, tagId);
  }

  async detachTag(projectId: string, tagId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);
    await this.repository.detachTag(projectId, tagId);
  }

  async attachTechnology(projectId: string, technologyId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);
    const parse = attachTechnologySchema.safeParse({ technology_id: technologyId });
    if (!parse.success) {
      throw new ValidationError("Invalid technology ID", { errors: parse.error.format() });
    }
    await this.repository.attachTechnology(projectId, technologyId);
  }

  async detachTechnology(projectId: string, technologyId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);
    await this.repository.detachTechnology(projectId, technologyId);
  }

  async attachMedia(projectId: string, rawInput: unknown, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);
    const parse = attachMediaSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError("Invalid media attachment input", { errors: parse.error.format() });
    }
    await this.repository.attachMedia(projectId, parse.data.media_asset_id, parse.data.role, parse.data.order_index);
  }

  async detachMedia(projectId: string, mediaAssetId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageProjects(profile);
    await this.repository.detachMedia(projectId, mediaAssetId);
  }
}
