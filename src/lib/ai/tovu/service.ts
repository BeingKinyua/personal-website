/**
 * Tovu Intelligence Layer — Main Service
 * Orchestrates intent classification, grounded retrieval, context assembly,
 * LLM generation, response grounding validation, and conversation tracking.
 */

import { z } from "zod";
import {
  type TovuResponse,
  TovuResponseSchema,
  groundTovuResponse,
  sanitizeTovuResponse,
} from "./response";
import { classifyIntent, type IntentClassification } from "./intent";
import { TovuRetrievalService, type EvidenceItem } from "./retrieval";
import { assembleTovuPrompt, type ConversationTurn } from "./context";
import { TOVU_SYSTEM_INSTRUCTION } from "./prompts/system";
import { TOVU_NAVIGATION_GUIDELINES } from "./prompts/navigation";
import { TOVU_KNOWLEDGE_GUIDELINES } from "./prompts/knowledge";
import { getAIProvider, type AIModelProvider } from "../provider";
import { ConversationService } from "../conversations/service";
import { ValidationError } from "../../shared/errors";
import { logger } from "../../shared/logger";

export const TovuServiceInputSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message exceeds 1000 characters"),
  conversationId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  context: z
    .object({
      route: z.string().optional(),
      module: z.string().optional(),
    })
    .optional(),
});

export type TovuServiceInput = z.infer<typeof TovuServiceInputSchema>;

export class TovuService {
  private retrievalService: TovuRetrievalService;
  private conversationService: ConversationService;
  private aiProvider: AIModelProvider;

  constructor(
    retrievalService?: TovuRetrievalService,
    conversationService?: ConversationService,
    aiProvider?: AIModelProvider
  ) {
    this.retrievalService = retrievalService || new TovuRetrievalService();
    this.conversationService = conversationService || new ConversationService();
    this.aiProvider = aiProvider || getAIProvider();
  }

  async ask(rawInput: TovuServiceInput): Promise<TovuResponse> {
    const startTime = Date.now();
    const input = TovuServiceInputSchema.parse(rawInput);
    const query = input.message.trim();
    const sessionId = input.sessionId?.trim();

    if (!sessionId) {
      throw new ValidationError("A verified visitor session is required.");
    }

    logger.info("Tovu inquiry received", {
      query: query.slice(0, 100),
      conversationId: input.conversationId,
      hasUser: Boolean(input.userId),
    });

    // Enforce conversation ownership BEFORE retrieving history, generating LLM output, or appending messages
    let activeConversationId = input.conversationId?.trim() || undefined;
    const historyTurns: ConversationTurn[] = [];

    if (activeConversationId) {
      await this.conversationService.getConversation(
        activeConversationId,
        sessionId,
        input.userId
      );

      try {
        const messages = await this.conversationService.listMessages(activeConversationId, 6);
        for (const m of messages) {
          if (m.role === "user" || m.role === "assistant") {
            historyTurns.push({ role: m.role, content: m.content });
          }
        }
      } catch (err) {
        logger.warn("Could not fetch conversation history", { error: String(err) });
      }
    } else {
      try {
        const created = await this.conversationService.createConversation({
          sessionId,
          userId: input.userId,
          title: query.slice(0, 80),
        });
        activeConversationId = created.id;
      } catch (err) {
        logger.warn("Could not initialize conversation record", { error: String(err) });
      }
    }

    // 1. Intent Classification
    const classification: IntentClassification = classifyIntent(query);
    logger.info("Tovu intent classified", {
      intent: classification.intent,
      confidence: classification.confidence,
    });

    // 2. Grounded Retrieval
    const evidence: EvidenceItem[] = await this.retrievalService.retrieveEvidence(
      query,
      classification
    );

    // 3. Context & Prompt Assembly
    const userPrompt = assembleTovuPrompt(
      query,
      classification,
      evidence,
      historyTurns
    );

    let systemInstruction = TOVU_SYSTEM_INSTRUCTION;
    if (classification.intent === "navigation") {
      systemInstruction += `\n\n${TOVU_NAVIGATION_GUIDELINES}`;
    } else if (
      classification.intent === "knowledge_question" ||
      classification.intent === "technology_question"
    ) {
      systemInstruction += `\n\n${TOVU_KNOWLEDGE_GUIDELINES}`;
    }

    // 4. LLM Structured Generation (no unsupported Gemini 4 temperature parameters)
    let fallbackUsed = this.aiProvider.name === "tovu-grounded-fallback";
    let response: TovuResponse;

    try {
      response = await this.aiProvider.generateStructured(
        userPrompt,
        TovuResponseSchema,
        {
          systemInstruction,
          maxOutputTokens: 2048,
        }
      );
      if (response.fallbackUsed) {
        fallbackUsed = true;
      }
    } catch (err) {
      fallbackUsed = true;
      logger.warn("Primary LLM structured generation failed, using grounded fallback", {
        error: String(err),
      });
      response = sanitizeTovuResponse({
        message:
          evidence.length > 0
            ? `I have evaluated the architecture records for "${query}". Key relevant systems include ${evidence
                .slice(0, 2)
                .map((e) => e.title)
                .join(" and ")}.`
            : `My architectural records do not contain verified documentation matching "${query}". Explore the Work, Journal, or Lab modules to inspect documented systems.`,
        references: evidence.map((e) => ({
          type: e.sourceType,
          id: e.sourceId,
          title: e.title,
          slug: e.slug,
        })),
        actions:
          classification.suggestedAction
            ? [classification.suggestedAction]
            : [{ label: "Examine Work", action: "navigate", target: "work" }],
        intent: classification.intent,
        fallbackUsed: true,
      });
    }

    // 5. Strict Grounding Enforcement (strip hallucinated slugs, routes, or non-existent references)
    response = groundTovuResponse(response, evidence, classification.suggestedAction);

    // 6. Conversation Persistence
    let persistenceStatus: "persisted" | "ephemeral" | "failed" = "ephemeral";
    if (activeConversationId) {
      try {
        await this.conversationService.addMessage(activeConversationId, "user", query);
        await this.conversationService.addMessage(
          activeConversationId,
          "assistant",
          response.message,
          {
            references: response.references,
            actions: response.actions,
            intent: response.intent,
            fallbackUsed,
          }
        );
        persistenceStatus = "persisted";
      } catch (err) {
        persistenceStatus = "failed";
        logger.warn("Could not persist conversation turn", { error: String(err) });
      }
    }

    response = {
      ...response,
      conversationId: activeConversationId,
      fallbackUsed,
      persistenceStatus,
    };

    const durationMs = Date.now() - startTime;
    logger.info("Tovu inquiry completed", {
      intent: response.intent,
      conversationId: activeConversationId,
      fallbackUsed,
      persistenceStatus,
      referenceCount: response.references.length,
      actionCount: response.actions.length,
      durationMs,
    });

    return response;
  }
}
