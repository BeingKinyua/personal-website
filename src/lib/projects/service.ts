/**
 * VictorOS Projects Domain Service
 * Encapsulates business logic, input validation, authorization checks, and data transformation.
 */

import { ProjectRepository } from "./repository";
import { createProjectSchema, updateProjectSchema, projectFilterSchema } from "./schemas";
import { assertCanManageProjects, assertCanDelete } from "../auth/authorization";
import { canAccessCommandCenter } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { CONTENT_STATUS } from "../shared/constants";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import type { Project, ProjectFilter, CreateProjectInput, UpdateProjectInput } from "./types";

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
  }
}
