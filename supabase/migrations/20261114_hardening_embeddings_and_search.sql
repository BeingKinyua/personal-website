-- Tovu Hardening Migration: Tighten content_chunks & embeddings RLS policies
-- and update match_chunks RPC to enforce publication visibility and return source metadata.
-- NOTE: Execute this migration via Supabase CLI (`supabase db push`) or Supabase SQL Editor.

-- 1. Enforce Row Level Security on content_chunks and embeddings
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive public read policy on embeddings
DROP POLICY IF EXISTS "Public read access to embeddings" ON public.embeddings;
DROP POLICY IF EXISTS "Public read access to content_chunks" ON public.content_chunks;

-- Replace with visibility-scoped policies referencing parent entity publication states
CREATE POLICY "Public read access to published content_chunks"
ON public.content_chunks
FOR SELECT
USING (
  (
    source_type = 'project'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = content_chunks.source_id AND p.status = 'published'
    )
  )
  OR (
    source_type = 'article'
    AND EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = content_chunks.source_id AND a.status = 'published'
    )
  )
  OR (
    source_type = 'lab'
    AND EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = content_chunks.source_id AND l.status <> 'archived'
    )
  )
  OR (
    source_type = 'concept'
    AND EXISTS (
      SELECT 1 FROM public.concepts k
      WHERE k.id = content_chunks.source_id
    )
  )
);

CREATE POLICY "Service role write access to content_chunks"
ON public.content_chunks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public read access to published embeddings"
ON public.embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content_chunks c
    WHERE c.id = embeddings.chunk_id
      AND (
        (
          c.source_type = 'project'
          AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = c.source_id AND p.status = 'published'
          )
        )
        OR (
          c.source_type = 'article'
          AND EXISTS (
            SELECT 1 FROM public.articles a
            WHERE a.id = c.source_id AND a.status = 'published'
          )
        )
        OR (
          c.source_type = 'lab'
          AND EXISTS (
            SELECT 1 FROM public.labs l
            WHERE l.id = c.source_id AND l.status <> 'archived'
          )
        )
        OR (
          c.source_type = 'concept'
          AND EXISTS (
            SELECT 1 FROM public.concepts k
            WHERE k.id = c.source_id
          )
        )
      )
  )
);

-- 2. Update default model name on future rows
ALTER TABLE public.embeddings
  ALTER COLUMN model SET DEFAULT 'gemini-embedding-2';

-- 3. Replace match_chunks to filter unpublished/archived entities and return metadata
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL,
  include_drafts boolean DEFAULT false
)
RETURNS TABLE (
  chunk_id UUID,
  source_type TEXT,
  source_id UUID,
  chunk_index INT,
  content TEXT,
  token_count INT,
  title TEXT,
  slug TEXT,
  url TEXT,
  status TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.source_type,
    c.source_id,
    c.chunk_index,
    c.content,
    c.token_count,
    COALESCE(p.title, a.title, l.title, k.title) AS title,
    COALESCE(p.slug, a.slug, l.slug, k.slug) AS slug,
    CASE c.source_type
      WHEN 'project' THEN '/work/' || p.slug
      WHEN 'article' THEN '/journal/' || a.slug
      WHEN 'lab' THEN '/lab#' || l.slug
      WHEN 'concept' THEN '/knowledge/' || k.slug
      ELSE NULL
    END AS url,
    COALESCE(
      p.status::text,
      a.status::text,
      CASE WHEN l.status = 'archived' THEN 'archived' ELSE 'published' END,
      'published'
    ) AS status,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  JOIN public.content_chunks c ON e.chunk_id = c.id
  LEFT JOIN public.projects p ON c.source_type = 'project' AND p.id = c.source_id
  LEFT JOIN public.articles a ON c.source_type = 'article' AND a.id = c.source_id
  LEFT JOIN public.labs l ON c.source_type = 'lab' AND l.id = c.source_id
  LEFT JOIN public.concepts k ON c.source_type = 'concept' AND k.id = c.source_id
  WHERE
    (filter_source_types IS NULL OR c.source_type = ANY(filter_source_types))
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    AND (
      include_drafts = true
      OR (c.source_type = 'project' AND p.status = 'published')
      OR (c.source_type = 'article' AND a.status = 'published')
      OR (c.source_type = 'lab' AND l.status IS NOT NULL AND l.status <> 'archived')
      OR (c.source_type = 'concept' AND k.id IS NOT NULL)
    )
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
