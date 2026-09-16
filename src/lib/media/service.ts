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
import { revalidateContent, CACHE_TAGS } from "../shared/revalidate";
import { logger } from "../shared/logger";
import { MEDIA_BUCKETS } from "../shared/constants";
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

    logger.info("audit:media_registered", {
      mediaId: created.id,
      bucket: created.bucket,
      filePath: created.file_path,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.MEDIA],
    });

    return created;
  }

  /**
   * Directly uploads a binary file to Supabase Storage bucket and creates the media asset record.
   */
  async uploadFile(
    params: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      buffer: Buffer | Uint8Array | Blob;
      bucket?: string;
      altText?: string | null;
    },
    profile: ProfileRecord
  ): Promise<MediaAsset> {
    assertCanManageMedia(profile);

    const bucket = params.bucket || MEDIA_BUCKETS.SYSTEM;
    const sanitizedFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueStoragePath = `${Date.now()}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { publicUrl } = await this.repository.uploadStorageObject(
      bucket,
      uniqueStoragePath,
      params.buffer,
      params.mimeType
    );

    // Register record in database
    const created = await this.repository.create({
      filename: params.filename,
      filePath: uniqueStoragePath,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      publicUrl,
      bucket,
      altText: params.altText,
    });

    logger.info("audit:media_uploaded", {
      mediaId: created.id,
      bucket,
      filePath: uniqueStoragePath,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.MEDIA],
    });

    return created;
  }

  async deleteMedia(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Media asset", id);
    }

    // Attempt storage deletion if bucket & file_path exist
    if (existing.bucket && existing.file_path) {
      try {
        await this.repository.deleteStorageObject(existing.bucket, existing.file_path);
      } catch (storageErr) {
        logger.warn("Failed to delete storage file, proceeding with db record deletion", {
          error: String(storageErr),
          bucket: existing.bucket,
          filePath: existing.file_path,
        });
      }
    }

    await this.repository.delete(id);

    logger.info("audit:media_deleted", {
      mediaId: id,
      filePath: existing.file_path,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.MEDIA],
    });
  }
}
