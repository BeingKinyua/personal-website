/**
 * VictorOS Labs Repository
 * Pure Supabase data-access layer for lab experiments.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { createSupabaseServerClient } from "../supabase/server";
import { DatabaseError } from "../shared/errors";
import { parsePagination } from "../shared/utils";
import type { LabRow, LabFilter, CreateLabInput, UpdateLabInput } from "./types";

export class LabRepository {
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

  async findById(id: string): Promise<LabRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("labs").select("*").eq("id", id).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch lab by id: ${error.message}`, { id });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying lab by id", { id, error: String(err) });
    }
  }

  async findBySlug(slug: string): Promise<LabRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("labs").select("*").eq("slug", slug).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch lab by slug: ${error.message}`, { slug });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying lab by slug", { slug, error: String(err) });
    }
  }

  async findMany(filter: LabFilter = {}): Promise<{ data: LabRow[]; total: number }> {
    try {
      const client = await this.getClient();
      const { page, limit, offset } = parsePagination({ page: filter.page, limit: filter.limit });

      let query = client.from("labs").select("*", { count: "exact" });

      if (filter.status) {
        query = query.eq("status", filter.status);
      }
      if (filter.category) {
        query = query.eq("category", filter.category);
      }
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
      }

      query = query
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to query labs: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying labs list", { error: String(err) });
    }
  }

  async create(input: CreateLabInput): Promise<LabRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("labs").insert(input).select("*").single();

      if (error || !data) {
        throw new DatabaseError(`Failed to create lab: ${error?.message || "Unknown error"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure creating lab", { error: String(err) });
    }
  }

  async update(id: string, input: UpdateLabInput): Promise<LabRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("labs")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to update lab: ${error?.message || "Not found"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure updating lab", { id, error: String(err) });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client.from("labs").delete().eq("id", id);
      if (error) {
        throw new DatabaseError(`Failed to delete lab: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure deleting lab", { id, error: String(err) });
    }
  }

  async attachMedia(labId: string, mediaAssetId: string, role = "preview", orderIndex = 0): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("lab_media")
        .insert({
          lab_id: labId,
          media_asset_id: mediaAssetId,
          role,
          order_index: orderIndex,
        });

      if (error) {
        throw new DatabaseError(`Failed to attach media to lab: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching media to lab", { labId, mediaAssetId, error: String(err) });
    }
  }

  async detachMedia(labId: string, mediaAssetId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("lab_media")
        .delete()
        .eq("lab_id", labId)
        .eq("media_asset_id", mediaAssetId);

      if (error) {
        throw new DatabaseError(`Failed to detach media from lab: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching media from lab", { labId, mediaAssetId, error: String(err) });
    }
  }
}
