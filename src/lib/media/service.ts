/**
 * VictorOS Media Domain Service
 * Encapsulates validation, bucket assignment, and authorization for media assets.
 */

import { MediaRepository } from "./repository";
import { uploadMediaSchema, mediaFilterSchema } from "./schemas";
import { assertCanManageMedia, assertCanDelete } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError } from "../shared/errors";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import type { MediaAsset, MediaFilter, UploadMediaInput } from "./types";

export class MediaService {
  private repository: MediaRepository;

  constructor(repository?: MediaRepository) {
    this.repository = repository || new MediaRepository();
  }

  async listMedia(rawFilter: unknown = {}) {
    const parseResult = mediaFilterSchema.safeParse(rawFilter);
    if (!parseResult.success) {
      throw new ValidationError("Invalid media filter parameters", {
        errors: parseResult.error.format(),
      });
    }

    const filter: MediaFilter = { ...parseResult.data };
    const { page, limit } = parsePagination({ page: filter.page, limit: filter.limit });
    const { data, total } = await this.repository.findMany(filter);

    return {
      media: data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getMediaById(id: string): Promise<MediaAsset> {
    if (!id) {
      throw new ValidationError("Media asset id is required.");
    }

    const media = await this.repository.findById(id);
    if (!media) {
      throw new NotFoundError("Media asset", id);
    }

    return media;
  }

  async registerMedia(rawInput: unknown, profile: ProfileRecord): Promise<MediaAsset> {
    assertCanManageMedia(profile);

    const parseResult = uploadMediaSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid media registration payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: UploadMediaInput = parseResult.data;
    const created = await this.repository.create(input);
    return created;
  }

  async deleteMedia(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Media asset", id);
    }

    await this.repository.delete(id);
  }
}
