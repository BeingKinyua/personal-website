/**
 * Tovu Intelligence Layer — Intent Classifier
 * Fast deterministic intent analysis with search scope routing.
 */

import type { SearchSourceType } from "../../search/types";

export type TovuIntent =
  | "navigation"
  | "project_question"
  | "article_question"
  | "lab_question"
  | "knowledge_question"
  | "technology_question"
  | "about_victor"
  | "general_question";

// Backwards-compatible alias
export type DoomIntent = TovuIntent;

export interface IntentClassification {
  intent: TovuIntent;
  confidence: number;
  prioritySources: SearchSourceType[];
  suggestedAction?: { label: string; action: string; target: string };
}

export function classifyIntent(query: string): IntentClassification {
  const q = query.toLowerCase().trim();

  // 1. Navigation / Discovery
  if (
    q.startsWith("take me to") ||
    q.startsWith("go to") ||
    q.startsWith("navigate") ||
    q.startsWith("open ") ||
    q.includes("where can i find") ||
    q.includes("how do i get to")
  ) {
    if (q.includes("work") || q.includes("project")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["project"],
        suggestedAction: { label: "Go to Work", action: "navigate", target: "work" },
      };
    }
    if (q.includes("journal") || q.includes("article") || q.includes("essay")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["article"],
        suggestedAction: { label: "Go to Journal", action: "navigate", target: "journal" },
      };
    }
    if (q.includes("lab") || q.includes("experiment") || q.includes("r&d")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["lab"],
        suggestedAction: { label: "Go to Lab", action: "navigate", target: "lab" },
      };
    }
    if (q.includes("knowledge") || q.includes("concept") || q.includes("lattice")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["concept"],
        suggestedAction: { label: "Go to Knowledge Lattice", action: "navigate", target: "knowledge" },
      };
    }
    if (q.includes("about") || q.includes("contact") || q.includes("hire") || q.includes("bio")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["project"],
        suggestedAction: { label: "Go to About Victor", action: "navigate", target: "about" },
      };
    }
    return {
      intent: "navigation",
      confidence: 0.85,
      prioritySources: ["project", "article"],
    };
  }

  // 2. Projects & Systems
  if (
    q.includes("project") ||
    q.includes("case study") ||
    q.includes("what has victor built") ||
    q.includes("portfolio") ||
    q.includes("nyayo") ||
    q.includes("football intelligence") ||
    q.includes("tukokadi") ||
    q.includes("goraft") ||
    q.includes("vector flow")
  ) {
    return {
      intent: "project_question",
      confidence: 0.9,
      prioritySources: ["project", "lab"],
    };
  }

  // 3. Articles & Writings
  if (
    q.includes("article") ||
    q.includes("journal") ||
    q.includes("essay") ||
    q.includes("writing") ||
    q.includes("opinionated architecture") ||
    q.includes("ai engineering") ||
    q.includes("sstable") ||
    q.includes("kinematics")
  ) {
    return {
      intent: "article_question",
      confidence: 0.9,
      prioritySources: ["article"],
    };
  }

  // 4. Lab & Research Experiments
  if (
    q.includes("experiment") ||
    q.includes("lab") ||
    q.includes("prototype") ||
    q.includes("actor") ||
    q.includes("zk") ||
    q.includes("wasm") ||
    q.includes("benchmark")
  ) {
    return {
      intent: "lab_question",
      confidence: 0.9,
      prioritySources: ["lab"],
    };
  }

  // 5. Concepts & Knowledge Lattice
  if (
    q.includes("concept") ||
    q.includes("lattice") ||
    q.includes("consensus") ||
    q.includes("raft") ||
    q.includes("vector database") ||
    q.includes("rag") ||
    q.includes("bloom filter") ||
    q.includes("homography") ||
    q.includes("tla+")
  ) {
    return {
      intent: "knowledge_question",
      confidence: 0.88,
      prioritySources: ["concept", "article"],
    };
  }

  // 6. Technologies & Languages
  if (
    q.includes("tech stack") ||
    q.includes("languages") ||
    q.includes("go") ||
    q.includes("rust") ||
    q.includes("python") ||
    q.includes("typescript") ||
    q.includes("pytorch") ||
    q.includes("redis")
  ) {
    return {
      intent: "technology_question",
      confidence: 0.85,
      prioritySources: ["project", "lab", "concept"],
    };
  }

  // 7. About Victor
  if (
    q.includes("who is victor") ||
    q.includes("victor kinyua") ||
    q.includes("background") ||
    q.includes("experience") ||
    q.includes("philosophy") ||
    q.includes("bio") ||
    q.includes("hire")
  ) {
    return {
      intent: "about_victor",
      confidence: 0.92,
      prioritySources: ["project", "article"],
      suggestedAction: { label: "Read About Victor", action: "navigate", target: "about" },
    };
  }

  // 8. General / Fallback
  return {
    intent: "general_question",
    confidence: 0.7,
    prioritySources: ["project", "article", "lab", "concept"],
  };
}
