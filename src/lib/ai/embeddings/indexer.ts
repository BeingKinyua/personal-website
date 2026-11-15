/**
 * Tovu Intelligence Layer — Canonical Content Indexer
 * Reads strictly from Supabase PostgreSQL repositories (never static fixture files)
 * and keeps content_chunks / embeddings synchronized incrementally.
 */

import { EmbeddingService } from "./service";
import {
  normalizeProject,
  normalizeArticle,
  normalizeLab,
  normalizeConcept,
} from "./chunker";
import { ProjectRepository } from "../../projects/repository";
import { ArticleRepository } from "../../articles/repository";
import { LabRepository } from "../../labs/repository";
import { KnowledgeRepository } from "../../knowledge/repository";
import { createSupabaseAdminClient } from "../../supabase/admin";
import { isSupabaseConfigured } from "../../shared/env";
import { logger } from "../../shared/logger";

export interface ContentIndexerRepos {
  projects: ProjectRepository;
  articles: ArticleRepository;
  labs: LabRepository;
  knowledge: KnowledgeRepository;
}

export class ContentIndexer {
  private service: EmbeddingService;
  private injectedRepos?: ContentIndexerRepos;

  constructor(service?: EmbeddingService, repos?: ContentIndexerRepos) {
    this.service = service || new EmbeddingService();
    this.injectedRepos = repos;
  }

  private async getRepos(): Promise<ContentIndexerRepos | null> {
    if (this.injectedRepos) return this.injectedRepos;
    if (!isSupabaseConfigured(true)) {
      return null;
    }
    const admin = await createSupabaseAdminClient();
    return {
      projects: new ProjectRepository(admin),
      articles: new ArticleRepository(admin),
      labs: new LabRepository(admin),
      knowledge: new KnowledgeRepository(admin),
    };
  }

  async indexProjectById(projectId: string): Promise<number> {
    const repos = await this.getRepos();
    if (!repos) return 0;

    const project = await repos.projects.findById(projectId);
    if (!project || project.status !== "published") {
      await this.service.deleteDocumentEmbeddings("project", projectId);
      return 0;
    }

    const sections = await repos.projects.findSections(project.id);
    const doc = normalizeProject(
      {
        id: project.id,
        slug: project.slug,
        title: project.title,
        number: project.number,
        subtitle: project.subtitle,
        description: project.description,
        category: project.category,
        status: project.status,
        technologies: (project.technologies as string[]) || [],
      },
      sections.map((s) => ({
        title: s.title,
        content: s.content,
        order_index: s.order_index,
      })),
      []
    );

    const chunks = await this.service.updateDocumentEmbeddings(doc);
    return chunks.length;
  }

  async indexArticleById(articleId: string): Promise<number> {
    const repos = await this.getRepos();
    if (!repos) return 0;

    const article = await repos.articles.findById(articleId);
    if (!article || article.status !== "published") {
      await this.service.deleteDocumentEmbeddings("article", articleId);
      return 0;
    }

    const doc = normalizeArticle(
      {
        id: article.id,
        slug: article.slug,
        title: article.title,
        description: article.excerpt,
        content: article.content,
        category: (article.tags && article.tags[0]?.name) || "Engineering",
        status: article.status,
        reading_time_minutes: article.reading_time,
      },
      (article.tags || []).map((t) => t.name),
      []
    );

    const chunks = await this.service.updateDocumentEmbeddings(doc);
    return chunks.length;
  }

  async indexLabById(labId: string): Promise<number> {
    const repos = await this.getRepos();
    if (!repos) return 0;

    const lab = await repos.labs.findById(labId);
    if (!lab || lab.status === "archived") {
      await this.service.deleteDocumentEmbeddings("lab", labId);
      return 0;
    }

    const doc = normalizeLab({
      id: lab.id,
      slug: lab.slug,
      title: lab.title,
      description: lab.description,
      category: lab.category,
      status: lab.status,
      stars: lab.stars,
      live_url: lab.live_url,
      github_url: lab.github_url,
    });

    const chunks = await this.service.updateDocumentEmbeddings(doc);
    return chunks.length;
  }

  async indexConceptById(conceptId: string): Promise<number> {
    const repos = await this.getRepos();
    if (!repos) return 0;

    const concept = await repos.knowledge.findById(conceptId);
    if (!concept) {
      await this.service.deleteDocumentEmbeddings("concept", conceptId);
      return 0;
    }

    const doc = normalizeConcept({
      id: concept.id,
      slug: concept.slug,
      name: concept.title,
      description: concept.definition,
      category: concept.category,
    });

    const chunks = await this.service.updateDocumentEmbeddings(doc);
    return chunks.length;
  }

  async removeEntity(
    sourceType: "project" | "article" | "lab" | "concept",
    sourceId: string
  ): Promise<void> {
    await this.service.deleteDocumentEmbeddings(sourceType, sourceId);
  }

  /**
   * Re-indexes all canonical database entities and purges embeddings for unpublished/archived entries.
   */
  async indexAll(): Promise<{
    projectsIndexed: number;
    articlesIndexed: number;
    labsIndexed: number;
    conceptsIndexed: number;
    purgedCount: number;
    totalChunks: number;
  }> {
    const repos = await this.getRepos();
    if (!repos) {
      logger.warn("ContentIndexer.indexAll skipped: Supabase admin credentials not configured.");
      return {
        projectsIndexed: 0,
        articlesIndexed: 0,
        labsIndexed: 0,
        conceptsIndexed: 0,
        purgedCount: 0,
        totalChunks: 0,
      };
    }

    let totalChunks = 0;
    let projectsIndexed = 0;
    let articlesIndexed = 0;
    let labsIndexed = 0;
    let conceptsIndexed = 0;
    let purgedCount = 0;

    // 1. Canonical Projects
    const { data: projects } = await repos.projects.findMany({ page: 1, limit: 100 });
    for (const p of projects) {
      if (p.status !== "published") {
        await this.service.deleteDocumentEmbeddings("project", p.id);
        purgedCount++;
        continue;
      }
      totalChunks += await this.indexProjectById(p.id);
      projectsIndexed++;
    }

    // 2. Canonical Articles
    const { data: articles } = await repos.articles.findMany({ page: 1, limit: 100 });
    for (const a of articles) {
      if (a.status !== "published") {
        await this.service.deleteDocumentEmbeddings("article", a.id);
        purgedCount++;
        continue;
      }
      totalChunks += await this.indexArticleById(a.id);
      articlesIndexed++;
    }

    // 3. Canonical Labs
    const { data: labs } = await repos.labs.findMany({ page: 1, limit: 100 });
    for (const l of labs) {
      if (l.status === "archived") {
        await this.service.deleteDocumentEmbeddings("lab", l.id);
        purgedCount++;
        continue;
      }
      totalChunks += await this.indexLabById(l.id);
      labsIndexed++;
    }

    // 4. Canonical Knowledge Concepts
    const { data: concepts } = await repos.knowledge.findMany({ page: 1, limit: 100 });
    for (const c of concepts) {
      totalChunks += await this.indexConceptById(c.id);
      conceptsIndexed++;
    }

    logger.info("Canonical content indexing complete", {
      projectsIndexed,
      articlesIndexed,
      labsIndexed,
      conceptsIndexed,
      purgedCount,
      totalChunks,
    });

    return {
      projectsIndexed,
      articlesIndexed,
      labsIndexed,
      conceptsIndexed,
      purgedCount,
      totalChunks,
    };
  }
}
