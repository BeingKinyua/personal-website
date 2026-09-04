export * from "./types/project";
export * from "./types/article";
export * from "./types/experiment";
export * from "./types/knowledge";
export * from "./types/doom";
export * from "./types/common";

// Backward-compatible type aliases
export type { Article as Post } from "./types/article";
export type { CurrentlyItem as FocusItem } from "./types/common";
export type { ProjectNode as BlueprintNode } from "./types/project";
export type { ProjectLine as BlueprintLine } from "./types/project";

export interface SystemBlueprint {
  name: string;
  description: string;
  nodes: Array<{ id: string; label: string; role: 'input' | 'process' | 'output'; x: number; y: number; description?: string }>;
  lines: Array<{ from: string; to: string; active?: boolean; label?: string }>;
}
