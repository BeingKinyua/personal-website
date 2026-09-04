export type DoomActionType = "navigate" | "open_project" | "open_article" | "open_experiment";

export interface DoomAction {
  label: string;
  type: DoomActionType;
  target: string; // section ID, slug, or identifier
}

export interface DoomReference {
  type: "project" | "article" | "experiment" | "knowledge";
  id: string;
  title: string;
  slug: string;
  badge?: string;
}

export interface DoomRequest {
  message: string;
  context?: {
    route?: string;
    module?: string;
  };
}

export interface DoomResponse {
  message: string;
  actions?: DoomAction[];
  references?: DoomReference[];
  timestamp?: string;
}

export interface DoomChatMessage {
  id: string;
  sender: "user" | "doom";
  text: string;
  timestamp: string;
  actions?: DoomAction[];
  references?: DoomReference[];
}
