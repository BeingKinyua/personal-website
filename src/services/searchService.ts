import { PROJECTS } from "../data/projects";
import { ARTICLES } from "../data/articles";
import { EXPERIMENTS } from "../data/experiments";
import { KNOWLEDGE_NODES } from "../data/knowledge";

export interface SearchResultItem {
  id: string;
  module: "WORK" | "JOURNAL" | "LAB" | "KNOWLEDGE" | "NAVIGATION" | "TOVU" | "DOOM";
  title: string;
  subtitle: string;
  action: {
    type: "navigate" | "open_project" | "open_article" | "ask_tovu" | "ask_doom";
    target: string;
  };
}

export function searchTovu(query: string): SearchResultItem[] {
  const q = query.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  if (!q) {
    // Default quick suggestions
    return [
      {
        id: "nav-work",
        module: "NAVIGATION",
        title: "Work Module",
        subtitle: "Cinematic systems showcase & case studies",
        action: { type: "navigate", target: "work" },
      },
      {
        id: "proj-nyayo",
        module: "WORK",
        title: "NYAYO",
        subtitle: "A discipleship platform designed around knowing Christ",
        action: { type: "open_project", target: "nyayo" },
      },
      {
        id: "proj-football",
        module: "WORK",
        title: "Football Intelligence",
        subtitle: "Computer vision analysis & recruit intelligence",
        action: { type: "open_project", target: "football-intelligence" },
      },
      {
        id: "art-ai-eng",
        module: "JOURNAL",
        title: "AI Engineering: Systems That Actually Solve Problems",
        subtitle: "Evaluation harnesses and deterministic boundaries",
        action: { type: "open_article", target: "ai-engineering-production" },
      },
      {
        id: "exp-07",
        module: "LAB",
        title: "EXPERIMENT 07 — Football Intelligence",
        subtitle: "Monocular pitch reconstruction & kinematics",
        action: { type: "navigate", target: "lab" },
      },
      {
        id: "nav-knowledge",
        module: "KNOWLEDGE",
        title: "Knowledge Lattice",
        subtitle: "Explore 16 interconnected technical concepts",
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

  // Search Projects
  for (const p of PROJECTS) {
    if (
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.system.toLowerCase().includes(q) ||
      p.details.toLowerCase().includes(q) ||
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

  // Search Articles
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

  // Search Experiments
  for (const e of EXPERIMENTS) {
    if (
      e.title.toLowerCase().includes(q) ||
      e.hypothesis.toLowerCase().includes(q) ||
      e.currentState.toLowerCase().includes(q) ||
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

  // Search Knowledge Lattice
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

  // Search Core Navigation
  const navTargets = [
    { title: "Work Module", subtitle: "Engineering showcase & case studies", target: "work" },
    { title: "Journal Module", subtitle: "Essays & architectural writings", target: "journal" },
    { title: "Lab Module", subtitle: "Active experiments & prototypes", target: "lab" },
    { title: "Knowledge Module", subtitle: "Interconnected conceptual lattice", target: "knowledge" },
    { title: "About Section", subtitle: "Bio, creed, timeline & philosophy", target: "about" },
    { title: "Contact Section", subtitle: "Direct channels & collaboration", target: "contact" },
  ];

  for (const nav of navTargets) {
    if (nav.title.toLowerCase().includes(q) || nav.subtitle.toLowerCase().includes(q)) {
      results.push({
        id: `nav-${nav.target}`,
        module: "NAVIGATION",
        title: nav.title,
        subtitle: nav.subtitle,
        action: { type: "navigate", target: nav.target },
      });
    }
  }

  // Always offer asking Tovu if query exists
  results.push({
    id: `tovu-query-${q}`,
    module: "TOVU",
    title: `Ask Tovu: "${query}"`,
    subtitle: "Delegate semantic query to Tovu intelligence",
    action: { type: "ask_tovu", target: query },
  });

  return results;
}

// Backwards-compatible alias
export const searchVictorOS = searchTovu;

/**
 * Queries the real Tovu backend hybrid search API (/api/v1/search)
 * with graceful fallback to client-side search.
 */
export async function searchTovuHybrid(query: string): Promise<SearchResultItem[]> {
  const localResults = searchTovu(query);
  if (!query.trim()) return localResults;

  try {
    const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}&limit=12`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const backendItems: SearchResultItem[] = json.data.map((item: any) => {
          let moduleType: "WORK" | "JOURNAL" | "LAB" | "KNOWLEDGE" = "WORK";
          let actionType: "navigate" | "open_project" | "open_article" = "open_project";

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
            subtitle: item.excerpt || `${item.matchType.toUpperCase()} match (${Math.round(item.score * 100)}%)`,
            action: {
              type: actionType,
              target: item.slug || item.sourceId,
            },
          };
        });

        // Always include Tovu delegation action
        backendItems.push({
          id: `tovu-query-${query}`,
          module: "TOVU",
          title: `Ask Tovu: "${query}"`,
          subtitle: "Delegate semantic query to Tovu intelligence",
          action: { type: "ask_tovu", target: query },
        });

        return backendItems;
      }
    }
  } catch {
    // Fall back to local search
  }

  return localResults;
}

// Backwards-compatible alias
export const searchVictorOSHybrid = searchTovuHybrid;
