/**
 * VictorOS Articles Repository
 * Pure Supabase data-access layer for articles.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { createSupabaseServerClient } from "../supabase/server";
import { DatabaseError } from "../shared/errors";
import { parsePagination } from "../shared/utils";
import type { ArticleRow, ArticleFilter, CreateArticleInput, UpdateArticleInput } from "./types";

export class ArticleRepository {
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

  async findById(id: string): Promise<ArticleRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("articles").select("*").eq("id", id).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch article by id: ${error.message}`, { id });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying article by id", { id, error: String(err) });
    }
  }

  async findBySlug(slug: string): Promise<ArticleRow | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("articles").select("*").eq("slug", slug).maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch article by slug: ${error.message}`, { slug });
      }
      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying article by slug", { slug, error: String(err) });
    }
  }

  async findMany(filter: ArticleFilter = {}): Promise<{ data: ArticleRow[]; total: number }> {
    try {
      const client = await this.getClient();
      const { page, limit, offset } = parsePagination({ page: filter.page, limit: filter.limit });

      let query = client.from("articles").select("*", { count: "exact" });

      if (filter.status) {
        query = query.eq("status", filter.status);
      }
      if (typeof filter.featured === "boolean") {
        query = query.eq("featured", filter.featured);
      }
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,excerpt.ilike.%${filter.search}%`);
      }

      query = query
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to query articles: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure while querying articles list", { error: String(err) });
    }
  }

  async create(input: CreateArticleInput): Promise<ArticleRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.from("articles").insert(input).select("*").single();

      if (error || !data) {
        throw new DatabaseError(`Failed to create article: ${error?.message || "Unknown error"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure creating article", { error: String(err) });
    }
  }

  async update(id: string, input: UpdateArticleInput): Promise<ArticleRow> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from("articles")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw new DatabaseError(`Failed to update article: ${error?.message || "Not found"}`);
      }

      return data;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure updating article", { id, error: String(err) });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client.from("articles").delete().eq("id", id);
      if (error) {
        throw new DatabaseError(`Failed to delete article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure deleting article", { id, error: String(err) });
    }
  }

  async attachTag(articleId: string, tagId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("article_tags")
        .upsert({ article_id: articleId, tag_id: tagId }, { onConflict: "article_id,tag_id" });

      if (error) {
        throw new DatabaseError(`Failed to attach tag to article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching tag to article", { articleId, tagId, error: String(err) });
    }
  }

  async detachTag(articleId: string, tagId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("article_tags")
        .delete()
        .eq("article_id", articleId)
        .eq("tag_id", tagId);

      if (error) {
        throw new DatabaseError(`Failed to detach tag from article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching tag from article", { articleId, tagId, error: String(err) });
    }
  }

  async attachTechnology(articleId: string, technologyId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("article_technologies")
        .upsert({ article_id: articleId, technology_id: technologyId }, { onConflict: "article_id,technology_id" });

      if (error) {
        throw new DatabaseError(`Failed to attach technology to article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching technology to article", { articleId, technologyId, error: String(err) });
    }
  }

  async detachTechnology(articleId: string, technologyId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("article_technologies")
        .delete()
        .eq("article_id", articleId)
        .eq("technology_id", technologyId);

      if (error) {
        throw new DatabaseError(`Failed to detach technology from article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching technology from article", { articleId, technologyId, error: String(err) });
    }
  }

  async attachMedia(articleId: string, mediaAssetId: string, role = "header", orderIndex = 0): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("article_media")
        .insert({
          article_id: articleId,
          media_asset_id: mediaAssetId,
          role,
          order_index: orderIndex,
        });

      if (error) {
        throw new DatabaseError(`Failed to attach media to article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure attaching media to article", { articleId, mediaAssetId, error: String(err) });
    }
  }

  async detachMedia(articleId: string, mediaAssetId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from("article_media")
        .delete()
        .eq("article_id", articleId)
        .eq("media_asset_id", mediaAssetId);

      if (error) {
        throw new DatabaseError(`Failed to detach media from article: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError("Database failure detaching media from article", { articleId, mediaAssetId, error: String(err) });
    }
  }
}
