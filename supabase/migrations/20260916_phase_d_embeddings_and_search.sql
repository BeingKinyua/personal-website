-- VictorOS Phase D: Intelligence Layer Migration
-- pgvector extension, embeddings table, and hybrid vector search functions

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create embeddings table linked to content_chunks
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES public.content_chunks(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model TEXT NOT NULL DEFAULT 'text-embedding-004',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for chunk lookup
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON public.embeddings(chunk_id);

-- Cosine distance HNSW vector index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw 
ON public.embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Row Level Security for embeddings
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Anyone can read embeddings for published content
CREATE POLICY "Public read access to embeddings"
ON public.embeddings
FOR SELECT
USING (true);

-- Only authenticated admins/service_role can insert/update/delete embeddings
CREATE POLICY "Service and admin write access to embeddings"
ON public.embeddings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. PostgreSQL Vector Matching Function (Cosine Similarity)
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  source_type TEXT,
  source_id UUID,
  chunk_index INT,
  content TEXT,
  token_count INT,
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
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  JOIN public.content_chunks c ON e.chunk_id = c.id
  WHERE
    (filter_source_types IS NULL OR c.source_type = ANY(filter_source_types))
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
