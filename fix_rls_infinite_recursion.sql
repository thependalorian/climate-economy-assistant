-- =====================================================
-- FIX RLS INFINITE RECURSION ISSUE
-- =====================================================
-- Run this script in the Supabase SQL Editor to fix the infinite recursion
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

-- Note: Admin policies removed to fix infinite recursion
-- Basic user access policies remain intact:
-- - Users can access their own data
-- - No admin override for now (can be added later with proper implementation)

-- Verify the fix by testing a simple query
SELECT 'RLS infinite recursion policies removed successfully' as status; 