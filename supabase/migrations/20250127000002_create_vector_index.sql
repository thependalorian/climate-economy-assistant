-- =====================================================
-- CREATE VECTOR INDEX WITH MEMORY OPTIMIZATION
-- =====================================================
-- This migration creates the vector index for knowledge_resources
-- with proper memory management to avoid memory allocation errors

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create vector index with memory optimization and error handling
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    has_data BOOLEAN;
    current_mem_setting TEXT;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'knowledge_resources'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Table knowledge_resources does not exist, skipping vector index creation';
        RETURN;
    END IF;
    
    -- Check if embedding column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_resources' 
        AND column_name = 'embedding'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Column embedding does not exist, skipping vector index creation';
        RETURN;
    END IF;
    
    -- Check if we have any embedding data
    SELECT EXISTS (
        SELECT 1 FROM knowledge_resources 
        WHERE embedding IS NOT NULL 
        LIMIT 1
    ) INTO has_data;
    
    IF NOT has_data THEN
        RAISE NOTICE 'No embedding data found, skipping vector index creation';
        RETURN;
    END IF;
    
    -- Check if index already exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'knowledge_resources' 
        AND indexname = 'idx_knowledge_resources_embedding'
    ) THEN
        RAISE NOTICE 'Vector index already exists, skipping creation';
        RETURN;
    END IF;
    
    -- Get current maintenance_work_mem setting
    SELECT setting INTO current_mem_setting 
    FROM pg_settings 
    WHERE name = 'maintenance_work_mem';
    
    RAISE NOTICE 'Current maintenance_work_mem: %', current_mem_setting;
    
    -- Temporarily increase maintenance_work_mem for this operation
    -- Use a more conservative setting that should work on most systems
    SET maintenance_work_mem = '64MB';
    
    RAISE NOTICE 'Creating vector index with optimized parameters...';
    
    -- Create the vector index with very conservative parameters
    -- Using lists = 1 for minimal memory usage
    CREATE INDEX idx_knowledge_resources_embedding 
    ON knowledge_resources USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 1);
    
    RAISE NOTICE 'Vector index created successfully';
    
    -- Reset maintenance_work_mem to original value
    EXECUTE format('SET maintenance_work_mem = %L', current_mem_setting);
    
EXCEPTION
    WHEN insufficient_resources THEN
        RAISE NOTICE 'Insufficient memory for vector index creation. This is normal for development environments.';
        RAISE NOTICE 'The application will work without the vector index, but vector search will be slower.';
        -- Reset memory setting
        EXECUTE format('SET maintenance_work_mem = %L', current_mem_setting);
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector index creation failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        RAISE NOTICE 'This is not critical - the application will work without vector indexing.';
        -- Reset memory setting
        EXECUTE format('SET maintenance_work_mem = %L', current_mem_setting);
END $$;

-- Create a function to create the vector index later when needed
CREATE OR REPLACE FUNCTION create_vector_index_when_ready()
RETURNS VOID AS $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Check if we have enough data to justify creating the index
    SELECT COUNT(*) INTO row_count 
    FROM knowledge_resources 
    WHERE embedding IS NOT NULL;
    
    IF row_count >= 100 THEN
        -- Only create index if we have substantial data
        PERFORM create_vector_index_with_memory_management();
    ELSE
        RAISE NOTICE 'Not enough embedding data (% rows) to create vector index', row_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle vector index creation with proper memory management
CREATE OR REPLACE FUNCTION create_vector_index_with_memory_management()
RETURNS VOID AS $$
DECLARE
    current_mem_setting TEXT;
BEGIN
    -- Check if index already exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'knowledge_resources' 
        AND indexname = 'idx_knowledge_resources_embedding'
    ) THEN
        RAISE NOTICE 'Vector index already exists';
        RETURN;
    END IF;
    
    -- Get current setting
    SELECT setting INTO current_mem_setting 
    FROM pg_settings 
    WHERE name = 'maintenance_work_mem';
    
    -- Set conservative memory limit
    SET maintenance_work_mem = '64MB';
    
    -- Create index with minimal lists parameter
    CREATE INDEX idx_knowledge_resources_embedding 
    ON knowledge_resources USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 1);
    
    -- Reset memory setting
    EXECUTE format('SET maintenance_work_mem = %L', current_mem_setting);
    
    RAISE NOTICE 'Vector index created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        -- Reset memory setting on error
        EXECUTE format('SET maintenance_work_mem = %L', current_mem_setting);
        RAISE NOTICE 'Vector index creation failed: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql; 