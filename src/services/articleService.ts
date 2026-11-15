import type { Article } from "../types/article";
import { ARTICLES } from "../data/articles";
import { apiRequest, ApiClientError, shouldFallbackToDevFixture } from "./apiClient";
import { mapArticleRowToArticle, type BackendArticleDto } from "./contentMappers";
import type { ContentFetchResult } from "./projectService";

export interface ArticleRepository {
  getAllArticles(signal?: AbortSignal): Promise<ContentFetchResult<Article[]>>;
  getArticleBySlug(slug: string, signal?: AbortSignal): Promise<ContentFetchResult<Article | null>>;
  searchArticles(query: string, signal?: AbortSignal): Promise<ContentFetchResult<Article[]>>;
}

export class ApiArticleRepository implements ArticleRepository {
  async getAllArticles(signal?: AbortSignal): Promise<ContentFetchResult<Article[]>> {
    try {
      const payload = await apiRequest<{ articles: BackendArticleDto[] }>("/articles?limit=100", {
        signal,
      });
      return {
        data: (payload.articles || []).map(mapArticleRowToArticle),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        return { data: ARTICLES, isFixture: true };
      }
      throw err;
    }
  }

  async getArticleBySlug(
    slug: string,
    signal?: AbortSignal
  ): Promise<ContentFetchResult<Article | null>> {
    try {
      const row = await apiRequest<BackendArticleDto>(
        `/articles/${encodeURIComponent(slug)}`,
        { signal }
      );
      return {
        data: mapArticleRowToArticle(row),
        isFixture: false,
      };
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 404) {
        return { data: null, isFixture: false };
      }
      if (shouldFallbackToDevFixture(err)) {
        const found = ARTICLES.find((a) => a.slug === slug || a.id === slug) || null;
        return { data: found, isFixture: true };
      }
      throw err;
    }
  }

  async searchArticles(query: string, signal?: AbortSignal): Promise<ContentFetchResult<Article[]>> {
    const q = query.trim();
    if (!q) return this.getAllArticles(signal);

    try {
      const payload = await apiRequest<{ articles: BackendArticleDto[] }>(
        `/articles?search=${encodeURIComponent(q)}&limit=50`,
        { signal }
      );
      return {
        data: (payload.articles || []).map(mapArticleRowToArticle),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        const lower = q.toLowerCase();
        return {
          data: ARTICLES.filter(
            (a) =>
              a.title.toLowerCase().includes(lower) ||
              a.summary.toLowerCase().includes(lower) ||
              a.category.toLowerCase().includes(lower) ||
              a.tags.some((t) => t.toLowerCase().includes(lower))
          ),
          isFixture: true,
        };
      }
      throw err;
    }
  }
}

export const articleRepository: ArticleRepository = new ApiArticleRepository();
