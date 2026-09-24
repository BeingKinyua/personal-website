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
  sessionId?: string;
  context?: {
    route?: string;
    module?: string;
  };
}

export interface TovuResponse {
  message: string;
  actions?: TovuAction[];
  references?: TovuReference[];
  intent?: string;
  confidence?: number;
  timestamp?: string;
}

export interface TovuChatMessage {
  id: string;
  sender: "user" | "tovu" | "doom";
  text: string;
  timestamp: string;
  actions?: TovuAction[];
  references?: TovuReference[];
}

// Backwards-compatible aliases
export type DoomActionType = TovuActionType;
export type DoomAction = TovuAction;
export type DoomReference = TovuReference;
export type DoomRequest = TovuRequest;
export type DoomResponse = TovuResponse;
export type DoomChatMessage = TovuChatMessage;
