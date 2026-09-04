export interface FocusItem {
  id: string;
  category: "Building" | "Learning" | "Reading" | "Exploring";
  title: string;
  icon: string;
  shortDescription: string;
  longDescription: string;
  statusLogs: string[];
  snippet?: {
    language: string;
    code: string;
    filename: string;
  };
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  version: string;
  problem: string;
  system: string;
  details: string;
  icon: string;
  url?: string;
  architectureNodes: Array<{ id: string; label: string; role: 'input' | 'process' | 'output'; x: number; y: number }>;
  architectureLines: Array<{ from: string; to: string; active?: boolean }>;
}

export interface Post {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  content: string; // Markdown / styled string
}

export interface BlueprintNode {
  id: string;
  label: string;
  role: 'input' | 'process' | 'output';
  description?: string;
  x: number; // percentage
  y: number; // percentage
}

export interface BlueprintLine {
  from: string;
  to: string;
  active?: boolean;
  label?: string;
}

export interface SystemBlueprint {
  name: string;
  description: string;
  nodes: BlueprintNode[];
  lines: BlueprintLine[];
}

export interface Message {
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  generatedBlueprint?: SystemBlueprint;
}

export interface ScopeEstimation {
  title: string;
  overview: string;
  stack: Array<{ name: string; reason: string }>;
  phases: Array<{ name: string; hours: number; deliverables: string }>;
  totalHours: number;
  timelineWeeks: number;
  architectureJson?: SystemBlueprint;
}
