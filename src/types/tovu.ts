/**
 * Tovu — System Intelligence Types & Response Contracts
 */

export type TovuActionType =
  | "open_project"
  | "open_article"
  | "open_lab"
  | "open_concept"
  | "navigate"
  | "search";

export interface TovuAction {
  label: string;
  type: TovuActionType;
  target: string; // section ID, slug, or identifier
}

export interface TovuReference {
  type: "project" | "article" | "lab" | "concept" | "knowledge" | "experiment";
  id: string;
  title: string;
  slug: string;
  badge?: string;
}

export interface TovuRequest {
  message: string;
  conversationId?: string;
  context?: {
    route?: string;
    module?: string;
  };
  signal?: AbortSignal;
}

export interface TovuResponse {
  message: string;
  actions?: TovuAction[];
  references?: TovuReference[];
  intent?: string;
  confidence?: number;
  conversationId?: string;
  fallbackUsed?: boolean;
  persistenceStatus?: "persisted" | "ephemeral" | "failed";
  timestamp?: string;
}

export interface TovuChatMessage {
  id: string;
  sender: "user" | "tovu";
  text: string;
  timestamp: string;
  actions?: TovuAction[];
  references?: TovuReference[];
  fallbackUsed?: boolean;
  isError?: boolean;
}
