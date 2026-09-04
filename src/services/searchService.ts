import { PROJECTS } from "../data/projects";
import { ARTICLES } from "../data/articles";
import { EXPERIMENTS } from "../data/experiments";
import { KNOWLEDGE_NODES } from "../data/knowledge";

export interface SearchResultItem {
  id: string;
  module: "WORK" | "JOURNAL" | "LAB" | "KNOWLEDGE" | "NAVIGATION" | "DOOM";
  title: string;
  subtitle: string;
  action: {
    type: "navigate" | "open_project" | "open_article" | "ask_doom";
    target: string;
  };
}

export function searchVictorOS(query: string): SearchResultItem[] {
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
        action: { type: "navigate", target: "work" }
      },
      {
        id: "proj-nyayo",
        module: "WORK",
        title: "NYAYO",
        subtitle: "A discipleship platform designed around knowing Christ",
        action: { type: "open_project", target: "nyayo" }
      },
      {
        id: "proj-football",
        module: "WORK",
        title: "Football Intelligence",
        subtitle: "Computer vision analysis & recruit intelligence",
        action: { type: "open_project", target: "football-intelligence" }
      },
      {
        id: "art-ai-eng",
        module: "JOURNAL",
        title: "AI Engineering: Systems That Actually Solve Problems",
        subtitle: "Evaluation harnesses and deterministic boundaries",
        action: { type: "open_article", target: "ai-engineering-production" }
      },
      {
        id: "exp-07",
        module: "LAB",
        title: "EXPERIMENT 07 — Football Intelligence",
        subtitle: "Monocular pitch reconstruction & kinematics",
        action: { type: "navigate", target: "lab" }
      },
      {
        id: "nav-knowledge",
        module: "KNOWLEDGE",
        title: "Knowledge Lattice",
        subtitle: "Explore 16 interconnected technical concepts",
        action: { type: "navigate", target: "knowledge" }
      },
      {
        id: "doom-ai",
        module: "DOOM",
        title: "Ask Dr. Doom: AI Systems Inquiry",
        subtitle: "Query the system intelligence layer",
        action: { type: "ask_doom", target: "Show me Victor's AI projects" }
      }
    ];
  }

  // Search Projects
  for (const p of PROJECTS) {
    if (
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.technologies.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        id: `work-${p.id}`,
        module: "WORK",
        title: `${p.number} — ${p.title}`,
        subtitle: `${p.category} · ${p.technologies.slice(0, 3).join(", ")}`,
        action: { type: "open_project", target: p.slug }
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
        id: `journal-${a.id}`,
        module: "JOURNAL",
        title: a.title,
        subtitle: `${a.category} · ${a.readTime}`,
        action: { type: "open_article", target: a.slug }
      });
    }
  }

  // Search Experiments
  for (const e of EXPERIMENTS) {
    if (
      e.title.toLowerCase().includes(q) ||
      e.hypothesis.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        id: `lab-${e.id}`,
        module: "LAB",
        title: `${e.number}: ${e.title}`,
        subtitle: `Status: ${e.status} · ${e.category}`,
        action: { type: "navigate", target: "lab" }
      });
    }
  }

  // Search Knowledge Nodes
  for (const k of KNOWLEDGE_NODES) {
    if (
      k.label.toLowerCase().includes(q) ||
      k.description.toLowerCase().includes(q) ||
      k.category.toLowerCase().includes(q)
    ) {
      results.push({
        id: `knowledge-${k.id}`,
        module: "KNOWLEDGE",
        title: k.label,
        subtitle: `${k.category} (${k.type}) · ${k.level || "Concept"}`,
        action: { type: "navigate", target: "knowledge" }
      });
    }
  }

  // Navigation commands
  const navItems = [
    { title: "Home / System Overview", subtitle: "Telemetry and living system dashboard", target: "home" },
    { title: "Work Module", subtitle: "Cinematic horizontal systems showcase", target: "work" },
    { title: "Journal Module", subtitle: "Bento grid of engineering thinking and essays", target: "journal" },
    { title: "Laboratory Module", subtitle: "Hypothesis validation and unfinished ideas", target: "lab" },
    { title: "Knowledge Module", subtitle: "Concept lattice and learning graph", target: "knowledge" },
    { title: "About Victor", subtitle: "Philosophy, systems creed, and journey timeline", target: "about" },
    { title: "Contact Module", subtitle: "Direct engineering collaboration channels", target: "contact" }
  ];

  for (const nav of navItems) {
    if (nav.title.toLowerCase().includes(q) || nav.subtitle.toLowerCase().includes(q)) {
      results.push({
        id: `nav-${nav.target}`,
        module: "NAVIGATION",
        title: nav.title,
        subtitle: nav.subtitle,
        action: { type: "navigate", target: nav.target }
      });
    }
  }

  // Always offer asking Dr. Doom if query exists
  results.push({
    id: `doom-query-${q}`,
    module: "DOOM",
    title: `Ask Dr. Doom: "${query}"`,
    subtitle: "Delegate semantic query to VictorOS intelligence",
    action: { type: "ask_doom", target: query }
  });

  return results;
}
