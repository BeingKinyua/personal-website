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
export type SectionUpdate = Database["public"]["Tables"]["project_sections"]["Update"];

export type ProjectMediaRow = Database["public"]["Tables"]["project_media"]["Row"];

export interface Project extends ProjectRow {
  sections?: SectionRow[];
  tags?: { id: string; name: string; slug: string }[];
  technologies_rel?: { id: string; name: string; slug: string; icon?: string | null; color?: string | null }[];
  media?: (ProjectMediaRow & { asset?: Database["public"]["Tables"]["media_assets"]["Row"] })[];
}

export interface ProjectFilter {
  status?: ContentStatus;
  category?: string;
  technology?: string;
  tag?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateSectionInput {
  title: string;
  content: string;
  order_index?: number;
}

export interface UpdateSectionInput {
  title?: string;
  content?: string;
  order_index?: number;
}

export interface ReorderSectionItem {
  id: string;
  order_index: number;
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
