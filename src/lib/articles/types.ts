/**
 * VictorOS Articles Domain Types
 */

import type { Database } from "../supabase/types";
import type { ContentStatus } from "../shared/constants";

export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
export type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];

export interface Article extends ArticleRow {}

export interface ArticleFilter {
  status?: ContentStatus;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateArticleInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  reading_time?: number;
  status?: ContentStatus;
  featured?: boolean;
  cover_image_url?: string | null;
  published_at?: string | null;
}

export interface UpdateArticleInput {
  slug?: string;
  title?: string;
  excerpt?: string | null;
  content?: string;
  reading_time?: number;
  status?: ContentStatus;
  featured?: boolean;
  cover_image_url?: string | null;
  published_at?: string | null;
}
