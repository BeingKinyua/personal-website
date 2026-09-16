/**
 * VictorOS Intelligence Layer — Dr. Doom Intent Classifier
 * Fast deterministic intent analysis with search scope routing.
 */

import type { SearchSourceType } from "../../search/types";

export type DoomIntent =
  | "navigation"
  | "project_question"
  | "article_question"
  | "lab_question"
  | "knowledge_question"
  | "technology_question"
  | "about_victor"
  | "general_question";

export interface IntentClassification {
  intent: DoomIntent;
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
    if (q.includes("journal") || q.includes("article")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["article"],
        suggestedAction: { label: "Go to Journal", action: "navigate", target: "journal" },
      };
    }
    if (q.includes("lab") || q.includes("experiment")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["lab"],
        suggestedAction: { label: "Go to Lab", action: "navigate", target: "lab" },
      };
    }
    if (q.includes("knowledge") || q.includes("concept")) {
      return {
        intent: "navigation",
        confidence: 0.95,
        prioritySources: ["concept"],
        suggestedAction: { label: "Go to Knowledge Lattice", action: "navigate", target: "knowledge" },
      };
    }
    if (q.includes("about") || q.includes("contact") || q.includes("hire")) {
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
    q.includes("football intelligence")
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
    q.includes("reading") ||
    q.includes("write") ||
    q.includes("written")
  ) {
    return {
      intent: "article_question",
      confidence: 0.9,
      prioritySources: ["article"],
    };
  }

  // 4. Lab, Learning & Prototypes
  if (
    q.includes("lab") ||
    q.includes("experiment") ||
    q.includes("currently learning") ||
    q.includes("working on") ||
    q.includes("prototype") ||
    q.includes("benchmark")
  ) {
    return {
      intent: "lab_question",
      confidence: 0.88,
      prioritySources: ["lab", "project"],
    };
  }

  // 5. Knowledge & Concepts
  if (
    q.includes("concept") ||
    q.includes("distributed systems") ||
    q.includes("raft") ||
    q.includes("paxos") ||
    q.includes("storage engine") ||
    q.includes("lsm") ||
    q.includes("concurrency") ||
    q.includes("database")
  ) {
    return {
      intent: "knowledge_question",
      confidence: 0.85,
      prioritySources: ["concept", "article"],
    };
  }

  // 6. Technologies
  if (
    q.includes("stack") ||
    q.includes("tech") ||
    q.includes("typescript") ||
    q.includes("react") ||
    q.includes("next.js") ||
    q.includes("python") ||
    q.includes("go") ||
    q.includes("postgres") ||
    q.includes("gemini")
  ) {
    return {
      intent: "technology_question",
      confidence: 0.85,
      prioritySources: ["project", "article", "concept"],
    };
  }

  // 7. About Victor
  if (
    q.includes("who is victor") ||
    q.includes("victor kinyua") ||
    q.includes("background") ||
    q.includes("experience") ||
    q.includes("contact") ||
    q.includes("hire") ||
    q.includes("resume")
  ) {
    return {
      intent: "about_victor",
      confidence: 0.9,
      prioritySources: ["project", "article"],
    };
  }

  // 8. General
  return {
    intent: "general_question",
    confidence: 0.6,
    prioritySources: ["project", "article", "lab", "concept"],
  };
}
