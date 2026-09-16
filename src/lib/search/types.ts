/**
 * VictorOS Intelligence Layer — Search Types & Result Contract
 * Defines normalized contracts for Lexical, Semantic, and Hybrid Search.
 */

export type SearchSourceType = "project" | "article" | "lab" | "concept";

export interface SearchResult {
  sourceType: SearchSourceType;
  sourceId: string;
  title: string;
  slug: string;
  excerpt: string;
  score: number; // Normalized 0.0 - 1.0
  matchType: "lexical" | "semantic" | "hybrid";
  url: string;
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  query: string;
  sourceTypes?: SearchSourceType[];
  limit?: number;
  threshold?: number;
  includeDrafts?: boolean;
}

export interface LexicalSearchResult extends SearchResult {
  matchType: "lexical";
  lexicalScore: number;
}

export interface SemanticSearchResult extends SearchResult {
  matchType: "semantic";
  semanticScore: number;
}
