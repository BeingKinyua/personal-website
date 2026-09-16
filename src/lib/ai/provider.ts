/**
 * VictorOS Intelligence Layer — LLM Provider Abstraction
 * Supports Google Gemini (gemini-3.8-flash) with structured Zod parsing
 * and a grounded fallback engine for offline/test environments.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getServerEnv } from "../shared/env";
import { logger } from "../shared/logger";
import { AppError } from "../shared/errors";

export class AIProviderError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "AI_PROVIDER_ERROR", 500, details);
    this.name = "AIProviderError";
  }
}

export interface AIGenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
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

/**
 * Production Gemini Provider using `@google/genai`
 * Model: gemini-3.8-flash
 */
export class GeminiAIProvider implements AIModelProvider {
  readonly name = "gemini-3.8-flash";
  private client: GoogleGenAI | null = null;

  constructor(private apiKey?: string) {}

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    const key = this.apiKey || getServerEnv().geminiApiKey;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new AIProviderError("Gemini API key is not configured.");
    }
    this.client = new GoogleGenAI({ apiKey: key });
    return this.client;
  }

  async generateText(prompt: string, options: AIGenerationOptions = {}): Promise<string> {
    try {
      const client = this.getClient();
      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 1024,
        },
      });

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
      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
          responseMimeType: "application/json",
        },
      });

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
 * High-fidelity fallback AI provider for development and offline testing.
 * Synthesizes grounded, theatrical Dr. Doom responses from retrieved prompt context.
 */
export class DeterministicDoomFallbackProvider implements AIModelProvider {
  readonly name = "doom-grounded-fallback";

  async generateText(prompt: string): Promise<string> {
    return `[DR. DOOM]: Intelligence queries must pass through structured validation. Received query payload: ${prompt.slice(0, 100)}...`;
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>
  ): Promise<T> {
    // Extract context clues from prompt
    const hasEvidence = prompt.includes("SOURCE EVIDENCE:");
    const queryMatch = prompt.match(/USER QUERY:\s*([^\n]+)/i);
    const userQuery = queryMatch ? queryMatch[1].trim() : "Unknown query";

    let message = "DR. DOOM online. I have evaluated Victor's architectural index regarding your inquiry.";
    const actions: Array<{ label: string; action: string; target?: string }> = [];
    const references: Array<{ type: string; id: string; title: string; slug?: string; badge?: string }> = [];

    if (hasEvidence) {
      // Parse evidence snippets included in the prompt
      const sourceMatches = [...prompt.matchAll(/\[EVIDENCE\s+\d+\]\s+\[(.*?)\]\s+(.*?)\s+\(URL:\s*(.*?)\)/g)];
      
      if (sourceMatches.length > 0) {
        message = `I have examined Victor's system records regarding "${userQuery}". ${sourceMatches.length} primary verified sources substantiate this architecture:\n\n`;
        
        for (const sm of sourceMatches.slice(0, 3)) {
          const type = sm[1].toLowerCase();
          const title = sm[2];
          const url = sm[3];
          const slug = url.split("/").pop()?.replace("#", "") || "";

          message += `• **${title}** (${type.toUpperCase()}): Documented in Victor's primary registry.\n`;

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
          } else {
            actions.push({ label: `View ${title}`, action: "navigate", target: type });
          }
        }

        message += `\nEvery component operates with deterministic verification and deliberate architectural boundaries.`;
      }
    } else {
      message = `I have searched Victor's architecture index for "${userQuery}". While no direct operational documents matched with high confidence, Victor's primary work spans distributed systems, machine learning engineering, and full-stack software architecture.`;
      actions.push(
        { label: "Inspect AI & Systems Work", action: "navigate", target: "work" },
        { label: "Browse Technical Journal", action: "navigate", target: "journal" },
        { label: "View Active Lab Experiments", action: "navigate", target: "lab" }
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
    };

    return schema.parse(payload);
  }
}

let activeAIProvider: AIModelProvider | null = null;

export function getAIProvider(): AIModelProvider {
  if (activeAIProvider) return activeAIProvider;

  const serverEnv = getServerEnv();
  const hasGemini = Boolean(
    serverEnv.geminiApiKey && serverEnv.geminiApiKey !== "MY_GEMINI_API_KEY"
  );

  if (hasGemini) {
    try {
      activeAIProvider = new GeminiAIProvider(serverEnv.geminiApiKey);
      logger.info("Initialized Gemini AI Provider (gemini-3.8-flash)");
      return activeAIProvider;
    } catch (err) {
      logger.warn("Failed to initialize Gemini AI provider, using fallback", {
        error: String(err),
      });
    }
  }

  activeAIProvider = new DeterministicDoomFallbackProvider();
  logger.info("Initialized Deterministic Doom Fallback Provider");
  return activeAIProvider;
}
