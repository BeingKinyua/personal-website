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

  async findSectionById(sectionId: string): Promise<SectionRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("project_sections")
        .select("*")
        .eq("id", sectionId)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch project section by id: ${error.message}`, { sectionId });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure querying section by id", { sectionId, error: String(err) });
    }
  }

  async createSection(projectId: string, input: { title: string; content: string; order_index?: number }): Promise<SectionRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("project_sections")
        .insert({
          project_id: projectId,
          title: input.title,
          content: input.content,
          order_index: input.order_index ?? 0,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to create project section: ${error?.message || "Unknown error"}`);
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure creating project section", { projectId, error: String(err) });
    }
  }

  async updateSection(sectionId: string, input: { title?: string; content?: string; order_index?: number }): Promise<SectionRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("project_sections")
        .update(input)
        .eq("id", sectionId)
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to update project section: ${error?.message || "Not found"}`);
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure updating project section", { sectionId, error: String(err) });
    }
  }

  async deleteSection(sectionId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client.from("project_sections").delete().eq("id", sectionId);
      if (error) {
        throw new DatabaseError(`Failed to delete project section: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure deleting project section", { sectionId, error: String(err) });
    }
  }

  async reorderSections(projectId: string, sectionOrders: { id: string; order_index: number }[]): Promise<void> {
    try {
      const client = await this.getClient();
      for (const item of sectionOrders) {
        const { error } = await client
          .from("project_sections")
          .update({ order_index: item.order_index })
          .eq("id", item.id)
          .eq("project_id", projectId);

        if (error) {
          throw new DatabaseError(`Failed to reorder section ${item.id}: ${error.message}`);
        }
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure reordering project sections", { projectId, error: String(err) });
    }
  }

  async attachTag(projectId: string, tagId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("project_tags")
        .upsert({ project_id: projectId, tag_id: tagId }, { onConflict: "project_id,tag_id" });

      if (error) {
        throw new DatabaseError(`Failed to attach tag: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching tag to project", { projectId, tagId, error: String(err) });
    }
  }

  async detachTag(projectId: string, tagId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("project_tags")
        .delete()
        .eq("project_id", projectId)
        .eq("tag_id", tagId);

      if (error) {
        throw new DatabaseError(`Failed to detach tag: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching tag from project", { projectId, tagId, error: String(err) });
    }
  }

  async attachTechnology(projectId: string, technologyId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("project_technologies")
        .upsert({ project_id: projectId, technology_id: technologyId }, { onConflict: "project_id,technology_id" });

      if (error) {
        throw new DatabaseError(`Failed to attach technology: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching technology to project", { projectId, technologyId, error: String(err) });
    }
  }

  async detachTechnology(projectId: string, technologyId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("project_technologies")
        .delete()
        .eq("project_id", projectId)
        .eq("technology_id", technologyId);

      if (error) {
        throw new DatabaseError(`Failed to detach technology: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching technology from project", { projectId, technologyId, error: String(err) });
    }
  }

  async attachMedia(projectId: string, mediaAssetId: string, role = "gallery", orderIndex = 0): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("project_media")
        .insert({
          project_id: projectId,
          media_asset_id: mediaAssetId,
          role,
          order_index: orderIndex,
        });

      if (error) {
        throw new DatabaseError(`Failed to attach media: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching media to project", { projectId, mediaAssetId, error: String(err) });
    }
  }

  async detachMedia(projectId: string, mediaAssetId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("project_media")
        .delete()
        .eq("project_id", projectId)
        .eq("media_asset_id", mediaAssetId);

      if (error) {
        throw new DatabaseError(`Failed to detach media: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching media from project", { projectId, mediaAssetId, error: String(err) });
    }
  }
}
