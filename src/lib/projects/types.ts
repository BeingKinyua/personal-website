/**
 * VictorOS Projects Domain Types
 */

import type { Database, Json } from "../supabase/types";
import type { ContentStatus } from "../shared/constants";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type SectionRow = Database["public"]["Tables"]["project_sections"]["Row"];
export type SectionInsert = Database["public"]["Tables"]["project_sections"]["Insert"];

export interface Project extends ProjectRow {
  sections?: SectionRow[];
}

export interface ProjectFilter {
  status?: ContentStatus;
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectInput {
  slug: string;
  title: string;
  subtitle?: string | null;
  number?: string | null;
  description?: string | null;
  category: string;
  version?: string | null;
  status?: ContentStatus;
  featured?: boolean;
  hero_image_url?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  metrics?: Json | null;
  technologies?: string[] | null;
  architecture_nodes?: Json | null;
  architecture_lines?: Json | null;
  order_index?: number;
}

export interface UpdateProjectInput {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  number?: string | null;
  description?: string | null;
  category?: string;
  version?: string | null;
  status?: ContentStatus;
  featured?: boolean;
  hero_image_url?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  metrics?: Json | null;
  technologies?: string[] | null;
  architecture_nodes?: Json | null;
  architecture_lines?: Json | null;
  order_index?: number;
}
