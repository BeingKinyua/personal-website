/**
 * VictorOS Intelligence Layer — Dr. Doom Main Service
 * Orchestrates intent classification, grounded retrieval, context assembly,
 * LLM generation, response validation, and conversation tracking.
 */

import { z } from "zod";
import { type DoomResponse, DoomResponseSchema, sanitizeDoomResponse } from "./response";
import { classifyIntent, type IntentClassification } from "./intent";
import { DoomRetrievalService, type EvidenceItem } from "./retrieval";
import { assembleDoomPrompt, type ConversationTurn } from "./context";
import { DOOM_SYSTEM_INSTRUCTION } from "./prompts/system";
import { DOOM_NAVIGATION_GUIDELINES } from "./prompts/navigation";
import { DOOM_KNOWLEDGE_GUIDELINES } from "./prompts/knowledge";
import { getAIProvider, type AIModelProvider } from "../provider";
import { ConversationService } from "../conversations/service";
import { ValidationError } from "../../shared/errors";
import { logger } from "../../shared/logger";

export const DoomServiceInputSchema = z.object({
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

export type DoomServiceInput = z.infer<typeof DoomServiceInputSchema>;

export class DoomService {
  private retrievalService: DoomRetrievalService;
  private conversationService: ConversationService;
  private aiProvider: AIModelProvider;

  constructor(
    retrievalService?: DoomRetrievalService,
    conversationService?: ConversationService,
    aiProvider?: AIModelProvider
  ) {
    this.retrievalService = retrievalService || new DoomRetrievalService();
    this.conversationService = conversationService || new ConversationService();
    this.aiProvider = aiProvider || getAIProvider();
  }

  async ask(rawInput: DoomServiceInput): Promise<DoomResponse> {
    const startTime = Date.now();
    const input = DoomServiceInputSchema.parse(rawInput);
    const query = input.message.trim();
    const sessionId = input.sessionId || "anonymous_session";

    logger.info("Dr. Doom inquiry received", {
      query: query.slice(0, 100),
      sessionId,
      conversationId: input.conversationId,
    });

    // 1. Intent Classification
    const classification: IntentClassification = classifyIntent(query);
    logger.info("Dr. Doom intent classified", {
      intent: classification.intent,
      confidence: classification.confidence,
    });

    // 2. Grounded Retrieval
    const evidence: EvidenceItem[] = await this.retrievalService.retrieveEvidence(
      query,
      classification
    );

    // 3. Conversation History (if existing conversation)
    const historyTurns: ConversationTurn[] = [];
    if (input.conversationId) {
      try {
        const messages = await this.conversationService.listMessages(
          input.conversationId,
          4
        );
        for (const m of messages) {
          if (m.role === "user" || m.role === "assistant") {
            historyTurns.push({ role: m.role, content: m.content });
          }
        }
      } catch (err) {
        logger.warn("Could not fetch conversation history", { error: String(err) });
      }
    }

    // 4. Context & Prompt Assembly
    const userPrompt = assembleDoomPrompt(
      query,
      classification,
      evidence,
      historyTurns
    );

    let systemInstruction = DOOM_SYSTEM_INSTRUCTION;
    if (classification.intent === "navigation") {
      systemInstruction += `\n\n${DOOM_NAVIGATION_GUIDELINES}`;
    } else if (
      classification.intent === "knowledge_question" ||
      classification.intent === "technology_question"
    ) {
      systemInstruction += `\n\n${DOOM_KNOWLEDGE_GUIDELINES}`;
    }

    // 5. LLM Structured Generation
    let response: DoomResponse;
    try {
      response = await this.aiProvider.generateStructured(
        userPrompt,
        DoomResponseSchema,
        {
          systemInstruction,
          temperature: 0.25,
          maxOutputTokens: 2048,
        }
      );
    } catch (err) {
      logger.warn("Primary LLM structured generation failed, using sanitized fallback", {
        error: String(err),
      });
      response = sanitizeDoomResponse({
        message:
          evidence.length > 0
            ? `I have evaluated Victor's records for "${query}". Key relevant systems include ${evidence
                .slice(0, 2)
                .map((e) => e.title)
                .join(" and ")}.`
            : `I have analyzed Victor's architecture records for "${query}". Explore Victor's Work, Journal, or Lab modules to examine these systems in detail.`,
        references: evidence.map((e) => ({
          type: e.sourceType,
          id: e.slug || e.sourceId,
          title: e.title,
          slug: e.slug,
        })),
        actions:
          classification.suggestedAction
            ? [classification.suggestedAction]
            : [{ label: "Examine Work", action: "navigate", target: "work" }],
        intent: classification.intent,
      });
    }

    // Ensure actions exist for navigation queries if the model omitted them
    if (classification.suggestedAction && (!response.actions || response.actions.length === 0)) {
      response.actions = [classification.suggestedAction as any];
    }

    // 6. Conversation Persistence
    if (input.conversationId) {
      try {
        await this.conversationService.addMessage(
          input.conversationId,
          "user",
          query
        );
        await this.conversationService.addMessage(
          input.conversationId,
          "assistant",
          response.message,
          {
            references: response.references,
            actions: response.actions,
            intent: response.intent,
          }
        );
      } catch (err) {
        logger.warn("Could not persist conversation turn", { error: String(err) });
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info("Dr. Doom inquiry completed", {
      intent: response.intent,
      referenceCount: response.references.length,
      actionCount: response.actions.length,
      durationMs,
    });

    return response;
  }
}
