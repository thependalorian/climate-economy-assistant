-- =====================================================
-- COMPREHENSIVE SUPABASE DATABASE ANALYSIS SCRIPT
-- =====================================================
-- Run this in the Supabase SQL Editor to get complete database structure
-- This script analyzes ALL schemas and provides comprehensive information

-- 0. Database Overview
SELECT 
    'DATABASE_INFO' as section,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version,
    now() as analysis_timestamp;

-- 1. List ALL tables across ALL schemas (not just public)
SELECT 
    'ALL_TABLES' as section,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity,
    CASE 
        WHEN schemaname = 'public' THEN 'USER_TABLE'
        WHEN schemaname = 'auth' THEN 'AUTH_TABLE'
        WHEN schemaname = 'storage' THEN 'STORAGE_TABLE'
        WHEN schemaname = 'realtime' THEN 'REALTIME_TABLE'
        WHEN schemaname LIKE 'pg_%' THEN 'SYSTEM_TABLE'
        ELSE 'OTHER_TABLE'
    END as table_category
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename;

-- 1b. Focus on PUBLIC schema tables (your main application tables)
SELECT 
    'PUBLIC_TABLES' as section,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get detailed column information for ALL schemas
SELECT 
    'ALL_COLUMNS' as section,
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    ordinal_position,
    CASE 
        WHEN table_schema = 'public' THEN 'USER_COLUMN'
        WHEN table_schema = 'auth' THEN 'AUTH_COLUMN'
        WHEN table_schema = 'storage' THEN 'STORAGE_COLUMN'
        ELSE 'OTHER_COLUMN'
    END as column_category
FROM information_schema.columns 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name, ordinal_position;

-- 2b. Focus on PUBLIC schema columns (your main application columns)
SELECT 
    'PUBLIC_COLUMNS' as section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. List all indexes across ALL schemas
SELECT 
    'ALL_INDEXES' as section,
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE 
        WHEN schemaname = 'public' THEN 'USER_INDEX'
        WHEN schemaname = 'auth' THEN 'AUTH_INDEX'
        WHEN schemaname = 'storage' THEN 'STORAGE_INDEX'
        ELSE 'OTHER_INDEX'
    END as index_category
FROM pg_indexes 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename, indexname;

-- 3b. Focus on PUBLIC schema indexes
SELECT 
    'PUBLIC_INDEXES' as section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. List all foreign key constraints
SELECT 
    'FOREIGN_KEYS' as section,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. List all check constraints
SELECT 
    'CHECK_CONSTRAINTS' as section,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 6. List all RLS policies across ALL schemas
SELECT 
    'ALL_RLS_POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN schemaname = 'public' THEN 'USER_POLICY'
        WHEN schemaname = 'auth' THEN 'AUTH_POLICY'
        WHEN schemaname = 'storage' THEN 'STORAGE_POLICY'
        ELSE 'OTHER_POLICY'
    END as policy_category
FROM pg_policies 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename, policyname;

-- 6b. Focus on PUBLIC schema RLS policies
SELECT 
    'PUBLIC_RLS_POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Check for vector columns (pgvector extension) across ALL schemas
SELECT 
    'ALL_VECTOR_COLUMNS' as section,
    table_schema,
    table_name,
    column_name,
    data_type,
    udt_name,
    CASE 
        WHEN table_schema = 'public' THEN 'USER_VECTOR'
        ELSE 'OTHER_VECTOR'
    END as vector_category
FROM information_schema.columns 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    AND (data_type = 'USER-DEFINED' AND udt_name = 'vector')
ORDER BY table_schema, table_name, column_name;

-- 7b. Focus on PUBLIC schema vector columns
SELECT 
    'PUBLIC_VECTOR_COLUMNS' as section,
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND (data_type = 'USER-DEFINED' AND udt_name = 'vector')
ORDER BY table_name, column_name;

-- 8. List all triggers
SELECT 
    'TRIGGERS' as section,
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. List all functions/procedures
SELECT 
    'FUNCTIONS' as section,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 10. Get table sizes and row counts
SELECT 
    'TABLE_STATS' as section,
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- 11. List all enum types
SELECT 
    'ENUM_TYPES' as section,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 12. Check for extensions
SELECT 
    'EXTENSIONS' as section,
    extname,
    extversion,
    extrelocatable
FROM pg_extension
ORDER BY extname;

-- 13. Get database configuration
SELECT 
    'DB_CONFIG' as section,
    name,
    setting,
    unit,
    category,
    short_desc
FROM pg_settings 
WHERE name IN (
    'shared_preload_libraries',
    'max_connections',
    'work_mem',
    'maintenance_work_mem',
    'effective_cache_size'
)
ORDER BY name;

-- 14. Check for any knowledge_resources or similar tables for embeddings across ALL schemas
SELECT 
    'ALL_EMBEDDING_TABLES' as section,
    table_schema,
    table_name,
    column_name,
    data_type,
    udt_name,
    CASE 
        WHEN table_schema = 'public' THEN 'USER_EMBEDDING'
        ELSE 'OTHER_EMBEDDING'
    END as embedding_category
FROM information_schema.columns 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    AND (
        column_name ILIKE '%embedding%' 
        OR column_name ILIKE '%vector%'
        OR table_name ILIKE '%knowledge%'
        OR table_name ILIKE '%resource%'
        OR data_type = 'USER-DEFINED'
    )
ORDER BY table_schema, table_name, column_name;

-- 14b. Focus on PUBLIC schema embedding tables
SELECT 
    'PUBLIC_EMBEDDING_TABLES' as section,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND (
        column_name ILIKE '%embedding%' 
        OR column_name ILIKE '%vector%'
        OR table_name ILIKE '%knowledge%'
        OR table_name ILIKE '%resource%'
    )
ORDER BY table_name, column_name;

-- 15. Summary of ALL tables with their primary keys across ALL schemas
SELECT 
    'ALL_TABLE_SUMMARY' as section,
    t.table_schema,
    t.table_name,
    t.table_type,
    kcu.column_name as primary_key_column,
    c.data_type as pk_data_type,
    CASE 
        WHEN t.table_schema = 'public' THEN 'USER_TABLE'
        WHEN t.table_schema = 'auth' THEN 'AUTH_TABLE'
        WHEN t.table_schema = 'storage' THEN 'STORAGE_TABLE'
        WHEN t.table_schema = 'realtime' THEN 'REALTIME_TABLE'
        ELSE 'OTHER_TABLE'
    END as table_category
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
    ON t.table_name = tc.table_name 
    AND t.table_schema = tc.table_schema
    AND tc.constraint_type = 'PRIMARY KEY'
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
    AND kcu.column_name = c.column_name
WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY t.table_schema, t.table_name;

-- 15b. Focus on PUBLIC schema table summary
SELECT 
    'PUBLIC_TABLE_SUMMARY' as section,
    t.table_name,
    t.table_type,
    kcu.column_name as primary_key_column,
    c.data_type as pk_data_type
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
    ON t.table_name = tc.table_name 
    AND tc.constraint_type = 'PRIMARY KEY'
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND kcu.column_name = c.column_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- 16. Additional Supabase-specific information
-- 16a. Auth schema details
SELECT 
    'AUTH_SCHEMA_TABLES' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 16b. Storage schema details
SELECT 
    'STORAGE_SCHEMA_TABLES' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'storage'
ORDER BY table_name;

-- 16c. Realtime schema details
SELECT 
    'REALTIME_SCHEMA_TABLES' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'realtime'
ORDER BY table_name;

-- 17. Row counts for all PUBLIC tables (to understand data volume)
SELECT 
    'TABLE_ROW_COUNTS' as section,
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 18. Database size information
SELECT 
    'DATABASE_SIZE_INFO' as section,
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- 18b. Individual table sizes (only for existing tables)
SELECT 
    'TABLE_SIZES' as section,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 19. All schemas in the database
SELECT 
    'ALL_SCHEMAS' as section,
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name; 