/**
 * VictorOS Labs Domain Service
 * Business logic and authorization for experimental prototypes and systems research.
 */

import { LabRepository } from "./repository";
import { createLabSchema, updateLabSchema, labFilterSchema, attachLabMediaSchema } from "./schemas";
import { assertCanManageLabs, assertCanDelete } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import { revalidateContent, CACHE_TAGS } from "../shared/revalidate";
import { logger } from "../shared/logger";
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

  async getPublishedLabs(filter: LabFilter = {}) {
    return this.listLabs(filter);
  }

  async getLabById(id: string): Promise<Lab> {
    if (!id) {
      throw new ValidationError("Lab ID is required.");
    }

    const lab = await this.repository.findById(id);
    if (!lab) {
      throw new NotFoundError("Lab experiment", id);
    }

    return lab;
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

    logger.info("audit:lab_created", {
      labId: created.id,
      slug: created.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.LABS, CACHE_TAGS.LAB(created.slug)],
      paths: ["/labs", `/labs/${created.slug}`],
    });

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

    logger.info("audit:lab_updated", {
      labId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.LABS, CACHE_TAGS.LAB(existing.slug), CACHE_TAGS.LAB(updated.slug)],
      paths: ["/labs", `/labs/${existing.slug}`, `/labs/${updated.slug}`],
    });

    return updated;
  }

  async archiveLab(id: string, profile: ProfileRecord): Promise<Lab> {
    assertCanManageLabs(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Lab experiment", id);
    }

    const updated = await this.repository.update(id, {
      status: "archived",
    });

    logger.info("audit:lab_archived", {
      labId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.LABS, CACHE_TAGS.LAB(updated.slug)],
      paths: ["/labs", `/labs/${updated.slug}`],
    });

    return updated;
  }

  async deleteLab(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Lab experiment", id);
    }

    await this.repository.delete(id);

    logger.info("audit:lab_deleted", {
      labId: id,
      slug: existing.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.LABS, CACHE_TAGS.LAB(existing.slug)],
      paths: ["/labs", `/labs/${existing.slug}`],
    });
  }

  async attachMedia(
    labId: string,
    rawInput: unknown,
    profile: ProfileRecord
  ): Promise<void> {
    assertCanManageLabs(profile);

    const parseResult = attachLabMediaSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid lab media attachment", {
        errors: parseResult.error.format(),
      });
    }

    await this.repository.attachMedia(
      labId,
      parseResult.data.media_asset_id,
      parseResult.data.role,
      parseResult.data.order_index
    );
  }

  async detachMedia(labId: string, mediaAssetId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageLabs(profile);
    if (!mediaAssetId) throw new ValidationError("Media asset ID is required.");
    await this.repository.detachMedia(labId, mediaAssetId);
  }
}
