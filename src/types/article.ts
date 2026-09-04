export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  tags: string[];
  content: string; // Markdown styled content
  featured?: boolean;
  bentoSpan?: "wide" | "tall" | "standard";
  visualType?: "graph" | "enclave" | "grid" | "kinematics";
}
