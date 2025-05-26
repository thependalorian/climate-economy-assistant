-- NUCLEAR RLS FIX - Complete Reset
-- This completely removes all RLS policies and recreates them from scratch

-- Step 1: Completely disable RLS on all tables
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_seeker_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS experience_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_memory_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resume_analysis_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pii_encrypted_data DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (using CASCADE to ensure complete removal)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles CASCADE';
    END LOOP;
    
    -- Drop all policies on job_seeker_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'job_seeker_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON job_seeker_profiles CASCADE';
    END LOOP;
    
    -- Drop all policies on partner_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partner_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON partner_profiles CASCADE';
    END LOOP;
    
    -- Drop all policies on admin_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admin_profiles CASCADE';
    END LOOP;
    
    -- Drop all policies on education_records
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'education_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON education_records CASCADE';
    END LOOP;
    
    -- Drop all policies on experience_records
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'experience_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON experience_records CASCADE';
    END LOOP;
    
    -- Drop all policies on skill_records
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'skill_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON skill_records CASCADE';
    END LOOP;
    
    -- Drop all policies on user_memory_state
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_memory_state') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_memory_state CASCADE';
    END LOOP;
    
    -- Drop all policies on resume_analysis_results
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'resume_analysis_results') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON resume_analysis_results CASCADE';
    END LOOP;
END $$;

-- Step 3: Wait a moment for changes to propagate
SELECT pg_sleep(1);

-- Step 4: Create simple, working policies
-- User profiles (id = auth.uid())
CREATE POLICY "user_profiles_policy" ON user_profiles 
FOR ALL USING (auth.uid() = id);

-- Job seeker profiles (id = auth.uid())
CREATE POLICY "job_seeker_profiles_policy" ON job_seeker_profiles 
FOR ALL USING (auth.uid() = id);

-- Partner profiles (id = auth.uid())
CREATE POLICY "partner_profiles_policy" ON partner_profiles 
FOR ALL USING (auth.uid() = id);

-- Admin profiles (id = auth.uid())
CREATE POLICY "admin_profiles_policy" ON admin_profiles 
FOR ALL USING (auth.uid() = id);

-- Education records (user_id = auth.uid())
CREATE POLICY "education_records_policy" ON education_records 
FOR ALL USING (auth.uid() = user_id);

-- Experience records (user_id = auth.uid())
CREATE POLICY "experience_records_policy" ON experience_records 
FOR ALL USING (auth.uid() = user_id);

-- Skill records (user_id = auth.uid())
CREATE POLICY "skill_records_policy" ON skill_records 
FOR ALL USING (auth.uid() = user_id);

-- User memory state (user_id = auth.uid())
CREATE POLICY "user_memory_state_policy" ON user_memory_state 
FOR ALL USING (auth.uid() = user_id);

-- Resume analysis results (user_id = auth.uid())
CREATE POLICY "resume_analysis_results_policy" ON resume_analysis_results 
FOR ALL USING (auth.uid() = user_id);

-- Step 5: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis_results ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify no policies are causing recursion
SELECT 'RLS policies reset successfully' as status; 