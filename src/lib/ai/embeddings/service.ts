/**
 * Tovu Intelligence Layer — Embeddings Service
 * Orchestrates content normalization, deterministic chunking, vector generation,
 * persistence in Supabase pgvector, stateless cold-start hydration, and memory caching.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/types";
import { createSupabaseAdminClient } from "../../supabase/admin";
import { createSupabaseServerClient } from "../../supabase/server";
import { isSupabaseConfigured } from "../../shared/env";
import {
  type NormalizedDocument,
  type NormalizedSourceType,
  type ContentChunk,
  type EmbeddingProvider,
} from "./types";
import { chunkDocument } from "./chunker";
import { getEmbeddingProvider, cosineSimilarity } from "./provider";
import { logger } from "../../shared/logger";

export interface VectorSearchResult {
  chunk: ContentChunk;
  similarity: number;
}

interface SourceMeta {
  title: string;
  slug: string;
  status: "published" | "draft" | "archived";
  url: string;
}

function buildSourceUrl(sourceType: string, slug: string): string {
  switch (sourceType) {
    case "project":
      return `/work/${slug}`;
    case "article":
      return `/journal/${slug}`;
    case "lab":
      return `/lab#${slug}`;
    case "concept":
      return `/knowledge/${slug}`;
    default:
      return `/${sourceType}/${slug}`;
  }
}

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private clientPromise?: Promise<SupabaseClient<Database>> | SupabaseClient<Database>;

  private static memoryChunkIndex = new Map<string, ContentChunk>();
  private static memoryVectorIndex = new Map<string, number[]>();

  constructor(
    provider?: EmbeddingProvider,
    client?: SupabaseClient<Database>
  ) {
    this.provider = provider || getEmbeddingProvider();
    if (client) {
      this.clientPromise = client;
    }
  }

  private async getAdminClient(): Promise<SupabaseClient<Database> | null> {
    if (this.clientPromise) {
      return await this.clientPromise;
    }
    if (!isSupabaseConfigured(true)) {
      return null;
    }
    try {
      return await createSupabaseAdminClient();
    } catch {
      return null;
    }
  }

  private async getReadClient(): Promise<SupabaseClient<Database> | null> {
    if (this.clientPromise) {
      return await this.clientPromise;
    }
    if (!isSupabaseConfigured(false)) {
      return null;
    }
    try {
      return await createSupabaseServerClient();
    } catch {
      return null;
    }
  }

  /**
   * Deterministically processes a document: chunks it, generates embeddings for new/changed
   * chunks, and registers them into Supabase and memory.
   */
  async embedDocument(doc: NormalizedDocument): Promise<ContentChunk[]> {
    const chunks = chunkDocument(doc);
    if (chunks.length === 0) return [];

    const chunksToEmbed: ContentChunk[] = [];
    const textsToEmbed: string[] = [];

    for (const chunk of chunks) {
      const existing = EmbeddingService.memoryChunkIndex.get(chunk.id);
      const existingVec = EmbeddingService.memoryVectorIndex.get(chunk.id);

      if (!existing || existing.contentHash !== chunk.contentHash || !existingVec) {
        chunksToEmbed.push(chunk);
        const enrichedText = `[${chunk.sourceType.toUpperCase()}] ${chunk.title}\nSection: ${chunk.sectionTitle || "General"}\n\n${chunk.content}`;
        textsToEmbed.push(enrichedText);
      }
    }

    if (chunksToEmbed.length > 0) {
      logger.info("Generating embeddings for document chunks", {
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        chunkCount: chunksToEmbed.length,
        provider: this.provider.name,
      });

      const vectors = await this.provider.embedTexts(textsToEmbed);

      for (let i = 0; i < chunksToEmbed.length; i++) {
        const chunk = chunksToEmbed[i];
        const vector = vectors[i];
        EmbeddingService.memoryChunkIndex.set(chunk.id, chunk);
        EmbeddingService.memoryVectorIndex.set(chunk.id, vector);
      }

      await this.persistChunksToDatabase(chunksToEmbed, vectors);
    } else {
      for (const chunk of chunks) {
        EmbeddingService.memoryChunkIndex.set(chunk.id, chunk);
      }
    }

    return chunks;
  }

  /**
   * Persists chunk records and vector embeddings into Supabase tables.
   */
  private async persistChunksToDatabase(
    chunks: ContentChunk[],
    vectors: number[][]
  ): Promise<void> {
    try {
      const client = await this.getAdminClient();
      if (!client) return;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vector = vectors[i];

        const { error: chunkErr } = await client.from("content_chunks").upsert(
          {
            id: chunk.id,
            source_type: chunk.sourceType,
            source_id: chunk.sourceId,
            chunk_index: chunk.chunkIndex,
            content: chunk.content,
            token_count: chunk.tokenCount,
          },
          { onConflict: "id" }
        );

        if (chunkErr) {
          logger.warn("Could not persist chunk to database", {
            chunkId: chunk.id,
            error: chunkErr.message,
          });
          continue;
        }

        const { error: embErr } = await client.from("embeddings").upsert(
          {
            chunk_id: chunk.id,
            embedding: vector,
            model: this.provider.name,
          },
          { onConflict: "chunk_id" }
        );

        if (embErr) {
          logger.warn("Could not persist embedding vector to database", {
            chunkId: chunk.id,
            error: embErr.message,
          });
        }
      }
    } catch (err) {
      logger.warn("Database vector persistence skipped", { error: String(err) });
    }
  }

  /**
   * Updates embeddings for a document, upserting current chunks and purging stale higher indices.
   */
  async updateDocumentEmbeddings(doc: NormalizedDocument): Promise<ContentChunk[]> {
    const chunks = await this.embedDocument(doc);
    const validIds = new Set(chunks.map((c) => c.id));

    for (const [chunkId, existing] of EmbeddingService.memoryChunkIndex.entries()) {
      if (
        existing.sourceType === doc.sourceType &&
        existing.sourceId === doc.sourceId &&
        !validIds.has(chunkId)
      ) {
        EmbeddingService.memoryChunkIndex.delete(chunkId);
        EmbeddingService.memoryVectorIndex.delete(chunkId);
      }
    }

    try {
      const client = await this.getAdminClient();
      if (client) {
        await client
          .from("content_chunks")
          .delete()
          .eq("source_type", doc.sourceType)
          .eq("source_id", doc.sourceId)
          .gte("chunk_index", chunks.length);
      }
    } catch (err) {
      logger.warn("Failed to purge trailing document chunks", { error: String(err) });
    }

    return chunks;
  }

  /**
   * Removes all chunk and embedding records for a given entity.
   */
  async deleteDocumentEmbeddings(
    sourceType: string,
    sourceId: string
  ): Promise<void> {
    for (const [chunkId, chunk] of EmbeddingService.memoryChunkIndex.entries()) {
      if (chunk.sourceType === sourceType && chunk.sourceId === sourceId) {
        EmbeddingService.memoryChunkIndex.delete(chunkId);
        EmbeddingService.memoryVectorIndex.delete(chunkId);
      }
    }

    try {
      const client = await this.getAdminClient();
      if (client) {
        await client
          .from("content_chunks")
          .delete()
          .eq("source_type", sourceType)
          .eq("source_id", sourceId);
      }
    } catch (err) {
      logger.warn("Failed to delete chunks from database", { error: String(err) });
    }
  }

  /**
   * Batch-fetches source metadata for RPC rows when memory cache is cold (stateless restarts).
   */
  private async hydrateSourceMetadata(
    client: SupabaseClient<Database>,
    rows: Array<{ source_type: string; source_id: string }>
  ): Promise<Map<string, SourceMeta>> {
    const metaMap = new Map<string, SourceMeta>();
    const idsByType: Record<string, Set<string>> = {
      project: new Set(),
      article: new Set(),
      lab: new Set(),
      concept: new Set(),
    };

    for (const row of rows) {
      if (idsByType[row.source_type]) {
        idsByType[row.source_type].add(row.source_id);
      }
    }

    const [projRes, artRes, labRes, conRes] = await Promise.all([
      idsByType.project.size > 0
        ? client
            .from("projects")
            .select("id, title, slug, status")
            .in("id", Array.from(idsByType.project))
        : Promise.resolve({ data: [] as any[], error: null }),
      idsByType.article.size > 0
        ? client
            .from("articles")
            .select("id, title, slug, status")
            .in("id", Array.from(idsByType.article))
        : Promise.resolve({ data: [] as any[], error: null }),
      idsByType.lab.size > 0
        ? client
            .from("labs")
            .select("id, title, slug, status")
            .in("id", Array.from(idsByType.lab))
        : Promise.resolve({ data: [] as any[], error: null }),
      idsByType.concept.size > 0
        ? client
            .from("concepts")
            .select("id, title, slug")
            .in("id", Array.from(idsByType.concept))
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    for (const p of projRes.data || []) {
      metaMap.set(`project:${p.id}`, {
        title: p.title,
        slug: p.slug,
        status: p.status,
        url: buildSourceUrl("project", p.slug),
      });
    }
    for (const a of artRes.data || []) {
      metaMap.set(`article:${a.id}`, {
        title: a.title,
        slug: a.slug,
        status: a.status,
        url: buildSourceUrl("article", a.slug),
      });
    }
    for (const l of labRes.data || []) {
      metaMap.set(`lab:${l.id}`, {
        title: l.title,
        slug: l.slug,
        status: l.status === "archived" ? "archived" : "published",
        url: buildSourceUrl("lab", l.slug),
      });
    }
    for (const c of conRes.data || []) {
      metaMap.set(`concept:${c.id}`, {
        title: c.title,
        slug: c.slug,
        status: "published",
        url: buildSourceUrl("concept", c.slug),
      });
    }

    return metaMap;
  }

  /**
   * Performs semantic k-Nearest Neighbors search using cosine similarity.
   * Works seamlessly in stateless/cold environments by hydrating metadata from DB RPC rows.
   */
  async searchSimilar(
    queryVector: number[],
    options: {
      limit?: number;
      threshold?: number;
      sourceTypes?: string[];
      includeDrafts?: boolean;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const limit = options.limit ?? 10;
    const threshold = options.threshold ?? 0.35;
    const allowedTypes = options.sourceTypes;
    const includeDrafts = options.includeDrafts ?? false;

    try {
      const client = await this.getReadClient();
      if (client) {
        const { data, error } = await (client as any).rpc("match_chunks", {
          query_embedding: queryVector,
          match_threshold: threshold,
          match_count: limit,
          filter_source_types: allowedTypes || null,
        });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const rowsNeedingMeta = (data as any[]).filter(
            (r) => !r.title || !r.slug
          );
          const metaMap =
            rowsNeedingMeta.length > 0
              ? await this.hydrateSourceMetadata(client, rowsNeedingMeta)
              : new Map<string, SourceMeta>();

          const results: VectorSearchResult[] = [];
          for (const row of data as any[]) {
            const cached = EmbeddingService.memoryChunkIndex.get(row.chunk_id);
            const hydratedMeta = metaMap.get(`${row.source_type}:${row.source_id}`);

            const status: "published" | "draft" | "archived" =
              row.status ||
              hydratedMeta?.status ||
              cached?.status ||
              "published";

            if (!includeDrafts && status !== "published") {
              continue;
            }

            const slug = row.slug || hydratedMeta?.slug || cached?.slug || row.source_id;
            const title = row.title || hydratedMeta?.title || cached?.title || slug;
            const url =
              row.url ||
              hydratedMeta?.url ||
              cached?.url ||
              buildSourceUrl(row.source_type, slug);

            const chunk: ContentChunk = cached
              ? {
                  ...cached,
                  title,
                  slug,
                  url,
                  status,
                }
              : {
                  id: row.chunk_id,
                  sourceType: row.source_type as NormalizedSourceType,
                  sourceId: row.source_id,
                  title,
                  slug,
                  chunkIndex: row.chunk_index ?? 0,
                  content: row.content,
                  tokenCount: row.token_count ?? 0,
                  contentHash: "",
                  url,
                  status,
                };

            results.push({
              chunk,
              similarity: row.similarity,
            });
          }
          if (results.length > 0) {
            return results.slice(0, limit);
          }
        }
      }
    } catch (err) {
      logger.warn("Database vector search unavailable, falling back to memory index", {
        error: String(err),
      });
    }

    // In-memory vector index fallback (primarily for isolated tests)
    const candidates: VectorSearchResult[] = [];

    for (const [chunkId, chunkVec] of EmbeddingService.memoryVectorIndex.entries()) {
      const chunk = EmbeddingService.memoryChunkIndex.get(chunkId);
      if (!chunk) continue;

      if (!includeDrafts && chunk.status !== "published") continue;
      if (allowedTypes && !allowedTypes.includes(chunk.sourceType)) continue;

      const sim = cosineSimilarity(queryVector, chunkVec);
      if (sim >= threshold) {
        candidates.push({ chunk, similarity: sim });
      }
    }

    candidates.sort((a, b) => b.similarity - a.similarity);
    return candidates.slice(0, limit);
  }

  static clearMemoryCache(): void {
    EmbeddingService.memoryChunkIndex.clear();
    EmbeddingService.memoryVectorIndex.clear();
  }

  static getIndexStats(): { chunkCount: number; vectorCount: number } {
    return {
      chunkCount: EmbeddingService.memoryChunkIndex.size,
      vectorCount: EmbeddingService.memoryVectorIndex.size,
    };
  }
}
