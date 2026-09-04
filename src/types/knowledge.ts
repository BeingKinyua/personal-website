export type KnowledgeType = "concept" | "technology" | "book" | "research" | "course" | "note";

export interface KnowledgeNode {
  id: string;
  label: string;
  type: KnowledgeType;
  description: string;
  connections: string[]; // IDs of connected nodes
  relatedProjects?: string[]; // project slugs/ids
  relatedArticles?: string[]; // article slugs/ids
  category: "AI & ML" | "Systems & Infrastructure" | "Data & Storage" | "Product & Design";
  level?: "Foundational" | "Applied" | "Advanced";
  readingOrCourse?: {
    author?: string;
    progress?: string;
    keyTakeaway?: string;
  };
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship?: string;
}
