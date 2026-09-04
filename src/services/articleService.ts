import { Article } from "../types/article";
import { ARTICLES } from "../data/articles";

export interface ArticleRepository {
  getAllArticles(): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  searchArticles(query: string): Promise<Article[]>;
}

export class MockArticleRepository implements ArticleRepository {
  async getAllArticles(): Promise<Article[]>;
  async getAllArticles(): Promise<Article[]> {
    return ARTICLES;
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const found = ARTICLES.find((a) => a.slug === slug || a.id === slug);
    return found || null;
  }

  async searchArticles(query: string): Promise<Article[]> {
    const q = query.toLowerCase().trim();
    if (!q) return ARTICLES;
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
}

export const articleRepository: ArticleRepository = new MockArticleRepository();
