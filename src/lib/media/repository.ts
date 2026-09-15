/**
 * VictorOS Media Repository
 * Pure Supabase data-access layer for media assets.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { createSupabaseServerClient } from "../supabase/server";
import { DatabaseError } from "../shared/errors";
import { parsePagination } from "../shared/utils";
import type { MediaRow, MediaFilter, UploadMediaInput } from "./types";

export class MediaRepository {
  private clientPromise?: Promise<SupabaseClient<Database>> | SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    if (client) {
      this.clientPromise = client;
    }
  }

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.clientPromise) {
      return this.clientPromise;
    }
    return await createSupabaseServerClient();
  }

  async findById(id: string): Promise<MediaRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("media_assets").select("*").eq("id", id).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch media asset: ${error.message}`, { id });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying media asset", { id, error: String(err) });
    }
  }

  async findMany(filter: MediaFilter = {}): Promise<{ data: MediaRow[]; total: number }> {
    try {
      const client = await this.getClient();
      const { page, limit, offset } = parsePagination({ page: filter.page, limit: filter.limit });

      let query = client.from("media_assets").select("*", { count: "exact" });

      if (filter.bucket) {
        query = query.eq("bucket", filter.bucket);
      }
      if (filter.mimeType) {
        query = query.eq("mime_type", filter.mimeType);
      }
      if (filter.search) {
        query = query.or(`filename.ilike.%${filter.search}%,alt_text.ilike.%${filter.search}%`);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to query media assets: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying media list", { error: String(err) });
    }
  }

  async create(input: UploadMediaInput): Promise<MediaRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("media_assets")
        .insert({
          filename: input.filename,
          file_path: input.filePath,
          mime_type: input.mimeType,
          size_bytes: input.sizeBytes,
          public_url: input.publicUrl,
          bucket: input.bucket,
          alt_text: input.altText,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to register media asset: ${error?.message || "Unknown error"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure creating media asset", { error: String(err) });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client.from("media_assets").delete().eq("id", id);
      if (error) {
        throw new DatabaseError(`Failed to delete media asset: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure deleting media asset", { id, error: String(err) });
    }
  }
}
