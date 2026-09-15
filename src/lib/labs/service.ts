/**
 * VictorOS Labs Domain Service
 * Business logic and authorization for experimental prototypes and systems research.
 */

import { LabRepository } from "./repository";
import { createLabSchema, updateLabSchema, labFilterSchema } from "./schemas";
import { assertCanManageLabs, assertCanDelete } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import type { Lab, LabFilter, CreateLabInput, UpdateLabInput } from "./types";

export class LabService {
  private repository: LabRepository;

  constructor(repository?: LabRepository) {
    this.repository = repository || new LabRepository();
  }

  async listLabs(rawFilter: unknown = {}) {
    const parseResult = labFilterSchema.safeParse(rawFilter);
    if (!parseResult.success) {
      throw new ValidationError("Invalid lab filter parameters", {
        errors: parseResult.error.format(),
      });
    }

    const filter: LabFilter = { ...parseResult.data };
    const { page, limit } = parsePagination({ page: filter.page, limit: filter.limit });
    const { data, total } = await this.repository.findMany(filter);

    return {
      labs: data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getLabBySlug(slug: string): Promise<Lab> {
    if (!slug) {
      throw new ValidationError("Lab slug is required.");
    }

    const lab = await this.repository.findBySlug(slug);
    if (!lab) {
      throw new NotFoundError("Lab experiment", slug);
    }

    return lab;
  }

  async createLab(rawInput: unknown, profile: ProfileRecord): Promise<Lab> {
    assertCanManageLabs(profile);

    const parseResult = createLabSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid lab input payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: CreateLabInput = parseResult.data;

    const existing = await this.repository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Lab with slug '${input.slug}' already exists.`);
    }

    const created = await this.repository.create(input);
    return created;
  }

  async updateLab(id: string, rawInput: unknown, profile: ProfileRecord): Promise<Lab> {
    assertCanManageLabs(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Lab experiment", id);
    }

    const parseResult = updateLabSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid lab update payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: UpdateLabInput = parseResult.data;

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.repository.findBySlug(input.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError(`Lab with slug '${input.slug}' already exists.`);
      }
    }

    const updated = await this.repository.update(id, input);
    return updated;
  }

  async deleteLab(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Lab experiment", id);
    }

    await this.repository.delete(id);
  }
}
