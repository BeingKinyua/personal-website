/**
 * VictorOS Intelligence Layer — Content Indexer
 * Ingests and vectorizes all VictorOS content (Projects, Articles, Labs, Concepts)
 * into content_chunks and embeddings.
 */

import { EmbeddingService } from "./service";
import {
  normalizeProject,
  normalizeArticle,
  normalizeLab,
  normalizeConcept,
} from "./chunker";
import { PROJECTS } from "../../../data/projects";
import { ARTICLES } from "../../../data/articles";
import { EXPERIMENTS } from "../../../data/experiments";
import { KNOWLEDGE_NODES } from "../../../data/knowledge";
import { logger } from "../../shared/logger";

export class ContentIndexer {
  private service: EmbeddingService;

  constructor(service?: EmbeddingService) {
    this.service = service || new EmbeddingService();
  }

  /**
   * Indexes all static VictorOS entities into the vector system.
   */
  async indexAll(): Promise<{
    projectsIndexed: number;
    articlesIndexed: number;
    labsIndexed: number;
    conceptsIndexed: number;
    totalChunks: number;
  }> {
    let totalChunks = 0;

    // 1. Index Projects
    let projectsIndexed = 0;
    for (const p of PROJECTS) {
      const sections = [
        {
          title: "Overview",
          content: p.deepDive?.overview || p.details || p.problem,
          order_index: 0,
        },
        {
          title: "Architecture",
          content: p.deepDive?.architectureNotes || p.system || "",
          order_index: 1,
        },
        {
          title: "Solution & Results",
          content: `${p.deepDive?.solution || ""} ${p.deepDive?.results || ""}`.trim(),
          order_index: 2,
        },
      ].filter((s) => s.content.length > 0);

      const doc = normalizeProject(
        {
          id: p.id,
          slug: p.slug,
          title: p.title,
          number: p.number,
          subtitle: p.subtitle,
          description: p.details || p.problem,
          category: p.category,
          status: "published",
          technologies: p.technologies,
        },
        sections,
        []
      );
      const chunks = await this.service.embedDocument(doc);
      totalChunks += chunks.length;
      projectsIndexed++;
    }

    // 2. Index Articles
    let articlesIndexed = 0;
    for (const a of ARTICLES) {
      const doc = normalizeArticle(
        {
          id: a.id,
          slug: a.slug,
          title: a.title,
          description: a.summary,
          content: a.content,
          category: a.category,
          status: "published",
          reading_time_minutes: a.readTime ? parseInt(a.readTime, 10) : 5,
        },
        a.tags || [],
        []
      );
      const chunks = await this.service.embedDocument(doc);
      totalChunks += chunks.length;
      articlesIndexed++;
    }

    // 3. Index Labs
    let labsIndexed = 0;
    for (const l of EXPERIMENTS) {
      const doc = normalizeLab({
        id: l.id,
        slug: l.id,
        title: `${l.number} — ${l.title}`,
        description: `${l.hypothesis} | Current state: ${l.currentState}`,
        category: l.category,
        status: (l.status.toLowerCase() as any) || "exploring",
        stars: 0,
        live_url: null,
        github_url: null,
      });
      const chunks = await this.service.embedDocument(doc);
      totalChunks += chunks.length;
      labsIndexed++;
    }

    // 4. Index Knowledge Concepts
    let conceptsIndexed = 0;
    for (const k of KNOWLEDGE_NODES) {
      const doc = normalizeConcept({
        id: k.id,
        slug: k.id,
        name: k.label,
        description: k.description,
        category: k.category,
      });
      const chunks = await this.service.embedDocument(doc);
      totalChunks += chunks.length;
      conceptsIndexed++;
    }

    logger.info("Content indexing complete", {
      projectsIndexed,
      articlesIndexed,
      labsIndexed,
      conceptsIndexed,
      totalChunks,
    });

    return {
      projectsIndexed,
      articlesIndexed,
      labsIndexed,
      conceptsIndexed,
      totalChunks,
    };
  }
}
