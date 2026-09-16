/**
 * VictorOS Intelligence Layer — Lexical Search
 * Full-text keyword and term search with hierarchical field weighting
 * (Title > Slug > Technologies > Excerpt > Body).
 */

import type { SearchOptions, SearchResult, SearchSourceType } from "./types";
import { ProjectRepository } from "../projects/repository";
import { ArticleRepository } from "../articles/repository";
import { LabRepository } from "../labs/repository";
import { KnowledgeRepository } from "../knowledge/repository";

export class LexicalSearchService {
  private projectRepo: ProjectRepository;
  private articleRepo: ArticleRepository;
  private labRepo: LabRepository;
  private knowledgeRepo: KnowledgeRepository;

  constructor() {
    this.projectRepo = new ProjectRepository();
    this.articleRepo = new ArticleRepository();
    this.labRepo = new LabRepository();
    this.knowledgeRepo = new KnowledgeRepository();
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const rawQuery = options.query.trim();
    if (!rawQuery) return [];

    const limit = options.limit ?? 10;
    const allowedTypes = options.sourceTypes;
    const includeDrafts = options.includeDrafts ?? false;

    const terms = rawQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    if (terms.length === 0) return [];

    const results: SearchResult[] = [];

    // 1. Search Projects
    if (!allowedTypes || allowedTypes.includes("project")) {
      try {
        const { data: projects } = await this.projectRepo.findMany({
          status: includeDrafts ? undefined : "published",
          limit: 30,
        });

        for (const p of projects) {
          const score = this.calculateLexicalScore(
            terms,
            rawQuery,
            p.title,
            p.slug,
            p.subtitle || "",
            p.description || "",
            (p.technologies as string[]) || []
          );

          if (score > 0) {
            results.push({
              sourceType: "project",
              sourceId: p.id,
              title: p.title,
              slug: p.slug,
              excerpt: p.subtitle || p.description || p.title,
              score,
              matchType: "lexical",
              url: `/work/${p.slug}`,
              metadata: {
                category: p.category,
                technologies: p.technologies,
                number: p.number,
              },
            });
          }
        }
      } catch {
        // Safe fall-through
      }
    }

    // 2. Search Articles
    if (!allowedTypes || allowedTypes.includes("article")) {
      try {
        const { data: articles } = await this.articleRepo.findMany({
          status: includeDrafts ? undefined : "published",
          limit: 30,
        });

        for (const a of articles) {
          const score = this.calculateLexicalScore(
            terms,
            rawQuery,
            a.title,
            a.slug,
            a.excerpt || "",
            a.content.slice(0, 800),
            []
          );

          if (score > 0) {
            results.push({
              sourceType: "article",
              sourceId: a.id,
              title: a.title,
              slug: a.slug,
              excerpt: a.excerpt || a.content.slice(0, 160) + "...",
              score,
              matchType: "lexical",
              url: `/journal/${a.slug}`,
              metadata: {
                readingTime: a.reading_time,
              },
            });
          }
        }
      } catch {
        // Safe fall-through
      }
    }

    // 3. Search Labs
    if (!allowedTypes || allowedTypes.includes("lab")) {
      try {
        const { data: labs } = await this.labRepo.findMany({
          status: includeDrafts ? undefined : undefined,
          limit: 30,
        });

        for (const l of labs) {
          if (!includeDrafts && l.status === "archived") continue;
          const score = this.calculateLexicalScore(
            terms,
            rawQuery,
            l.title,
            l.slug,
            l.category,
            l.description,
            []
          );

          if (score > 0) {
            results.push({
              sourceType: "lab",
              sourceId: l.id,
              title: l.title,
              slug: l.slug,
              excerpt: l.description,
              score,
              matchType: "lexical",
              url: `/lab#${l.slug}`,
              metadata: {
                category: l.category,
                status: l.status,
              },
            });
          }
        }
      } catch {
        // Safe fall-through
      }
    }

    // 4. Search Knowledge Concepts
    if (!allowedTypes || allowedTypes.includes("concept")) {
      try {
        const { data: concepts } = await this.knowledgeRepo.findMany({
          limit: 30,
        });

        for (const c of concepts) {
          const score = this.calculateLexicalScore(
            terms,
            rawQuery,
            c.title,
            c.slug,
            c.category,
            c.definition || "",
            []
          );

          if (score > 0) {
            results.push({
              sourceType: "concept",
              sourceId: c.id,
              title: c.title,
              slug: c.slug,
              excerpt: c.definition || `${c.category} concept`,
              score,
              matchType: "lexical",
              url: `/knowledge/${c.slug}`,
              metadata: {
                category: c.category,
              },
            });
          }
        }
      } catch {
        // Safe fall-through
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  private calculateLexicalScore(
    terms: string[],
    rawQuery: string,
    title: string,
    slug: string,
    subtitle: string,
    description: string,
    tags: string[]
  ): number {
    const lTitle = title.toLowerCase();
    const lSlug = slug.toLowerCase();
    const lSub = subtitle.toLowerCase();
    const lDesc = description.toLowerCase();
    const lQuery = rawQuery.toLowerCase();

    // Exact full query match bonuses
    if (lTitle === lQuery) return 1.0;
    if (lSlug === lQuery) return 0.95;
    if (lTitle.includes(lQuery)) return 0.9;

    let points = 0;
    let matchedTerms = 0;

    for (const term of terms) {
      let termMatched = false;

      if (lTitle.includes(term)) {
        points += 3.5;
        termMatched = true;
      }
      if (lSlug.includes(term)) {
        points += 3.0;
        termMatched = true;
      }
      for (const t of tags) {
        if (t.toLowerCase().includes(term)) {
          points += 2.5;
          termMatched = true;
          break;
        }
      }
      if (lSub.includes(term)) {
        points += 1.8;
        termMatched = true;
      }
      if (lDesc.includes(term)) {
        points += 1.0;
        termMatched = true;
      }

      if (termMatched) matchedTerms++;
    }

    if (matchedTerms === 0) return 0;

    // Coverage factor: percentage of search terms satisfied
    const coverage = matchedTerms / terms.length;
    const rawScore = (points / (terms.length * 4.0)) * coverage;

    // Cap and normalize between 0.05 and 0.88 (reserved 0.9+ for exact title matches)
    return Math.min(0.88, Math.max(0.05, Number(rawScore.toFixed(3))));
  }
}
