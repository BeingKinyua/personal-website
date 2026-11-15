/**
 * Canonical Content Mappers
 * Transforms PostgreSQL/Supabase DTOs returned by /api/v1/* into frontend view models.
 */

import type { Project, ProjectLine, ProjectMetric, ProjectNode, ProjectSectionDetail } from "../types/project";
import type { Article } from "../types/article";
import type { Experiment, ExperimentStatus } from "../types/experiment";
import type { KnowledgeEdge, KnowledgeNode, KnowledgeType } from "../types/knowledge";
import type { LabStatus } from "../lib/shared/constants";

export interface BackendProjectSectionDto {
  id: string;
  title: string;
  content: string;
  order_index: number;
}

export interface BackendProjectDto {
  id: string;
  slug: string;
  number: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  version: string | null;
  status: string;
  featured: boolean;
  hero_image_url?: string | null;
  github_url: string | null;
  live_url: string | null;
  metrics: unknown;
  technologies: string[] | null;
  architecture_nodes: unknown;
  architecture_lines: unknown;
  order_index: number;
  sections?: BackendProjectSectionDto[];
}

export interface BackendArticleDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  reading_time: number;
  status: string;
  featured: boolean;
  cover_image_url?: string | null;
  published_at: string | null;
  created_at: string;
  tags?: { id: string; name: string; slug: string }[];
}

export interface BackendLabDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: LabStatus | string;
  stars: number;
  live_url: string | null;
  github_url: string | null;
  order_index: number;
}

export interface BackendConceptDto {
  id: string;
  slug: string;
  title: string;
  category: string;
  definition: string;
  key_points: string[] | null;
  related_concepts: string[] | null;
  order_index: number;
}

export interface BackendKnowledgeGraphDto {
  concepts: BackendConceptDto[];
  relationships: {
    source_concept_id: string;
    target_concept_id: string;
    relationship_type: string;
  }[];
  contentLinks: {
    concept_id: string;
    content_type: string;
    content_id: string;
    slug: string;
  }[];
}

function parseSnippetContent(raw: string): ProjectSectionDetail["implementationSnippet"] | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        filename?: string;
        language?: string;
        code?: string;
      };
      if (parsed.code) {
        return {
          filename: parsed.filename || "implementation.ts",
          language: parsed.language || "typescript",
          code: parsed.code,
        };
      }
    } catch {
      // fall through to markdown fence parsing
    }
  }

  const fenceMatch = trimmed.match(/```([a-zA-Z0-9_-]+)?(?::([^\n]+))?\n([\s\S]*?)```/);
  if (fenceMatch) {
    return {
      language: fenceMatch[1] || "typescript",
      filename: fenceMatch[2]?.trim() || "implementation",
      code: fenceMatch[3].trimEnd(),
    };
  }

  return {
    filename: "implementation",
    language: "typescript",
    code: trimmed,
  };
}

export function mapProjectRowToProject(row: BackendProjectDto, index = 0): Project {
  const sectionMap = new Map<string, string>();
  for (const sec of row.sections || []) {
    sectionMap.set(sec.title.trim().toLowerCase(), sec.content);
  }

  const getSection = (...keys: string[]): string => {
    for (const k of keys) {
      const val = sectionMap.get(k.toLowerCase());
      if (val !== undefined) return val;
    }
    return "";
  };

  const overview =
    getSection("overview", "01. overview", "system intent") || row.description || row.subtitle || "";
  const problem = getSection("problem", "02. problem", "failure modes");
  const research = getSection("research", "03. research", "foundational invariants");
  const solution = getSection("solution", "04. solution", "architectural solution");
  const architectureNotes = getSection("architecture notes", "architecture", "architecture_notes");
  const snippetRaw = getSection("implementation snippet", "implementation", "code");
  const results = getSection("results", "empirical results");
  const lessons = getSection("lessons", "engineering lessons");
  const systemSummary = getSection("system") || solution || overview;
  const detailsSummary = getSection("details") || architectureNotes || overview;

  const metrics = Array.isArray(row.metrics) ? (row.metrics as ProjectMetric[]) : undefined;
  const architectureNodes = Array.isArray(row.architecture_nodes)
    ? (row.architecture_nodes as ProjectNode[])
    : [];
  const architectureLines = Array.isArray(row.architecture_lines)
    ? (row.architecture_lines as ProjectLine[])
    : [];

  return {
    id: row.id,
    slug: row.slug,
    number: row.number || String(index + 1).padStart(2, "0"),
    title: row.title,
    subtitle: row.subtitle || row.description || "",
    category: row.category,
    technologies: Array.isArray(row.technologies) ? row.technologies : [],
    featured: Boolean(row.featured),
    version: row.version || "v1.0.0",
    problem,
    system: systemSummary,
    details: detailsSummary,
    metrics,
    deepDive: {
      overview,
      problem,
      research,
      solution,
      architectureNotes,
      implementationSnippet: snippetRaw ? parseSnippetContent(snippetRaw) : undefined,
      results,
      lessons,
    },
    architectureNodes,
    architectureLines,
    githubUrl: row.github_url || undefined,
    liveUrl: row.live_url || undefined,
  };
}

function formatEditorialDate(iso: string | null | undefined): string {
  if (!iso) return "DRAFT";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.toUpperCase();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

function deriveVisualType(slug: string, category: string): Article["visualType"] {
  const key = `${slug} ${category}`.toLowerCase();
  if (key.includes("rag") || key.includes("ai")) return "graph";
  if (key.includes("storage") || key.includes("lsm") || key.includes("data")) return "enclave";
  if (key.includes("football") || key.includes("kinematics") || key.includes("vision")) return "kinematics";
  return "grid";
}

export function mapArticleRowToArticle(row: BackendArticleDto): Article {
  const tags = Array.isArray(row.tags) ? row.tags.map((t) => t.name) : [];
  const category = tags[0] || "Engineering";
  const readingMins = row.reading_time > 0 ? row.reading_time : 5;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category,
    date: formatEditorialDate(row.published_at || row.created_at),
    readTime: `${readingMins} min read`,
    summary: row.excerpt || "",
    tags,
    content: row.content || "",
    featured: Boolean(row.featured),
    bentoSpan: row.featured ? "wide" : "standard",
    visualType: deriveVisualType(row.slug, category),
  };
}

function mapLabStatusToUi(status: string): ExperimentStatus {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "building":
    case "active":
      return "Building";
    case "exploring":
    case "experimental":
      return "Exploring";
    case "completed":
      return "Prototype";
    case "paused":
      return "Paused";
    case "archived":
      return "Archived";
    default:
      return "Idea";
  }
}

export function mapLabRowToExperiment(row: BackendLabDto, index = 0): Experiment {
  let hypothesis = row.description;
  let currentState = `Status: ${mapLabStatusToUi(row.status)}`;
  let nextExperiment = "Next benchmark and validation iteration scheduled.";
  let tags: string[] = [row.category];
  let metrics: Experiment["metrics"];
  let snippet: Experiment["snippet"];
  let number = `EXPERIMENT ${String(index + 1).padStart(2, "0")}`;
  let uiStatusOverride: ExperimentStatus | undefined;

  const trimmed = (row.description || "").trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        number?: string;
        uiStatus?: ExperimentStatus;
        hypothesis?: string;
        currentState?: string;
        nextExperiment?: string;
        tags?: string[];
        metrics?: { label: string; value: string }[];
        snippet?: Experiment["snippet"];
      };
      if (parsed.hypothesis) hypothesis = parsed.hypothesis;
      if (parsed.currentState) currentState = parsed.currentState;
      if (parsed.nextExperiment) nextExperiment = parsed.nextExperiment;
      if (Array.isArray(parsed.tags) && parsed.tags.length > 0) tags = parsed.tags;
      if (Array.isArray(parsed.metrics)) metrics = parsed.metrics;
      if (parsed.snippet) snippet = parsed.snippet;
      if (parsed.number) number = parsed.number;
      if (parsed.uiStatus) uiStatusOverride = parsed.uiStatus;
    } catch {
      // plain text description fallback
    }
  }

  return {
    id: row.slug || row.id,
    number,
    title: row.title,
    status: uiStatusOverride || mapLabStatusToUi(row.status),
    category: row.category,
    hypothesis,
    currentState,
    nextExperiment,
    tags,
    metrics,
    snippet,
  };
}

const VALID_KNOWLEDGE_CATEGORIES = new Set<KnowledgeNode["category"]>([
  "AI & ML",
  "Systems & Infrastructure",
  "Data & Storage",
  "Product & Design",
]);

function normalizeKnowledgeCategory(raw: string): KnowledgeNode["category"] {
  if (VALID_KNOWLEDGE_CATEGORIES.has(raw as KnowledgeNode["category"])) {
    return raw as KnowledgeNode["category"];
  }
  const lower = raw.toLowerCase();
  if (lower.includes("ai") || lower.includes("ml")) return "AI & ML";
  if (lower.includes("data") || lower.includes("storage")) return "Data & Storage";
  if (lower.includes("product") || lower.includes("design")) return "Product & Design";
  return "Systems & Infrastructure";
}

function parseConceptMetadata(keyPoints: string[] | null): {
  type: KnowledgeType;
  level?: KnowledgeNode["level"];
  readingOrCourse?: KnowledgeNode["readingOrCourse"];
} {
  let type: KnowledgeType = "concept";
  let level: KnowledgeNode["level"];
  let readingOrCourse: KnowledgeNode["readingOrCourse"];

  for (const kp of keyPoints || []) {
    if (kp.startsWith("type:")) {
      type = kp.slice(5) as KnowledgeType;
    } else if (kp.startsWith("level:")) {
      level = kp.slice(6) as KnowledgeNode["level"];
    } else if (kp.startsWith("study:")) {
      try {
        readingOrCourse = JSON.parse(kp.slice(6)) as KnowledgeNode["readingOrCourse"];
      } catch {
        // ignore malformed metadata entry
      }
    }
  }

  return { type, level, readingOrCourse };
}

export function mapKnowledgeGraphToUi(graph: BackendKnowledgeGraphDto): {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
} {
  const idToSlug = new Map<string, string>();
  for (const c of graph.concepts) {
    idToSlug.set(c.id, c.slug);
  }

  const connectionMap = new Map<string, Set<string>>();
  for (const c of graph.concepts) {
    connectionMap.set(c.slug, new Set(c.related_concepts || []));
  }

  const edges: KnowledgeEdge[] = [];
  for (const rel of graph.relationships) {
    const srcSlug = idToSlug.get(rel.source_concept_id);
    const tgtSlug = idToSlug.get(rel.target_concept_id);
    if (!srcSlug || !tgtSlug) continue;
    edges.push({
      source: srcSlug,
      target: tgtSlug,
      relationship: rel.relationship_type,
    });
    connectionMap.get(srcSlug)?.add(tgtSlug);
  }

  const projectsByConceptId = new Map<string, string[]>();
  const articlesByConceptId = new Map<string, string[]>();
  for (const link of graph.contentLinks) {
    if (link.content_type === "project") {
      const list = projectsByConceptId.get(link.concept_id) || [];
      if (!list.includes(link.slug)) list.push(link.slug);
      projectsByConceptId.set(link.concept_id, list);
    } else if (link.content_type === "article") {
      const list = articlesByConceptId.get(link.concept_id) || [];
      if (!list.includes(link.slug)) list.push(link.slug);
      articlesByConceptId.set(link.concept_id, list);
    }
  }

  const nodes: KnowledgeNode[] = graph.concepts.map((c) => {
    const meta = parseConceptMetadata(c.key_points);
    const relatedProjects = projectsByConceptId.get(c.id);
    const relatedArticles = articlesByConceptId.get(c.id);
    return {
      id: c.slug,
      label: c.title,
      type: meta.type,
      category: normalizeKnowledgeCategory(c.category),
      level: meta.level,
      description: c.definition,
      connections: Array.from(connectionMap.get(c.slug) || []),
      ...(relatedProjects && relatedProjects.length > 0 ? { relatedProjects } : {}),
      ...(relatedArticles && relatedArticles.length > 0 ? { relatedArticles } : {}),
      ...(meta.readingOrCourse ? { readingOrCourse: meta.readingOrCourse } : {}),
    };
  });

  return { nodes, edges };
}
