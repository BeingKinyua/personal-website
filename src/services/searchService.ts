import { apiRequest, shouldFallbackToDevFixture } from "./apiClient";
import { PROJECTS } from "../data/projects";
import { ARTICLES } from "../data/articles";
import { EXPERIMENTS } from "../data/experiments";
import { KNOWLEDGE_NODES } from "../data/knowledge";

export interface SearchResultItem {
  id: string;
  module: "WORK" | "JOURNAL" | "LAB" | "KNOWLEDGE" | "NAVIGATION" | "TOVU";
  title: string;
  subtitle: string;
  action: {
    type: "navigate" | "open_project" | "open_article" | "ask_tovu";
    target: string;
  };
}

interface BackendSearchResult {
  sourceType: "project" | "article" | "lab" | "concept";
  sourceId: string;
  title: string;
  slug: string;
  excerpt: string;
  score: number;
  matchType: "lexical" | "semantic" | "hybrid";
  url: string;
}

/**
 * Curated navigation shortcuts shown before the visitor types a query.
 */
export function getCommandSuggestions(): SearchResultItem[] {
  return [
    {
      id: "nav-work",
      module: "NAVIGATION",
      title: "Work Module",
      subtitle: "Engineered systems showcase & case studies",
      action: { type: "navigate", target: "work" },
    },
    {
      id: "nav-journal",
      module: "NAVIGATION",
      title: "Journal Module",
      subtitle: "Technical essays & architectural notes",
      action: { type: "navigate", target: "journal" },
    },
    {
      id: "nav-lab",
      module: "NAVIGATION",
      title: "Lab Module",
      subtitle: "Active engineering experiments & benchmarks",
      action: { type: "navigate", target: "lab" },
    },
    {
      id: "nav-knowledge",
      module: "NAVIGATION",
      title: "Knowledge Lattice",
      subtitle: "Explore interconnected engineering concepts",
      action: { type: "navigate", target: "knowledge" },
    },
    {
      id: "tovu-ai",
      module: "TOVU",
      title: "Ask Tovu: AI Systems Inquiry",
      subtitle: "Query the system intelligence layer",
      action: { type: "ask_tovu", target: "Show me the AI projects" },
    },
  ];
}

function searchDevFixtures(query: string): SearchResultItem[] {
  const q = query.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  for (const p of PROJECTS) {
    if (
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.technologies.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        id: `proj-${p.id}`,
        module: "WORK",
        title: p.title,
        subtitle: `${p.category} — ${p.subtitle}`,
        action: { type: "open_project", target: p.slug },
      });
    }
  }

  for (const a of ARTICLES) {
    if (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        id: `art-${a.id}`,
        module: "JOURNAL",
        title: a.title,
        subtitle: `Article — ${a.readTime}`,
        action: { type: "open_article", target: a.slug },
      });
    }
  }

  for (const e of EXPERIMENTS) {
    if (
      e.title.toLowerCase().includes(q) ||
      e.hypothesis.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        id: `exp-${e.id}`,
        module: "LAB",
        title: `${e.number} — ${e.title}`,
        subtitle: `Experiment (${e.status}) — ${e.tags.join(", ")}`,
        action: { type: "navigate", target: "lab" },
      });
    }
  }

  for (const k of KNOWLEDGE_NODES) {
    if (
      k.label.toLowerCase().includes(q) ||
      k.description.toLowerCase().includes(q) ||
      k.category.toLowerCase().includes(q)
    ) {
      results.push({
        id: `know-${k.id}`,
        module: "KNOWLEDGE",
        title: k.label,
        subtitle: `Concept (${k.category}) — ${k.level}`,
        action: { type: "navigate", target: "knowledge" },
      });
    }
  }

  results.push({
    id: `tovu-query-${q}`,
    module: "TOVU",
    title: `Ask Tovu: "${query}"`,
    subtitle: "Delegate semantic query to Tovu intelligence",
    action: { type: "ask_tovu", target: query },
  });

  return results;
}

/**
 * Canonical hybrid search via GET /api/v1/search.
 * Supports request cancellation via AbortSignal and enforces explicit error reporting
 * in production (dev fixtures activate only on non-prod 503 SUPABASE_NOT_CONFIGURED).
 */
export async function searchTovuHybrid(
  query: string,
  options: { signal?: AbortSignal; types?: string[] } = {}
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return getCommandSuggestions();
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: "12",
  });
  if (options.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  }

  try {
    const items = await apiRequest<BackendSearchResult[]>(`/search?${params.toString()}`, {
      signal: options.signal,
    });

    const mapped: SearchResultItem[] = items.map((item) => {
      let moduleType: SearchResultItem["module"] = "WORK";
      let actionType: SearchResultItem["action"]["type"] = "open_project";

      if (item.sourceType === "article") {
        moduleType = "JOURNAL";
        actionType = "open_article";
      } else if (item.sourceType === "lab") {
        moduleType = "LAB";
        actionType = "navigate";
      } else if (item.sourceType === "concept") {
        moduleType = "KNOWLEDGE";
        actionType = "navigate";
      }

      return {
        id: `backend-${item.sourceType}-${item.sourceId}`,
        module: moduleType,
        title: item.title,
        subtitle: item.excerpt || `${item.matchType.toUpperCase()} match`,
        action: {
          type: actionType,
          target: item.slug || item.sourceId,
        },
      };
    });

    mapped.push({
      id: `tovu-query-${trimmed}`,
      module: "TOVU",
      title: `Ask Tovu: "${trimmed}"`,
      subtitle: "Delegate semantic query to Tovu intelligence",
      action: { type: "ask_tovu", target: trimmed },
    });

    return mapped;
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw err;
    }
    if (shouldFallbackToDevFixture(err)) {
      return searchDevFixtures(trimmed);
    }
    throw err;
  }
}
