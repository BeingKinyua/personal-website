/**
 * Tovu Intelligence Layer — LLM Provider Abstraction
 * Supports Google Gemini (gemini-4-hydrogen) with structured Zod parsing
 * and a grounded fallback engine for offline/test environments.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getServerEnv } from "../shared/env";
import { logger } from "../shared/logger";
import { AppError } from "../shared/errors";

const DEFAULT_GENERATION_TIMEOUT_MS = 20_000;
export const GEMINI_GENERATION_MODEL = "gemini-4-hydrogen";

export class AIProviderError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "AI_PROVIDER_ERROR", 500, details);
    this.name = "AIProviderError";
  }
}

export interface AIGenerationOptions {
  maxOutputTokens?: number;
  systemInstruction?: string;
  timeoutMs?: number;
}

export interface AIModelProvider {
  readonly name: string;
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;
  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AIGenerationOptions
  ): Promise<T>;
}

/**
 * Extracts raw JSON from potential markdown code fences (```json ... ```)
 */
export function extractJsonFromText(rawText: string): string {
  const trimmed = rawText.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  return trimmed;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AIProviderError(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Production Gemini Provider using `@google/genai`
 * Model: gemini-4-hydrogen (do not pass temperature/topP/topK/candidateCount per Gemini 4 constraints)
 */
export class GeminiAIProvider implements AIModelProvider {
  readonly name = GEMINI_GENERATION_MODEL;
  private client: GoogleGenAI | null = null;

  constructor(private apiKey?: string) {}

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    const key = this.apiKey || getServerEnv().geminiApiKey;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new AIProviderError("Gemini API key is not configured.");
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

  async generateText(prompt: string, options: AIGenerationOptions = {}): Promise<string> {
    try {
      const client = this.getClient();
      const timeoutMs = options.timeoutMs ?? DEFAULT_GENERATION_TIMEOUT_MS;
      const response = await withTimeout(
        client.models.generateContent({
          model: GEMINI_GENERATION_MODEL,
          contents: prompt,
          config: {
            systemInstruction: options.systemInstruction,
            maxOutputTokens: options.maxOutputTokens ?? 1024,
          },
        }),
        timeoutMs,
        "Gemini text generation"
      );

      const text = response.text;
      if (!text) {
        throw new AIProviderError("Gemini returned empty text response");
      }
      return text;
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      logger.error("Gemini text generation failed", { error: String(err) });
      throw new AIProviderError(`Gemini generation error: ${String(err)}`);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: AIGenerationOptions = {}
  ): Promise<T> {
    try {
      const client = this.getClient();
      const timeoutMs = options.timeoutMs ?? DEFAULT_GENERATION_TIMEOUT_MS;
      const response = await withTimeout(
        client.models.generateContent({
          model: GEMINI_GENERATION_MODEL,
          contents: prompt,
          config: {
            systemInstruction: options.systemInstruction,
            maxOutputTokens: options.maxOutputTokens ?? 2048,
            responseMimeType: "application/json",
          },
        }),
        timeoutMs,
        "Gemini structured generation"
      );

      const raw = response.text || "";
      const jsonStr = extractJsonFromText(raw);
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.error("Structured response failed Zod schema validation", {
          errors: err.issues,
        });
        throw new AIProviderError("Model response did not adhere to required JSON schema", {
          issues: err.issues,
        });
      }
      if (err instanceof AIProviderError) throw err;
      logger.error("Structured generation failed", { error: String(err) });
      throw new AIProviderError(`Structured generation error: ${String(err)}`);
    }
  }
}

/**
 * Grounded fallback AI provider for development and offline/missing-key environments.
 * Synthesizes grounded, architectural Tovu responses strictly from retrieved prompt evidence.
 */
export class DeterministicTovuFallbackProvider implements AIModelProvider {
  readonly name = "tovu-grounded-fallback";

  async generateText(prompt: string): Promise<string> {
    return `[TOVU]: Intelligence queries must pass through structured validation. Received query payload: ${prompt.slice(0, 100)}...`;
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>
  ): Promise<T> {
    const hasEvidence = prompt.includes("VERIFIED SOURCE EVIDENCE") || prompt.includes("SOURCE EVIDENCE:");
    const queryMatch = prompt.match(/USER QUERY:\s*([^\n]+)/i);
    const userQuery = queryMatch ? queryMatch[1].trim() : "Unknown query";

    let message = "Tovu online. I have evaluated the architectural index regarding your inquiry.";
    const actions: Array<{ label: string; action: string; target?: string }> = [];
    const references: Array<{ type: string; id: string; title: string; slug?: string; badge?: string }> = [];

    const sourceMatches = hasEvidence
      ? [...prompt.matchAll(/\[EVIDENCE\s+\d+\]\s+\[(.*?)\]\s+(.*?)\s+\(URL:\s*(.*?)\)/g)]
      : [];

    if (sourceMatches.length > 0) {
      message = `I have examined the system records regarding "${userQuery}". ${sourceMatches.length} retrieved sources substantiate this architecture:\n\n`;

      for (const sm of sourceMatches.slice(0, 3)) {
        const type = sm[1].toLowerCase();
        const title = sm[2];
        const url = sm[3];
        const slug = url.split("/").pop()?.replace("#", "") || "";

        message += `• **${title}** (${type.toUpperCase()}): Documented in the primary registry.\n`;

        references.push({
          type: (["project", "article", "lab", "concept"].includes(type) ? type : "project") as any,
          id: slug || title,
          title,
          slug,
          badge: type.toUpperCase(),
        });

        if (type === "project") {
          actions.push({ label: `Inspect ${title}`, action: "open_project", target: slug });
        } else if (type === "article") {
          actions.push({ label: `Read ${title}`, action: "open_article", target: slug });
        } else if (type === "lab") {
          actions.push({ label: `Explore Lab`, action: "navigate", target: "lab" });
        } else if (type === "concept") {
          actions.push({ label: `Explore Knowledge`, action: "navigate", target: "knowledge" });
        }
      }

      message += `\nEvery component operates with deterministic verification and deliberate architectural boundaries.`;
    } else {
      message = `My architectural records do not contain verified documentation matching "${userQuery}". You can explore Tovu's primary operational modules below.`;
      actions.push(
        { label: "Inspect Work", action: "navigate", target: "work" },
        { label: "Browse Journal", action: "navigate", target: "journal" },
        { label: "View Lab", action: "navigate", target: "lab" }
      );
    }

    if (actions.length === 0) {
      actions.push({ label: "Examine Work", action: "navigate", target: "work" });
    }

    const payload = {
      message,
      references,
      actions,
      intent: "retrieval_grounded",
      fallbackUsed: true,
    };

    return schema.parse(payload);
  }
}

let activeAIProvider: AIModelProvider | null = null;

export function resetAIProviderCache(): void {
  activeAIProvider = null;
}

export function getAIProvider(): AIModelProvider {
  if (activeAIProvider) return activeAIProvider;

  const serverEnv = getServerEnv();
  const hasGemini = Boolean(
    serverEnv.geminiApiKey && serverEnv.geminiApiKey !== "MY_GEMINI_API_KEY"
  );

  if (hasGemini) {
    try {
      activeAIProvider = new GeminiAIProvider(serverEnv.geminiApiKey);
      logger.info(`Initialized Gemini AI Provider (${GEMINI_GENERATION_MODEL})`);
      return activeAIProvider;
    } catch (err) {
      logger.warn("Failed to initialize Gemini AI provider, using fallback", {
        error: String(err),
      });
    }
  }

  activeAIProvider = new DeterministicTovuFallbackProvider();
  logger.info("Initialized Deterministic Tovu Fallback Provider");
  return activeAIProvider;
}
