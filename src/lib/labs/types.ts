/**
 * VictorOS Labs Domain Types
 */

import type { Database } from "../supabase/types";
import type { LabStatus } from "../shared/constants";

export type LabRow = Database["public"]["Tables"]["labs"]["Row"];
export type LabInsert = Database["public"]["Tables"]["labs"]["Insert"];
export type LabUpdate = Database["public"]["Tables"]["labs"]["Update"];

export interface Lab extends LabRow {}

export interface LabFilter {
  status?: LabStatus;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateLabInput {
  slug: string;
  title: string;
  description: string;
  category: string;
  status?: LabStatus;
  stars?: number;
  live_url?: string | null;
  github_url?: string | null;
  order_index?: number;
}

export interface UpdateLabInput {
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: LabStatus;
  stars?: number;
  live_url?: string | null;
  github_url?: string | null;
  order_index?: number;
}
