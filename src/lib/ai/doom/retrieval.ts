/**
 * VictorOS Intelligence Layer — Dr. Doom Retrieval Service
 * Interfaces with HybridSearchService to acquire grounded evidence items.
 */

import type { SearchSourceType } from "../../search/types";
import { HybridSearchService } from "../../search/hybrid";
import type { IntentClassification } from "./intent";

export interface EvidenceItem {
  sourceType: SearchSourceType;
  sourceId: string;
  title: string;
  slug: string;
  url: string;
  sectionTitle?: string;
  content: string;
  score: number;
}

export class DoomRetrievalService {
  private searchService: HybridSearchService;

  constructor(searchService?: HybridSearchService) {
    this.searchService = searchService || new HybridSearchService();
  }

  async retrieveEvidence(
    query: string,
    classification: IntentClassification,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<EvidenceItem[]> {
    const limit = options.limit ?? 5;
    const threshold = options.threshold ?? 0.25;

    // 1. Initial targeted hybrid search using classified priority sources
    let searchResults = await this.searchService.search({
      query,
      sourceTypes: classification.prioritySources,
      limit,
      threshold,
      includeDrafts: false,
    });

    // 2. Broaden search if targeted results are sparse
    if (searchResults.length < 2 && classification.prioritySources.length < 4) {
      const broadResults = await this.searchService.search({
        query,
        limit,
        threshold: 0.2,
        includeDrafts: false,
      });

      // Merge and deduplicate by sourceId
      const seen = new Set(searchResults.map((r) => r.sourceId));
      for (const res of broadResults) {
        if (!seen.has(res.sourceId)) {
          searchResults.push(res);
          seen.add(res.sourceId);
        }
      }
    }

    // 3. Map into structured EvidenceItem records
    return searchResults.map((r) => ({
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      title: r.title,
      slug: r.slug,
      url: r.url,
      sectionTitle: r.sectionTitle,
      content: r.excerpt,
      score: r.score,
    }));
  }
}
