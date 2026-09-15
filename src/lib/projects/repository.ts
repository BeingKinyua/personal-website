/**
 * VictorOS Projects Repository
 * Pure Supabase data-access layer for projects and project sections.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { createSupabaseServerClient } from "../supabase/server";
import { DatabaseError, NotFoundError } from "../shared/errors";
import { parsePagination } from "../shared/utils";
import type {
  ProjectRow,
  SectionRow,
  ProjectFilter,
  CreateProjectInput,
  UpdateProjectInput,
} from "./types";

export class ProjectRepository {
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

  async findById(id: string): Promise<ProjectRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch project by id: ${error.message}`, { id });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying project by id", { id, error: String(err) });
    }
  }

  async findBySlug(slug: string): Promise<ProjectRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch project by slug: ${error.message}`, { slug });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying project by slug", { slug, error: String(err) });
    }
  }

  async findMany(filter: ProjectFilter = {}): Promise<{ data: ProjectRow[]; total: number }> {
    try {
      const client = await this.getClient();
      const { page, limit, offset } = parsePagination({ page: filter.page, limit: filter.limit });

      let query = client.from("projects").select("*", { count: "exact" });

      if (filter.status) {
        query = query.eq("status", filter.status);
      }
      if (filter.category) {
        query = query.eq("category", filter.category);
      }
      if (typeof filter.featured === "boolean") {
        query = query.eq("featured", filter.featured);
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
        throw new DatabaseError(`Failed to query projects: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying projects list", { error: String(err) });
    }
  }

  async create(input: CreateProjectInput): Promise<ProjectRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("projects")
        .insert(input)
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to create project: ${error?.message || "Unknown error"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure creating project", { error: String(err) });
    }
  }

  async update(id: string, input: UpdateProjectInput): Promise<ProjectRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("projects")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to update project: ${error?.message || "Not found"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure updating project", { id, error: String(err) });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client.from("projects").delete().eq("id", id);
      if (error) {
        throw new DatabaseError(`Failed to delete project: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure deleting project", { id, error: String(err) });
    }
  }

  async findSections(projectId: string): Promise<SectionRow[]> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("project_sections")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });

      if (error) {
        throw new DatabaseError(`Failed to fetch project sections: ${error.message}`);
      }
      return data || [];
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure querying project sections", { projectId, error: String(err) });
    }
  }
}
