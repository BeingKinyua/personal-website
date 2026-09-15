/**
 * VictorOS Media Domain Types
 */

import type { Database } from "../supabase/types";

export type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media_assets"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media_assets"]["Update"];

export interface MediaAsset extends MediaRow {}

export interface MediaFilter {
  bucket?: string;
  mimeType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UploadMediaInput {
  filename: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  bucket: string;
  altText?: string | null;
}
