/**
 * VictorOS Intelligence Layer — Embeddings Service
 * Orchestrates content normalization, deterministic chunking, vector generation,
 * persistence in Supabase pgvector, and high-performance hybrid memory caching.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/types";
import { createSupabaseAdminClient } from "../../supabase/admin";
import {
  type NormalizedDocument,
  type ContentChunk,
  type EmbeddingProvider,
} from "./types";
import { chunkDocument } from "./chunker";
import { getEmbeddingProvider, cosineSimilarity } from "./provider";
import { logger } from "../../shared/logger";
import { AppError } from "../../shared/errors";

export interface VectorSearchResult {
  chunk: ContentChunk;
  similarity: number;
}

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private clientPromise?: Promise<SupabaseClient<Database>> | SupabaseClient<Database>;
  
  // High-performance in-memory vector cache for instant zero-latency retrieval
  // and offline resilience
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
    try {
      if (this.clientPromise) {
        return await this.clientPromise;
      }
      return await createSupabaseAdminClient();
    } catch {
      // Admin client might be unavailable if SUPABASE_SERVICE_ROLE_KEY is missing
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
      // Check if chunk exists in memory with identical hash
      const existing = EmbeddingService.memoryChunkIndex.get(chunk.id);
      const existingVec = EmbeddingService.memoryVectorIndex.get(chunk.id);

      if (!existing || existing.contentHash !== chunk.contentHash || !existingVec) {
        chunksToEmbed.push(chunk);
        // Include source context in embedding input for enhanced semantic grounding
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

        // Store in memory index
        EmbeddingService.memoryChunkIndex.set(chunk.id, chunk);
        EmbeddingService.memoryVectorIndex.set(chunk.id, vector);
      }

      // Persist to Supabase if database connection is available
      await this.persistChunksToDatabase(chunksToEmbed, vectors);
    } else {
      // Even if already embedded, ensure all chunks are in memory
      for (const chunk of chunks) {
        EmbeddingService.memoryChunkIndex.set(chunk.id, chunk);
      }
    }

    return chunks;
  }

  /**
   * Persists chunk records and vector embeddings into Supabase tables
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

        // Upsert chunk into content_chunks table
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
          logger.warn("Could not persist chunk to database (continuing with memory cache)", {
            chunkId: chunk.id,
            error: chunkErr.message,
          });
          continue;
        }

        // Upsert vector into embeddings table
        await client.from("embeddings").upsert(
          {
            chunk_id: chunk.id,
            embedding: vector,
            model: this.provider.name,
          },
          { onConflict: "chunk_id" }
        );
      }
    } catch (err) {
      logger.warn("Database vector persistence skipped", { error: String(err) });
    }
  }

  /**
   * Updates embeddings for a document, purging stale chunks no longer present.
   */
  async updateDocumentEmbeddings(doc: NormalizedDocument): Promise<ContentChunk[]> {
    await this.deleteDocumentEmbeddings(doc.sourceType, doc.sourceId);
    return await this.embedDocument(doc);
  }

  /**
   * Removes all chunk and embedding records for a given entity.
   */
  async deleteDocumentEmbeddings(
    sourceType: string,
    sourceId: string
  ): Promise<void> {
    // 1. Purge from memory index
    for (const [chunkId, chunk] of EmbeddingService.memoryChunkIndex.entries()) {
      if (chunk.sourceType === sourceType && chunk.sourceId === sourceId) {
        EmbeddingService.memoryChunkIndex.delete(chunkId);
        EmbeddingService.memoryVectorIndex.delete(chunkId);
      }
    }

    // 2. Purge from Supabase if available
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
   * Performs semantic k-Nearest Neighbors search using cosine similarity
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

    // Try Supabase pgvector RPC first if available
    try {
      const client = await this.getAdminClient();
      if (client) {
        const { data, error } = await (client as any).rpc("match_chunks", {
          query_embedding: queryVector,
          match_threshold: threshold,
          match_count: limit,
          filter_source_types: allowedTypes || null,
        });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const results: VectorSearchResult[] = [];
          for (const row of data as any[]) {
            const memoryChunk = EmbeddingService.memoryChunkIndex.get(row.chunk_id);
            if (memoryChunk) {
              if (!includeDrafts && memoryChunk.status !== "published") continue;
              results.push({
                chunk: memoryChunk,
                similarity: row.similarity,
              });
            }
          }
          if (results.length > 0) return results;
        }
      }
    } catch {
      // Fall through to memory vector index
    }

    // High-performance fallback: scan in-memory index
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

  /**
   * In-memory index status helper
   */
  static getIndexStats(): { chunkCount: number; vectorCount: number } {
    return {
      chunkCount: EmbeddingService.memoryChunkIndex.size,
      vectorCount: EmbeddingService.memoryVectorIndex.size,
    };
  }
}
