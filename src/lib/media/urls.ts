/**
 * Canonical Media URL Resolver for Tovu
 * Normalizes public asset paths and Supabase Storage object paths safely.
 */

import { getPublicEnv, isSupabaseConfigured } from "../shared/env";

export interface MediaUrlOptions {
  bucket?: string;
  width?: number;
  quality?: number;
}

export function resolveMediaUrl(
  pathOrUrl: string | null | undefined,
  options: MediaUrlOptions = {}
): string | null {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  // Reject unsafe schemes (javascript:, data: outside safe image MIME types, vbscript:)
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) {
    return null;
  }

  // Already a full URL or root-relative local asset path
  if (
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Treat bare storage keys as Supabase Storage public object paths when configured
  if (!isSupabaseConfigured(false)) {
    return null;
  }

  const { supabaseUrl } = getPublicEnv();
  const baseUrl = supabaseUrl.replace(/\/+$/, "");
  const bucket = options.bucket || "media";
  const cleanKey = trimmed.replace(/^\/+/, "");

  if (options.width || options.quality) {
    const params = new URLSearchParams();
    if (options.width) params.set("width", String(options.width));
    if (options.quality) params.set("quality", String(options.quality));
    return `${baseUrl}/storage/v1/render/image/public/${bucket}/${cleanKey}?${params.toString()}`;
  }

  return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanKey}`;
}
