/**
 * VictorOS Intelligence Layer — Search Ranking & Score Fusion
 * Implements deterministic Reciprocal Rank Fusion (RRF) combined with weighted linear blending.
 */

import type { SearchResult } from "./types";

export interface RankingWeights {
  lexicalWeight?: number;
  semanticWeight?: number;
  rrfConstant?: number;
  hybridBoost?: number;
}

const DEFAULT_WEIGHTS: Required<RankingWeights> = {
  lexicalWeight: 0.45,
  semanticWeight: 0.55,
  rrfConstant: 60,
  hybridBoost: 1.15,
};

/**
 * Merges and re-ranks lexical and semantic search candidate lists into a single ranked result set.
 */
export function rankSearchResults(
  lexicalResults: SearchResult[],
  semanticResults: SearchResult[],
  weights?: RankingWeights
): SearchResult[] {
  const opts = { ...DEFAULT_WEIGHTS, ...weights };
  const candidateMap = new Map<
    string,
    {
      result: SearchResult;
      lexicalRank?: number;
      lexicalScore: number;
      semanticRank?: number;
      semanticScore: number;
    }
  >();

  // 1. Index lexical results
  lexicalResults.forEach((item, index) => {
    const key = `${item.sourceType}:${item.sourceId}`;
    candidateMap.set(key, {
      result: item,
      lexicalRank: index + 1,
      lexicalScore: item.score,
      semanticScore: 0,
    });
  });

  // 2. Index semantic results
  semanticResults.forEach((item, index) => {
    const key = `${item.sourceType}:${item.sourceId}`;
    const existing = candidateMap.get(key);

    if (existing) {
      existing.semanticRank = index + 1;
      existing.semanticScore = item.score;
      // Prefer semantic excerpt if richer
      if (item.excerpt && item.excerpt.length > existing.result.excerpt.length) {
        existing.result.excerpt = item.excerpt;
      }
    } else {
      candidateMap.set(key, {
        result: item,
        semanticRank: index + 1,
        semanticScore: item.score,
        lexicalScore: 0,
      });
    }
  });

  // 3. Compute composite scores
  const ranked: SearchResult[] = [];

  for (const candidate of candidateMap.values()) {
    let rrf = 0;
    if (candidate.lexicalRank !== undefined) {
      rrf += 1 / (opts.rrfConstant + candidate.lexicalRank);
    }
    if (candidate.semanticRank !== undefined) {
      rrf += 1 / (opts.rrfConstant + candidate.semanticRank);
    }

    // Normalized linear score blend
    let composite =
      candidate.lexicalScore * opts.lexicalWeight +
      candidate.semanticScore * opts.semanticWeight;

    // Both match types boost
    const isHybrid = candidate.lexicalRank !== undefined && candidate.semanticRank !== undefined;
    if (isHybrid) {
      composite *= opts.hybridBoost;
    }

    const finalScore = Number(Math.min(1.0, composite + rrf * 10).toFixed(3));

    ranked.push({
      ...candidate.result,
      score: finalScore,
      matchType: isHybrid ? "hybrid" : candidate.result.matchType,
    });
  }

  // 4. Sort descending by composite score
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
