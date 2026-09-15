/**
 * VictorOS Knowledge Domain Types
 */

import type { Database } from "../supabase/types";

export type ConceptRow = Database["public"]["Tables"]["concepts"]["Row"];
export type ConceptInsert = Database["public"]["Tables"]["concepts"]["Insert"];
export type ConceptUpdate = Database["public"]["Tables"]["concepts"]["Update"];

export interface Concept extends ConceptRow {}

export interface ConceptFilter {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateConceptInput {
  slug: string;
  title: string;
  category: string;
  definition: string;
  key_points?: string[] | null;
  related_concepts?: string[] | null;
  order_index?: number;
}

export interface UpdateConceptInput {
  slug?: string;
  title?: string;
  category?: string;
  definition?: string;
  key_points?: string[] | null;
  related_concepts?: string[] | null;
  order_index?: number;
}
