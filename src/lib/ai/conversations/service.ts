/** Tovu conversation persistence: verified visitor sessions, UUIDs, and fail-closed ownership. */
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/types";
import { createSupabaseAdminClient } from "../../supabase/admin";
import { isSupabaseConfigured } from "../../shared/env";
import { ForbiddenError, NotFoundError, DatabaseError } from "../../shared/errors";

export interface ConversationRecord {
  id: string; sessionId: string; userId: string | null; title: string | null;
  createdAt: string; updatedAt: string;
}
export interface MessageRecord {
  id: string; conversationId: string; role: "user" | "assistant" | "system";
  content: string; metadata: Record<string, unknown> | null; createdAt: string;
}
export class ConversationService {
  constructor(private readonly injectedClient?: SupabaseClient<Database>) {}
  private client(): SupabaseClient<Database> {
    if (this.injectedClient) return this.injectedClient;
    if (!isSupabaseConfigured(true)) throw new DatabaseError("Conversation persistence is unavailable");
    return createSupabaseAdminClient();
  }
  private mapConversation(row: any): ConversationRecord {
    const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    return { id: row.id, sessionId: row.session_id, userId: meta.user_id || null,
      title: meta.title || null, createdAt: row.started_at, updatedAt: row.last_message_at };
  }
  async createConversation(input: { sessionId: string; userId?: string; title?: string }): Promise<ConversationRecord> {
    const { data, error } = await this.client().from("ai_conversations").insert({
      id: randomUUID(), session_id: input.sessionId,
      metadata: { user_id: input.userId || null, title: input.title || "Tovu Intelligence Query" },
    } as any).select("*").single();
    if (error || !data) throw new DatabaseError("Unable to create conversation");
    return this.mapConversation(data);
  }
  async getConversation(id: string, sessionId: string, userId?: string): Promise<ConversationRecord> {
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new NotFoundError("Conversation");
    const { data, error } = await this.client().from("ai_conversations").select("*").eq("id", id).maybeSingle();
    if (error) throw new DatabaseError("Unable to retrieve conversation");
    if (!data) throw new NotFoundError("Conversation");
    const record = this.mapConversation(data);
    if (record.sessionId !== sessionId && !(userId && record.userId === userId)) {
      throw new ForbiddenError("Access denied to conversation");
    }
    return record;
  }
  async addMessage(conversationId: string, role: "user" | "assistant" | "system",
    content: string, metadata?: Record<string, unknown>, sessionId?: string, userId?: string): Promise<MessageRecord> {
    if (!sessionId) throw new ForbiddenError("Verified visitor session required");
    await this.getConversation(conversationId, sessionId, userId);
    const { data, error } = await this.client().from("ai_messages").insert({
      id: randomUUID(), conversation_id: conversationId, role, content,
      message_references: metadata?.references || [],
    } as any).select("*").single();
    if (error || !data) throw new DatabaseError("Unable to save message");
    return { id: data.id, conversationId: data.conversation_id, role: data.role as MessageRecord["role"],
      content: data.content, metadata: { references: data.message_references }, createdAt: data.created_at };
  }
  async listMessages(conversationId: string, limit = 10, sessionId?: string, userId?: string): Promise<MessageRecord[]> {
    if (!sessionId) throw new ForbiddenError("Verified visitor session required");
    await this.getConversation(conversationId, sessionId, userId);
    const { data, error } = await this.client().from("ai_messages").select("*")
      .eq("conversation_id", conversationId).order("created_at", { ascending: false })
      .limit(Math.min(50, Math.max(1, limit)));
    if (error) throw new DatabaseError("Unable to retrieve messages");
    return (data || []).map((m: any) => ({ id: m.id, conversationId: m.conversation_id,
      role: m.role as MessageRecord["role"], content: m.content,
      metadata: { references: m.message_references }, createdAt: m.created_at })).reverse();
  }
}
