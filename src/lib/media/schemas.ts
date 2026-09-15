/**
 * VictorOS Media Domain Validation Schemas
 */

import { z } from "zod";
import { MEDIA_BUCKETS } from "../shared/constants";

export const mediaFilterSchema = z.object({
  bucket: z.string().optional(),
  mimeType: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const uploadMediaSchema = z.object({
  filename: z.string().min(1).max(255),
  filePath: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  publicUrl: z.string().url(),
  bucket: z.string().default(MEDIA_BUCKETS.SYSTEM),
  altText: z.string().max(300).optional().nullable(),
});
