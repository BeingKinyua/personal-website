/**
 * VictorOS Knowledge Repository
 * Pure Supabase data-access layer for conceptual definitions and mental models.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { createSupabaseServerClient } from "../supabase/server";
import { DatabaseError } from "../shared/errors";
import { parsePagination } from "../shared/utils";
import type { ConceptRow, ConceptFilter, CreateConceptInput, UpdateConceptInput } from "./types";

export class KnowledgeRepository {
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

  async findById(id: string): Promise<ConceptRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("concepts").select("*").eq("id", id).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch concept by id: ${error.message}`, { id });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying concept by id", { id, error: String(err) });
    }
  }

  async findBySlug(slug: string): Promise<ConceptRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("concepts").select("*").eq("slug", slug).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch concept by slug: ${error.message}`, { slug });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying concept by slug", { slug, error: String(err) });
    }
  }

  async findMany(filter: ConceptFilter = {}): Promise<{ data: ConceptRow[]; total: number }> {
    try {
      const client = await this.getClient();
      const { page, limit, offset } = parsePagination({ page: filter.page, limit: filter.limit });

      let query = client.from("concepts").select("*", { count: "exact" });

      if (filter.category) {
        query = query.eq("category", filter.category);
      }
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,definition.ilike.%${filter.search}%`);
      }

      query = query
        .order("order_index", { ascending: true })
        .order("title", { ascending: true })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to query concepts: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying concepts list", { error: String(err) });
    }
  }

  async create(input: CreateConceptInput): Promise<ConceptRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("concepts").insert(input).select("*").single();

      if (error || !data) {
        throw new DatabaseError(`Failed to create concept: ${error?.message || "Unknown error"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure creating concept", { error: String(err) });
    }
  }

  async update(id: string, input: UpdateConceptInput): Promise<ConceptRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("concepts")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to update concept: ${error?.message || "Not found"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure updating concept", { id, error: String(err) });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client.from("concepts").delete().eq("id", id);
      if (error) {
        throw new DatabaseError(`Failed to delete concept: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure deleting concept", { id, error: String(err) });
    }
  }
}
