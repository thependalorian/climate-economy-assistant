-- =====================================================
-- ADD VECTOR SEARCH FUNCTION FOR KNOWLEDGE RESOURCES
-- =====================================================
-- This migration adds the vector search function for semantic search
-- across the knowledge_resources table using embeddings

-- Create the vector search function
CREATE OR REPLACE FUNCTION search_knowledge_resources(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  source_url text,
  tags text[],
  categories text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kr.id,
    kr.title,
    kr.content,
    kr.source_url,
    kr.tags,
    kr.categories,
    (kr.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM knowledge_resources kr
  WHERE kr.embedding IS NOT NULL
    AND kr.is_published = true
    AND (kr.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY kr.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a simpler text search function as fallback
CREATE OR REPLACE FUNCTION search_knowledge_resources_text(
  search_query text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  source_url text,
  tags text[],
  categories text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kr.id,
    kr.title,
    kr.content,
    kr.source_url,
    kr.tags,
    kr.categories
  FROM knowledge_resources kr
  WHERE kr.is_published = true
    AND (
      kr.title ILIKE '%' || search_query || '%'
      OR kr.content ILIKE '%' || search_query || '%'
      OR search_query = ANY(kr.tags)
      OR search_query = ANY(kr.categories)
    )
  ORDER BY 
    CASE 
      WHEN kr.title ILIKE '%' || search_query || '%' THEN 1
      WHEN search_query = ANY(kr.tags) THEN 2
      WHEN search_query = ANY(kr.categories) THEN 3
      ELSE 4
    END,
    kr.updated_at DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_knowledge_resources(vector(1536), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_resources_text(text, int) TO authenticated; 