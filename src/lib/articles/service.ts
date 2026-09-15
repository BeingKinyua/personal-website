/**
 * VictorOS Articles Domain Service
 * Encapsulates business logic, reading time computation, authorization, and publish workflows.
 */

import { ArticleRepository } from "./repository";
import { createArticleSchema, updateArticleSchema, articleFilterSchema } from "./schemas";
import { assertCanManageArticles, assertCanDelete, canAccessCommandCenter } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { CONTENT_STATUS } from "../shared/constants";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import type { Article, ArticleFilter, CreateArticleInput, UpdateArticleInput } from "./types";

export class ArticleService {
  private repository: ArticleRepository;

  constructor(repository?: ArticleRepository) {
    this.repository = repository || new ArticleRepository();
  }

  /**
   * Estimates reading time based on 200 words per minute average.
   */
  private calculateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  /**
   * Retrieves paginated articles list. Public users only view published articles.
   */
  async listArticles(rawFilter: unknown = {}, profile: ProfileRecord | null = null) {
    const parseResult = articleFilterSchema.safeParse(rawFilter);
    if (!parseResult.success) {
      throw new ValidationError("Invalid article filter parameters", {
        errors: parseResult.error.format(),
      });
    }

    const filter: ArticleFilter = { ...parseResult.data };

    if (!canAccessCommandCenter(profile)) {
      filter.status = CONTENT_STATUS.PUBLISHED;
    }

    const { page, limit } = parsePagination({ page: filter.page, limit: filter.limit });
    const { data, total } = await this.repository.findMany(filter);

    return {
      articles: data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Retrieves single article by slug.
   */
  async getArticleBySlug(slug: string, profile: ProfileRecord | null = null): Promise<Article> {
    if (!slug) {
      throw new ValidationError("Article slug is required.");
    }

    const article = await this.repository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("Article", slug);
    }

    if (article.status !== CONTENT_STATUS.PUBLISHED && !canAccessCommandCenter(profile)) {
      throw new NotFoundError("Article", slug);
    }

    return article;
  }

  /**
   * Creates a new article. Calculates reading time if absent.
   */
  async createArticle(rawInput: unknown, profile: ProfileRecord): Promise<Article> {
    assertCanManageArticles(profile);

    const parseResult = createArticleSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid article input", {
        errors: parseResult.error.format(),
      });
    }

    const input: CreateArticleInput = parseResult.data;

    // Check slug uniqueness
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Article with slug '${input.slug}' already exists.`);
    }

    // Auto-calculate reading time if not explicitly provided
    if (!input.reading_time && input.content) {
      input.reading_time = this.calculateReadingTime(input.content);
    }

    // Auto-set published_at timestamp if published
    if (input.status === CONTENT_STATUS.PUBLISHED && !input.published_at) {
      input.published_at = new Date().toISOString();
    }

    const created = await this.repository.create(input);
    return created;
  }

  /**
   * Updates an existing article.
   */
  async updateArticle(id: string, rawInput: unknown, profile: ProfileRecord): Promise<Article> {
    assertCanManageArticles(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Article", id);
    }

    const parseResult = updateArticleSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid article update payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: UpdateArticleInput = parseResult.data;

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.repository.findBySlug(input.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError(`Article with slug '${input.slug}' already exists.`);
      }
    }

    // Recalculate reading time if content changed and reading_time not manually set
    if (input.content && !input.reading_time) {
      input.reading_time = this.calculateReadingTime(input.content);
    }

    // Auto-set published_at if transitioning to published
    if (input.status === CONTENT_STATUS.PUBLISHED && !existing.published_at && !input.published_at) {
      input.published_at = new Date().toISOString();
    }

    const updated = await this.repository.update(id, input);
    return updated;
  }

  /**
   * Deletes an article. Requires admin role.
   */
  async deleteArticle(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Article", id);
    }

    await this.repository.delete(id);
  }
}
