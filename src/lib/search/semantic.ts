/**
 * VictorOS Intelligence Layer — Semantic Search
 * Performs dense vector similarity search over content chunk embeddings
 * with document-level deduplication and relevance ranking.
 */

import type { SearchOptions, SearchResult, SearchSourceType } from "./types";
import { EmbeddingService } from "../ai/embeddings/service";
import { getEmbeddingProvider } from "../ai/embeddings/provider";
import { logger } from "../shared/logger";

export class SemanticSearchService {
  private embeddingService: EmbeddingService;
  private provider = getEmbeddingProvider();

  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || new EmbeddingService(this.provider);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const rawQuery = options.query.trim();
    if (!rawQuery) return [];

    const limit = options.limit ?? 10;
    const threshold = options.threshold ?? 0.35;
    const allowedTypes = options.sourceTypes;
    const includeDrafts = options.includeDrafts ?? false;

    try {
      // 1. Generate dense query embedding vector
      const queryVector = await this.provider.embedText(rawQuery);

      // 2. Query nearest neighbor chunks
      const chunkResults = await this.embeddingService.searchSimilar(queryVector, {
        limit: limit * 3, // Over-fetch for document deduplication
        threshold,
        sourceTypes: allowedTypes,
        includeDrafts,
      });

      // 3. Deduplicate by entity sourceId, keeping highest-scoring chunk
      const seenEntities = new Map<string, SearchResult>();

      for (const res of chunkResults) {
        const chunk = res.chunk;
        const key = `${chunk.sourceType}:${chunk.sourceId}`;

        if (!seenEntities.has(key)) {
          seenEntities.set(key, {
            sourceType: chunk.sourceType as SearchSourceType,
            sourceId: chunk.sourceId,
            title: chunk.title,
            slug: chunk.slug,
            excerpt: chunk.content.slice(0, 240) + (chunk.content.length > 240 ? "..." : ""),
            score: Number(res.similarity.toFixed(3)),
            matchType: "semantic",
            url: chunk.url,
            sectionTitle: chunk.sectionTitle,
            metadata: chunk.metadata,
          });
        }
      }

      const results = Array.from(seenEntities.values());
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (err) {
      logger.error("Semantic search failed", { error: String(err), query: rawQuery });
      return [];
    }
  }
}
