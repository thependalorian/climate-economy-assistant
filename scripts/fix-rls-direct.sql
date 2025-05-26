-- COMPREHENSIVE RLS Policy Fix for CEA Platform
-- This script completely fixes the infinite recursion issues in RLS policies

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE education_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE experience_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE skill_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis_results DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;

DROP POLICY IF EXISTS "job_seeker_profiles_admin_access" ON job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_select_own" ON job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_insert_own" ON job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_update_own" ON job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_select" ON job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_insert" ON job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_update" ON job_seeker_profiles;

DROP POLICY IF EXISTS "partner_profiles_admin_access" ON partner_profiles;
DROP POLICY IF EXISTS "partner_profiles_select_own" ON partner_profiles;
DROP POLICY IF EXISTS "partner_profiles_insert_own" ON partner_profiles;
DROP POLICY IF EXISTS "partner_profiles_update_own" ON partner_profiles;
DROP POLICY IF EXISTS "partner_profiles_select" ON partner_profiles;
DROP POLICY IF EXISTS "partner_profiles_insert" ON partner_profiles;
DROP POLICY IF EXISTS "partner_profiles_update" ON partner_profiles;

DROP POLICY IF EXISTS "admin_profiles_admin_access" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_select_own" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_insert_own" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update_own" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_select" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_insert" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update" ON admin_profiles;

DROP POLICY IF EXISTS "education_records_admin_access" ON education_records;
DROP POLICY IF EXISTS "education_records_select_own" ON education_records;
DROP POLICY IF EXISTS "education_records_insert_own" ON education_records;
DROP POLICY IF EXISTS "education_records_update_own" ON education_records;
DROP POLICY IF EXISTS "education_records_delete_own" ON education_records;
DROP POLICY IF EXISTS "education_records_select" ON education_records;
DROP POLICY IF EXISTS "education_records_insert" ON education_records;
DROP POLICY IF EXISTS "education_records_update" ON education_records;
DROP POLICY IF EXISTS "education_records_delete" ON education_records;

DROP POLICY IF EXISTS "experience_records_admin_access" ON experience_records;
DROP POLICY IF EXISTS "experience_records_select_own" ON experience_records;
DROP POLICY IF EXISTS "experience_records_insert_own" ON experience_records;
DROP POLICY IF EXISTS "experience_records_update_own" ON experience_records;
DROP POLICY IF EXISTS "experience_records_delete_own" ON experience_records;
DROP POLICY IF EXISTS "experience_records_select" ON experience_records;
DROP POLICY IF EXISTS "experience_records_insert" ON experience_records;
DROP POLICY IF EXISTS "experience_records_update" ON experience_records;
DROP POLICY IF EXISTS "experience_records_delete" ON experience_records;

DROP POLICY IF EXISTS "skill_records_admin_access" ON skill_records;
DROP POLICY IF EXISTS "skill_records_select_own" ON skill_records;
DROP POLICY IF EXISTS "skill_records_insert_own" ON skill_records;
DROP POLICY IF EXISTS "skill_records_update_own" ON skill_records;
DROP POLICY IF EXISTS "skill_records_delete_own" ON skill_records;
DROP POLICY IF EXISTS "skill_records_select" ON skill_records;
DROP POLICY IF EXISTS "skill_records_insert" ON skill_records;
DROP POLICY IF EXISTS "skill_records_update" ON skill_records;
DROP POLICY IF EXISTS "skill_records_delete" ON skill_records;

DROP POLICY IF EXISTS "user_memory_state_admin_access" ON user_memory_state;
DROP POLICY IF EXISTS "user_memory_state_select_own" ON user_memory_state;
DROP POLICY IF EXISTS "user_memory_state_insert_own" ON user_memory_state;
DROP POLICY IF EXISTS "user_memory_state_update_own" ON user_memory_state;
DROP POLICY IF EXISTS "user_memory_state_select" ON user_memory_state;
DROP POLICY IF EXISTS "user_memory_state_insert" ON user_memory_state;
DROP POLICY IF EXISTS "user_memory_state_update" ON user_memory_state;

DROP POLICY IF EXISTS "resume_analysis_results_admin_access" ON resume_analysis_results;
DROP POLICY IF EXISTS "resume_analysis_results_select_own" ON resume_analysis_results;
DROP POLICY IF EXISTS "resume_analysis_results_insert_own" ON resume_analysis_results;
DROP POLICY IF EXISTS "resume_analysis_results_update_own" ON resume_analysis_results;
DROP POLICY IF EXISTS "resume_analysis_results_select" ON resume_analysis_results;
DROP POLICY IF EXISTS "resume_analysis_results_insert" ON resume_analysis_results;
DROP POLICY IF EXISTS "resume_analysis_results_update" ON resume_analysis_results;

-- Now create simple, working policies

-- User profiles policies (uses 'id' column)
CREATE POLICY "user_profiles_access" ON user_profiles 
FOR ALL USING (auth.uid() = id);

-- Job seeker profiles policies (uses 'id' column)
CREATE POLICY "job_seeker_profiles_access" ON job_seeker_profiles 
FOR ALL USING (auth.uid() = id);

-- Partner profiles policies (uses 'id' column)
CREATE POLICY "partner_profiles_access" ON partner_profiles 
FOR ALL USING (auth.uid() = id);

-- Admin profiles policies (uses 'id' column)
CREATE POLICY "admin_profiles_access" ON admin_profiles 
FOR ALL USING (auth.uid() = id);

-- Education records policies (uses 'user_id' column)
CREATE POLICY "education_records_access" ON education_records 
FOR ALL USING (auth.uid() = user_id);

-- Experience records policies (uses 'user_id' column)
CREATE POLICY "experience_records_access" ON experience_records 
FOR ALL USING (auth.uid() = user_id);

-- Skill records policies (uses 'user_id' column)
CREATE POLICY "skill_records_access" ON skill_records 
FOR ALL USING (auth.uid() = user_id);

-- User memory state policies (uses 'user_id' column)
CREATE POLICY "user_memory_state_access" ON user_memory_state 
FOR ALL USING (auth.uid() = user_id);

-- Resume analysis results policies (uses 'user_id' column)
CREATE POLICY "resume_analysis_results_access" ON resume_analysis_results 
FOR ALL USING (auth.uid() = user_id);

-- Re-enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis_results ENABLE ROW LEVEL SECURITY; 