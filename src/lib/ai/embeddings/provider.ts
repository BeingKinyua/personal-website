/**
 * Tovu Intelligence Layer — Embeddings Provider Abstraction
 *
 * Implements Google Gemini gemini-embedding-2 (768 dimensions) with a deterministic
 * mathematical fallback provider for offline/testing environments.
 */

import { GoogleGenAI } from "@google/genai";
import type { EmbeddingProvider } from "./types";
import { getServerEnv } from "../../shared/env";
import { logger } from "../../shared/logger";
import { AppError } from "../../shared/errors";

export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_TIMEOUT_MS = 10_000;

export class EmbeddingProviderError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "EMBEDDING_PROVIDER_ERROR", 500, details);
    this.name = "EmbeddingProviderError";
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new EmbeddingProviderError(`Embedding request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * High-performance deterministic fallback embedding provider.
 * Projects text tokens into a 768-dimensional unit vector using n-gram frequency
 * and hash projections. Enables offline testing and RAG development when Gemini
 * credentials are unavailable.
 */
export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly name = "deterministic-local-768";
  readonly dimensions = 768;

  async embedText(text: string): Promise<number[]> {
    return this.generateVector(text);
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateVector(t));
  }

  private generateVector(text: string): number[] {
    const vec = new Float64Array(this.dimensions);
    const clean = text.toLowerCase().trim();
    if (!clean) return Array.from(vec);

    // 1. Tokenize into words and character tri-grams
    const tokens = clean.split(/[^a-z0-9_#+]+/);
    const ngrams: string[] = [...tokens];
    for (let i = 0; i < clean.length - 2; i += 2) {
      ngrams.push(clean.slice(i, i + 3));
    }

    // 2. Hash-project tokens into vector bins
    for (const token of ngrams) {
      if (!token) continue;
      let h1 = 0x811c9dc5;
      let h2 = 0x5bd1e995;
      for (let i = 0; i < token.length; i++) {
        const c = token.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 0x01000193);
        h2 = Math.imul(h2 ^ (c << 3), 0x5bd1e995);
      }
      const idx = Math.abs(h1) % this.dimensions;
      const weight = ((h2 & 0xff) / 255) * 2 - 1;
      vec[idx] += weight;
    }

    // 3. L2 Normalize vector to unit length
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vec[i] /= norm;
      }
    }

    return Array.from(vec);
  }
}

/**
 * Production Gemini Embedding Provider using `@google/genai`
 * Model: gemini-embedding-2 (768 dimensions)
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = GEMINI_EMBEDDING_MODEL;
  readonly dimensions = 768;
  private client: GoogleGenAI | null = null;
  private fallbackProvider = new DeterministicEmbeddingProvider();

  constructor(private apiKey?: string) {}

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    const key = this.apiKey || getServerEnv().geminiApiKey;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new EmbeddingProviderError(
        "Gemini API key is not configured. Falling back to local deterministic embedding provider."
      );
    }
    this.client = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    return this.client;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const client = this.getClient();
      const response = await withTimeout(
        client.models.embedContent({
          model: GEMINI_EMBEDDING_MODEL,
          contents: text,
          config: {
            outputDimensionality: 768,
          },
        }),
        EMBEDDING_TIMEOUT_MS
      );

      const values =
        response.embeddings?.[0]?.values ||
        (response as any).embedding?.values;

      if (!values || values.length === 0) {
        throw new EmbeddingProviderError("Gemini returned an empty embedding vector");
      }

      return values;
    } catch (err) {
      logger.warn("Gemini embedding generation failed, using deterministic fallback", {
        error: String(err),
      });
      return await this.fallbackProvider.embedText(text);
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const batchSize = 8;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((t) => this.embedText(t)));
      results.push(...batchResults);
    }

    return results;
  }
}

let activeProvider: EmbeddingProvider | null = null;

export function resetEmbeddingProviderCache(): void {
  activeProvider = null;
}

/**
 * Returns the configured embedding provider with automatic fallback.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  if (activeProvider) return activeProvider;

  const serverEnv = getServerEnv();
  const hasGemini = Boolean(
    serverEnv.geminiApiKey && serverEnv.geminiApiKey !== "MY_GEMINI_API_KEY"
  );

  if (hasGemini) {
    try {
      activeProvider = new GeminiEmbeddingProvider(serverEnv.geminiApiKey);
      logger.info(`Initialized Gemini Embedding Provider (${GEMINI_EMBEDDING_MODEL}, 768 dimensions)`);
      return activeProvider;
    } catch (err) {
      logger.warn("Failed to initialize Gemini embedding provider, falling back", {
        error: String(err),
      });
    }
  }

  activeProvider = new DeterministicEmbeddingProvider();
  logger.info("Initialized Deterministic Local Embedding Provider (768 dimensions)");
  return activeProvider;
}

/**
 * Computes cosine similarity between two unit vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
