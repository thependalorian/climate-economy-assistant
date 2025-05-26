-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================
-- This migration adds any missing columns that may not exist
-- in the current database schema

-- Add missing columns to knowledge_resources table if they don't exist
DO $$
BEGIN
    -- Add processing_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'processing_status'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN processing_status TEXT DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;

    -- Add processing_error column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'processing_error'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN processing_error TEXT;
    END IF;

    -- Add chunk_index column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'chunk_index'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN chunk_index INTEGER DEFAULT 0;
    END IF;

    -- Add total_chunks column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'total_chunks'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN total_chunks INTEGER DEFAULT 1;
    END IF;

    -- Add similarity_threshold column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'similarity_threshold'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN similarity_threshold FLOAT DEFAULT 0.8;
    END IF;

    -- Add content_hash column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'content_hash'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN content_hash TEXT;
    END IF;

    -- Add embedding column if it doesn't exist (requires vector extension)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE knowledge_resources 
        ADD COLUMN embedding vector(1536);
    END IF;
END $$;

-- Create user_memory_state table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_memory_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  memory_data JSONB NOT NULL,
  
  UNIQUE(user_id)
);

-- Create resume_analysis_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS resume_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analysis_data JSONB NOT NULL,
  
  UNIQUE(user_id)
);

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_knowledge_resources_processing_status ON knowledge_resources(processing_status);

-- Create vector index with memory optimization
DO $$
BEGIN
    -- Only create vector index if embedding column exists and has data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'embedding'
    ) AND EXISTS (
        SELECT 1 FROM knowledge_resources WHERE embedding IS NOT NULL LIMIT 1
    ) THEN
        -- Temporarily increase maintenance_work_mem for this operation
        SET maintenance_work_mem = '128MB';
        
        -- Create the vector index with smaller lists parameter to reduce memory usage
        CREATE INDEX IF NOT EXISTS idx_knowledge_resources_embedding 
        ON knowledge_resources USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 10);
        
        -- Reset maintenance_work_mem to default
        RESET maintenance_work_mem;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If vector index creation fails, log the error but continue
        RAISE NOTICE 'Vector index creation skipped due to memory constraints: %', SQLERRM;
        RESET maintenance_work_mem;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_memory_state_user_id ON user_memory_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_state_updated_at ON user_memory_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_results_user_id ON resume_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_results_updated_at ON resume_analysis_results(updated_at);

-- Add missing triggers if they don't exist
DO $$
BEGIN
    -- Add trigger for user_memory_state if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_user_memory_state_updated_at'
    ) THEN
        CREATE TRIGGER update_user_memory_state_updated_at
            BEFORE UPDATE ON user_memory_state
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Add trigger for resume_analysis_results if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_resume_analysis_results_updated_at'
    ) THEN
        CREATE TRIGGER update_resume_analysis_results_updated_at
            BEFORE UPDATE ON resume_analysis_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on new tables if not already enabled
ALTER TABLE user_memory_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis_results ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for new tables if they don't exist
DO $$
BEGIN
    -- User memory state policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_memory_state' 
        AND policyname = 'user_memory_state_select_own'
    ) THEN
        CREATE POLICY "user_memory_state_select_own" ON user_memory_state 
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_memory_state' 
        AND policyname = 'user_memory_state_insert_own'
    ) THEN
        CREATE POLICY "user_memory_state_insert_own" ON user_memory_state 
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_memory_state' 
        AND policyname = 'user_memory_state_update_own'
    ) THEN
        CREATE POLICY "user_memory_state_update_own" ON user_memory_state 
        FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_memory_state' 
        AND policyname = 'user_memory_state_admin_access'
    ) THEN
        CREATE POLICY "user_memory_state_admin_access" ON user_memory_state 
        FOR ALL TO authenticated USING (
          auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
        );
    END IF;

    -- Resume analysis results policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'resume_analysis_results' 
        AND policyname = 'resume_analysis_results_select_own'
    ) THEN
        CREATE POLICY "resume_analysis_results_select_own" ON resume_analysis_results 
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'resume_analysis_results' 
        AND policyname = 'resume_analysis_results_insert_own'
    ) THEN
        CREATE POLICY "resume_analysis_results_insert_own" ON resume_analysis_results 
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'resume_analysis_results' 
        AND policyname = 'resume_analysis_results_update_own'
    ) THEN
        CREATE POLICY "resume_analysis_results_update_own" ON resume_analysis_results 
        FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'resume_analysis_results' 
        AND policyname = 'resume_analysis_results_admin_access'
    ) THEN
        CREATE POLICY "resume_analysis_results_admin_access" ON resume_analysis_results 
        FOR ALL TO authenticated USING (
          auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
        );
    END IF;
END $$;

-- Grant permissions on new tables
GRANT ALL ON user_memory_state TO authenticated;
GRANT ALL ON resume_analysis_results TO authenticated; 