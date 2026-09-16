/**
 * VictorOS Intelligence Layer — Hybrid Search Service
 * Coordinates parallel lexical and semantic retrieval with reciprocal rank fusion.
 */

import type { SearchOptions, SearchResult } from "./types";
import { LexicalSearchService } from "./lexical";
import { SemanticSearchService } from "./semantic";
import { rankSearchResults } from "./ranking";
import { logger } from "../shared/logger";

export class HybridSearchService {
  private lexicalService: LexicalSearchService;
  private semanticService: SemanticSearchService;

  constructor(
    lexicalService?: LexicalSearchService,
    semanticService?: SemanticSearchService
  ) {
    this.lexicalService = lexicalService || new LexicalSearchService();
    this.semanticService = semanticService || new SemanticSearchService();
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const startTime = Date.now();
    const query = options.query?.trim();

    if (!query) {
      return [];
    }

    const limit = options.limit ?? 10;

    // Execute lexical and semantic retrieval concurrently
    const [lexicalOutcome, semanticOutcome] = await Promise.allSettled([
      this.lexicalService.search({ ...options, limit: limit * 2 }),
      this.semanticService.search({ ...options, limit: limit * 2 }),
    ]);

    const lexicalResults =
      lexicalOutcome.status === "fulfilled" ? lexicalOutcome.value : [];
    const semanticResults =
      semanticOutcome.status === "fulfilled" ? semanticOutcome.value : [];

    if (lexicalOutcome.status === "rejected") {
      logger.warn("Lexical search branch failed", { error: String(lexicalOutcome.reason) });
    }
    if (semanticOutcome.status === "rejected") {
      logger.warn("Semantic search branch failed", { error: String(semanticOutcome.reason) });
    }

    // Blend and rank results
    const rankedResults = rankSearchResults(lexicalResults, semanticResults);
    const finalResults = rankedResults.slice(0, limit);

    const durationMs = Date.now() - startTime;
    logger.info("Hybrid search completed", {
      query,
      durationMs,
      lexicalCount: lexicalResults.length,
      semanticCount: semanticResults.length,
      returnedCount: finalResults.length,
    });

    return finalResults;
  }
}
