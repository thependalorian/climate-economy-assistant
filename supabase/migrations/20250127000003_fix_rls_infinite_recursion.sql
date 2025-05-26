-- =====================================================
-- FIX RLS INFINITE RECURSION ISSUE
-- =====================================================
-- This migration fixes the infinite recursion issue in user_profiles RLS policies
-- The problem is that admin policies are trying to query user_profiles from within user_profiles policies

-- Drop the problematic admin access policies that cause infinite recursion
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_admin_access" ON job_seeker_profiles;
DROP POLICY IF EXISTS "partner_profiles_admin_access" ON partner_profiles;
DROP POLICY IF EXISTS "admin_profiles_admin_access" ON admin_profiles;
DROP POLICY IF EXISTS "education_records_admin_access" ON education_records;
DROP POLICY IF EXISTS "experience_records_admin_access" ON experience_records;
DROP POLICY IF EXISTS "skill_records_admin_access" ON skill_records;
DROP POLICY IF EXISTS "user_memory_state_admin_access" ON user_memory_state;
DROP POLICY IF EXISTS "resume_analysis_results_admin_access" ON resume_analysis_results;

-- Create simplified admin access policies using auth.jwt() instead of querying user_profiles
-- This avoids the infinite recursion by using JWT claims instead of database queries

-- User profiles policies (fixed)
CREATE POLICY "user_profiles_admin_access" ON user_profiles FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Job seeker profiles policies (fixed)
CREATE POLICY "job_seeker_profiles_admin_access" ON job_seeker_profiles FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Partner profiles policies (fixed)
CREATE POLICY "partner_profiles_admin_access" ON partner_profiles FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Admin profiles policies (fixed)
CREATE POLICY "admin_profiles_admin_access" ON admin_profiles FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Education records policies (fixed)
CREATE POLICY "education_records_admin_access" ON education_records FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Experience records policies (fixed)
CREATE POLICY "experience_records_admin_access" ON experience_records FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Skill records policies (fixed)
CREATE POLICY "skill_records_admin_access" ON skill_records FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- User memory state policies (fixed)
CREATE POLICY "user_memory_state_admin_access" ON user_memory_state FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Resume analysis results policies (fixed)
CREATE POLICY "resume_analysis_results_admin_access" ON resume_analysis_results FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata' ->> 'user_type') = 'admin'
);

-- Add a comment explaining the fix
COMMENT ON POLICY "user_profiles_admin_access" ON user_profiles IS 
'Fixed infinite recursion by using auth.jwt() instead of querying user_profiles table'; 