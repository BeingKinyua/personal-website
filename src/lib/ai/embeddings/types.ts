/**
 * VictorOS Intelligence Layer — Embeddings & Normalization Types
 * Defines canonical data transfer objects for document normalization, chunking, and vectors.
 */

export type NormalizedSourceType = "project" | "article" | "lab" | "concept" | "technology";

export interface NormalizedDocument {
  sourceType: NormalizedSourceType;
  sourceId: string;
  title: string;
  slug: string;
  content: string;
  url: string;
  status: "published" | "draft" | "archived";
  metadata?: Record<string, unknown>;
}

export interface ContentChunk {
  id: string;
  sourceType: NormalizedSourceType;
  sourceId: string;
  title: string;
  slug: string;
  sectionTitle?: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  contentHash: string;
  url: string;
  status: "published" | "draft" | "archived";
  metadata?: Record<string, unknown>;
}

export interface ContentChunkInput {
  sourceType: NormalizedSourceType;
  sourceId: string;
  title: string;
  slug: string;
  sectionTitle?: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  url: string;
  status: "published" | "draft" | "archived";
  metadata?: Record<string, unknown>;
}

export interface EmbeddingRecord {
  id?: string;
  chunkId: string;
  embedding: number[];
  model: string;
  createdAt?: string;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embedText(text: string): Promise<number[]>;
  embedTexts(texts: string[]): Promise<number[][]>;
}
