export interface ProjectNode {
  id: string;
  label: string;
  role: 'input' | 'process' | 'output';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface ProjectLine {
  from: string;
  to: string;
  active?: boolean;
}

export interface ProjectMetric {
  label: string;
  value: string;
  detail: string;
}

export interface ProjectSectionDetail {
  overview: string;
  problem: string;
  research: string;
  solution: string;
  architectureNotes: string;
  implementationSnippet?: {
    filename: string;
    language: string;
    code: string;
  };
  results: string;
  lessons: string;
}

export interface Project {
  id: string;
  slug: string;
  number: string; // e.g. "01"
  title: string;
  subtitle: string;
  category: string;
  technologies: string[];
  featured: boolean;
  version: string;
  problem: string;
  system: string;
  details: string;
  metrics?: ProjectMetric[];
  deepDive: ProjectSectionDetail;
  architectureNodes: ProjectNode[];
  architectureLines: ProjectLine[];
  githubUrl?: string;
  liveUrl?: string;
  visualTag?: string;
}
