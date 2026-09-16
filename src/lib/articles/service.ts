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
import { revalidateContent, CACHE_TAGS } from "../shared/revalidate";
import { logger } from "../shared/logger";
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

    logger.info("audit:article_created", {
      articleId: created.id,
      slug: created.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.ARTICLES, CACHE_TAGS.ARTICLE(created.slug)],
      paths: ["/articles", `/articles/${created.slug}`],
    });

    return created;
  }

  /**
   * Retrieves single article by ID.
   */
  async getArticleById(id: string, profile: ProfileRecord | null = null): Promise<Article> {
    if (!id) {
      throw new ValidationError("Article ID is required.");
    }

    const article = await this.repository.findById(id);
    if (!article) {
      throw new NotFoundError("Article", id);
    }

    if (article.status !== CONTENT_STATUS.PUBLISHED && !canAccessCommandCenter(profile)) {
      throw new NotFoundError("Article", id);
    }

    return article;
  }

  /**
   * Public helper to retrieve published articles directly.
   */
  async getPublishedArticles(filter: ArticleFilter = {}) {
    return this.listArticles({ ...filter, status: CONTENT_STATUS.PUBLISHED }, null);
  }

  /**
   * Public helper to retrieve a published article by slug.
   */
  async getPublishedArticleBySlug(slug: string): Promise<Article> {
    return this.getArticleBySlug(slug, null);
  }

  /**
   * Explicit publishing transition for an article.
   */
  async publishArticle(id: string, profile: ProfileRecord): Promise<Article> {
    assertCanManageArticles(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Article", id);
    }

    if (!existing.title || !existing.slug || !existing.content) {
      throw new ValidationError("Cannot publish article: title, slug, and content are required.");
    }

    const updated = await this.repository.update(id, {
      status: CONTENT_STATUS.PUBLISHED,
      published_at: existing.published_at || new Date().toISOString(),
    });

    logger.info("audit:article_published", {
      articleId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.ARTICLES, CACHE_TAGS.ARTICLE(updated.slug)],
      paths: ["/articles", `/articles/${updated.slug}`],
    });

    return updated;
  }

  /**
   * Transitions an article to archived status.
   */
  async archiveArticle(id: string, profile: ProfileRecord): Promise<Article> {
    assertCanManageArticles(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Article", id);
    }

    const updated = await this.repository.update(id, {
      status: CONTENT_STATUS.ARCHIVED,
    });

    logger.info("audit:article_archived", {
      articleId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.ARTICLES, CACHE_TAGS.ARTICLE(updated.slug)],
      paths: ["/articles", `/articles/${updated.slug}`],
    });

    return updated;
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

    logger.info("audit:article_updated", {
      articleId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [
        CACHE_TAGS.ARTICLES,
        CACHE_TAGS.ARTICLE(existing.slug),
        CACHE_TAGS.ARTICLE(updated.slug),
      ],
      paths: ["/articles", `/articles/${existing.slug}`, `/articles/${updated.slug}`],
    });

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

    logger.info("audit:article_deleted", {
      articleId: id,
      slug: existing.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.ARTICLES, CACHE_TAGS.ARTICLE(existing.slug)],
      paths: ["/articles", `/articles/${existing.slug}`],
    });
  }

  // --- Article Relations Management ---

  async attachTag(articleId: string, tagId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageArticles(profile);
    if (!tagId) throw new ValidationError("Tag ID is required.");
    await this.repository.attachTag(articleId, tagId);
  }

  async detachTag(articleId: string, tagId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageArticles(profile);
    await this.repository.detachTag(articleId, tagId);
  }

  async attachTechnology(articleId: string, technologyId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageArticles(profile);
    if (!technologyId) throw new ValidationError("Technology ID is required.");
    await this.repository.attachTechnology(articleId, technologyId);
  }

  async detachTechnology(articleId: string, technologyId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageArticles(profile);
    await this.repository.detachTechnology(articleId, technologyId);
  }

  async attachMedia(
    articleId: string,
    mediaAssetId: string,
    role = "header",
    orderIndex = 0,
    profile: ProfileRecord
  ): Promise<void> {
    assertCanManageArticles(profile);
    if (!mediaAssetId) throw new ValidationError("Media asset ID is required.");
    await this.repository.attachMedia(articleId, mediaAssetId, role, orderIndex);
  }

  async detachMedia(articleId: string, mediaAssetId: string, profile: ProfileRecord): Promise<void> {
    assertCanManageArticles(profile);
    await this.repository.detachMedia(articleId, mediaAssetId);
  }
}
