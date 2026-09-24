/**
 * VictorOS Intelligence Layer — Conversation Management Service
 * Provides conversation persistence and strict user/session privacy isolation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/types";
import { createSupabaseAdminClient } from "../../supabase/admin";
import { isSupabaseConfigured } from "../../shared/env";
import { ForbiddenError, NotFoundError } from "../../shared/errors";
import { logger } from "../../shared/logger";

export interface ConversationRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export class ConversationService {
  private clientPromise?: Promise<SupabaseClient<Database>> | SupabaseClient<Database>;
  
  // In-memory fallback stores for offline/preview environments
  private static memoryConversations = new Map<string, ConversationRecord>();
  private static memoryMessages = new Map<string, MessageRecord[]>();

  constructor(client?: SupabaseClient<Database>) {
    if (client) {
      this.clientPromise = client;
    }
  }

  private async getClient(): Promise<SupabaseClient<Database> | null> {
    if (!isSupabaseConfigured(true)) return null;
    try {
      if (this.clientPromise) return await this.clientPromise;
      return await createSupabaseAdminClient();
    } catch {
      return null;
    }
  }

  /**
   * Creates a new conversation bound to a visitor sessionId and optional authenticated userId.
   */
  async createConversation(input: {
    sessionId: string;
    userId?: string;
    title?: string;
  }): Promise<ConversationRecord> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const record: ConversationRecord = {
      id,
      sessionId: input.sessionId,
      userId: input.userId || null,
      title: input.title || "Tovu Intelligence Query",
      createdAt: now,
      updatedAt: now,
    };

    try {
      const client = await this.getClient();
      if (client) {
        const { data, error } = await client
          .from("ai_conversations")
          .insert({
            id: record.id,
            session_id: record.sessionId,
            user_id: record.userId,
            title: record.title,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            sessionId: data.session_id,
            userId: data.user_id,
            title: data.title,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }
    } catch (err) {
      logger.warn("Database conversation creation skipped, using in-memory store", {
        error: String(err),
      });
    }

    ConversationService.memoryConversations.set(id, record);
    ConversationService.memoryMessages.set(id, []);
    return record;
  }

  /**
   * Retrieves a conversation with strict ownership verification.
   * Throws ForbiddenError if neither sessionId nor userId matches.
   */
  async getConversation(
    id: string,
    sessionId: string,
    userId?: string
  ): Promise<ConversationRecord> {
    let conv: ConversationRecord | null = null;

    try {
      const client = await this.getClient();
      if (client) {
        const { data, error } = await client
          .from("ai_conversations")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          conv = {
            id: data.id,
            sessionId: data.session_id,
            userId: data.user_id,
            title: data.title,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }
    } catch {
      // Fall through to memory
    }

    if (!conv) {
      conv = ConversationService.memoryConversations.get(id) || null;
    }

    if (!conv) {
      throw new NotFoundError("Conversation", id);
    }

    // Strict Security Isolation: ensure visitor cannot read another's conversation
    const isSessionOwner = conv.sessionId === sessionId;
    const isUserOwner = Boolean(userId && conv.userId === userId);

    if (!isSessionOwner && !isUserOwner) {
      throw new ForbiddenError("Access denied to conversation: session mismatch");
    }

    return conv;
  }

  /**
   * Appends a message to an existing conversation
   */
  async addMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<MessageRecord> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const record: MessageRecord = {
      id,
      conversationId,
      role,
      content,
      metadata: metadata || null,
      createdAt: now,
    };

    try {
      const client = await this.getClient();
      if (client) {
        await client.from("ai_messages").insert({
          id: record.id,
          conversation_id: record.conversationId,
          role: record.role,
          content: record.content,
          metadata: (record.metadata as any) || {},
        });
      }
    } catch {
      // Fall through
    }

    const list = ConversationService.memoryMessages.get(conversationId) || [];
    list.push(record);
    ConversationService.memoryMessages.set(conversationId, list);

    return record;
  }

  /**
   * Lists the most recent messages in a conversation
   */
  async listMessages(
    conversationId: string,
    limit = 10
  ): Promise<MessageRecord[]> {
    try {
      const client = await this.getClient();
      if (client) {
        const { data, error } = await client
          .from("ai_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data
            .map((m) => ({
              id: m.id,
              conversationId: m.conversation_id,
              role: m.role as "user" | "assistant" | "system",
              content: m.content,
              metadata: (m.metadata as Record<string, unknown>) || null,
              createdAt: m.created_at,
            }))
            .reverse();
        }
      }
    } catch {
      // Fall through
    }

    const inMem = ConversationService.memoryMessages.get(conversationId) || [];
    return inMem.slice(-limit);
  }
}
