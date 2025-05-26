-- =====================================================
-- COMPLETE CLIMATE ECOSYSTEM ASSISTANT SCHEMA
-- =====================================================
-- Single comprehensive migration for the entire application
-- Includes all tables, RLS policies, indexes, functions, and views

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- 1. CORE USER TABLES
-- =====================================================

-- User profiles table (main user data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  location JSONB,
  user_type TEXT NOT NULL CHECK (user_type IN ('job_seeker', 'partner', 'admin')),
  profile_completed BOOLEAN DEFAULT false,
  organization_name TEXT,
  organization_type TEXT CHECK (organization_type IN ('employer', 'training_provider', 'educational_institution', 'government_agency', 'nonprofit', 'industry_association')),
  website TEXT,
  resume_url TEXT,
  skills TEXT[],
  interests TEXT[],
  industry TEXT[]
);

-- Job seeker profiles (extends user_profiles)
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resume_processed_at TIMESTAMP WITH TIME ZONE,
  climate_relevance_score NUMERIC,
  climate_relevance_explanation TEXT,
  veteran BOOLEAN DEFAULT false,
  international_professional BOOLEAN DEFAULT false,
  ej_community_resident BOOLEAN DEFAULT false,
  returning_citizen BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  barriers TEXT[],
  preferred_job_types TEXT[],
  preferred_locations TEXT[],
  preferred_work_environment TEXT[],
  willing_to_relocate BOOLEAN DEFAULT false,
  salary_expectations JSONB,
  career_goals TEXT,
  highest_education TEXT,
  years_of_experience TEXT,
  resume_filename TEXT,
  resume_parsed BOOLEAN DEFAULT false,
  has_resume BOOLEAN DEFAULT false,
  will_upload_later BOOLEAN DEFAULT false
);

-- Partner profiles (extends user_profiles)
CREATE TABLE IF NOT EXISTS partner_profiles (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('employer', 'training_provider', 'educational_institution', 'government_agency', 'nonprofit', 'industry_association')),
  website TEXT,
  description TEXT,
  partnership_level TEXT DEFAULT 'standard' CHECK (partnership_level IN ('basic', 'standard', 'premium', 'enterprise')),
  climate_focus TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  industry TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  location JSONB,
  partnership_benefits TEXT[],
  partnership_requirements TEXT[],
  embedding vector(1536)
);

-- Admin profiles (extends user_profiles)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  role TEXT DEFAULT 'admin',
  permissions TEXT[] DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE
);

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT
);

-- User memory state for LangGraph persistence
CREATE TABLE IF NOT EXISTS user_memory_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  memory_data JSONB NOT NULL,
  
  UNIQUE(user_id)
);

-- Resume analysis results for LangGraph processing
CREATE TABLE IF NOT EXISTS resume_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analysis_data JSONB NOT NULL,
  
  UNIQUE(user_id)
);

-- =====================================================
-- 2. NORMALIZED DATA TABLES
-- =====================================================

-- Education records
CREATE TABLE IF NOT EXISTS education_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT education_records_dates_check CHECK (
    start_date IS NULL OR end_date IS NULL OR start_date <= end_date
  ),
  CONSTRAINT education_records_current_check CHECK (
    NOT (is_current = true AND end_date IS NOT NULL)
  )
);

-- Experience records
CREATE TABLE IF NOT EXISTS experience_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT experience_records_dates_check CHECK (
    end_date IS NULL OR start_date <= end_date
  ),
  CONSTRAINT experience_records_current_check CHECK (
    NOT (is_current = true AND end_date IS NOT NULL)
  )
);

-- Skill records
CREATE TABLE IF NOT EXISTS skill_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER CHECK (years_of_experience >= 0),
  climate_relevance INTEGER CHECK (climate_relevance >= 1 AND climate_relevance <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, skill_name)
);

-- Knowledge resources (for AI/vector search)
CREATE TABLE IF NOT EXISTS knowledge_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'text', 'html', 'markdown', 'docx', 'url')),
  source_url TEXT,
  author TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  embedding vector(1536),
  content_hash TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  chunk_index INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 1,
  similarity_threshold FLOAT DEFAULT 0.8
);

-- =====================================================
-- 3. PERFORMANCE INDEXES
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_type ON user_profiles(organization_type);

-- Job seeker profiles indexes
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_onboarding ON job_seeker_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_climate_score ON job_seeker_profiles(climate_relevance_score);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_education ON job_seeker_profiles(highest_education);

-- Partner profiles indexes
CREATE INDEX IF NOT EXISTS idx_partner_profiles_organization_type ON partner_profiles(organization_type);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_verified ON partner_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_partnership_level ON partner_profiles(partnership_level);

-- Education records indexes
CREATE INDEX IF NOT EXISTS idx_education_records_user_id ON education_records(user_id);
CREATE INDEX IF NOT EXISTS idx_education_records_institution ON education_records(institution);
CREATE INDEX IF NOT EXISTS idx_education_records_degree ON education_records(degree);
CREATE INDEX IF NOT EXISTS idx_education_records_field_of_study ON education_records(field_of_study);
CREATE INDEX IF NOT EXISTS idx_education_records_current ON education_records(is_current) WHERE is_current = true;

-- Experience records indexes
CREATE INDEX IF NOT EXISTS idx_experience_records_user_id ON experience_records(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_records_company ON experience_records(company);
CREATE INDEX IF NOT EXISTS idx_experience_records_position ON experience_records(position);
CREATE INDEX IF NOT EXISTS idx_experience_records_current ON experience_records(is_current) WHERE is_current = true;

-- Skill records indexes
CREATE INDEX IF NOT EXISTS idx_skill_records_user_id ON skill_records(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_records_skill_name ON skill_records(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_records_proficiency ON skill_records(proficiency_level);
CREATE INDEX IF NOT EXISTS idx_skill_records_climate_relevance ON skill_records(climate_relevance);

-- Knowledge resources indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_resources_content_type ON knowledge_resources(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_resources_published ON knowledge_resources(is_published);
CREATE INDEX IF NOT EXISTS idx_knowledge_resources_processing_status ON knowledge_resources(processing_status);

-- Create vector index with memory optimization
DO $$
BEGIN
    -- Only create vector index if we have embedding data
    IF EXISTS (SELECT 1 FROM knowledge_resources WHERE embedding IS NOT NULL LIMIT 1) THEN
        -- Temporarily increase maintenance_work_mem for this operation
        SET maintenance_work_mem = '128MB';
        
        -- Create the vector index with optimized parameters
        CREATE INDEX IF NOT EXISTS idx_knowledge_resources_embedding 
        ON knowledge_resources USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 10);
        
        -- Reset maintenance_work_mem to default
        RESET maintenance_work_mem;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If vector index creation fails, continue without it
        RAISE NOTICE 'Vector index creation skipped: %', SQLERRM;
        RESET maintenance_work_mem;
END $$;

-- User memory state indexes
CREATE INDEX IF NOT EXISTS idx_user_memory_state_user_id ON user_memory_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_state_updated_at ON user_memory_state(updated_at);

-- Resume analysis results indexes
CREATE INDEX IF NOT EXISTS idx_resume_analysis_results_user_id ON resume_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_results_updated_at ON resume_analysis_results(updated_at);

-- =====================================================
-- 4. UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all main tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_seeker_profiles_updated_at
    BEFORE UPDATE ON job_seeker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_profiles_updated_at
    BEFORE UPDATE ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_records_updated_at
    BEFORE UPDATE ON education_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_records_updated_at
    BEFORE UPDATE ON experience_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_records_updated_at
    BEFORE UPDATE ON skill_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_resources_updated_at
    BEFORE UPDATE ON knowledge_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memory_state_updated_at
    BEFORE UPDATE ON user_memory_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_analysis_results_updated_at
    BEFORE UPDATE ON resume_analysis_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis_results ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "user_profiles_admin_access" ON user_profiles FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Job seeker profiles policies
CREATE POLICY "job_seeker_profiles_select_own" ON job_seeker_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "job_seeker_profiles_insert_own" ON job_seeker_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "job_seeker_profiles_update_own" ON job_seeker_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "job_seeker_profiles_admin_access" ON job_seeker_profiles FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Partner profiles policies
CREATE POLICY "partner_profiles_select_own" ON partner_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "partner_profiles_insert_own" ON partner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "partner_profiles_update_own" ON partner_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "partner_profiles_admin_access" ON partner_profiles FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Admin profiles policies
CREATE POLICY "admin_profiles_select_own" ON admin_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_profiles_insert_own" ON admin_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_profiles_update_own" ON admin_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_profiles_admin_access" ON admin_profiles FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Education records policies
CREATE POLICY "education_records_select_own" ON education_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "education_records_insert_own" ON education_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "education_records_update_own" ON education_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "education_records_delete_own" ON education_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "education_records_admin_access" ON education_records FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Experience records policies
CREATE POLICY "experience_records_select_own" ON experience_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "experience_records_insert_own" ON experience_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "experience_records_update_own" ON experience_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "experience_records_delete_own" ON experience_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "experience_records_admin_access" ON experience_records FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Skill records policies
CREATE POLICY "skill_records_select_own" ON skill_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "skill_records_insert_own" ON skill_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skill_records_update_own" ON skill_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "skill_records_delete_own" ON skill_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "skill_records_admin_access" ON skill_records FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Knowledge resources policies (public read, admin write)
CREATE POLICY "knowledge_resources_select_all" ON knowledge_resources FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "knowledge_resources_admin_access" ON knowledge_resources FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- System config policies (admin only)
CREATE POLICY "system_config_admin_access" ON system_config FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- User memory state policies
CREATE POLICY "user_memory_state_select_own" ON user_memory_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_memory_state_insert_own" ON user_memory_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_memory_state_update_own" ON user_memory_state FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_memory_state_admin_access" ON user_memory_state FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- Resume analysis results policies
CREATE POLICY "resume_analysis_results_select_own" ON resume_analysis_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "resume_analysis_results_insert_own" ON resume_analysis_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resume_analysis_results_update_own" ON resume_analysis_results FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "resume_analysis_results_admin_access" ON resume_analysis_results FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin')
);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get user's complete profile with related records
CREATE OR REPLACE FUNCTION get_complete_user_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_profile', up.*,
    'job_seeker_profile', jsp.*,
    'partner_profile', pp.*,
    'admin_profile', ap.*,
    'education', (
      SELECT COALESCE(json_agg(er.*), '[]'::json)
      FROM education_records er
      WHERE er.user_id = p_user_id
    ),
    'experience', (
      SELECT COALESCE(json_agg(expr.*), '[]'::json)
      FROM experience_records expr
      WHERE expr.user_id = p_user_id
    ),
    'skills', (
      SELECT COALESCE(json_agg(sr.*), '[]'::json)
      FROM skill_records sr
      WHERE sr.user_id = p_user_id
    )
  ) INTO result
  FROM user_profiles up
  LEFT JOIN job_seeker_profiles jsp ON up.id = jsp.id
  LEFT JOIN partner_profiles pp ON up.id = pp.id
  LEFT JOIN admin_profiles ap ON up.id = ap.id
  WHERE up.id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user's skill-based climate relevance score
CREATE OR REPLACE FUNCTION calculate_climate_relevance_score(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_score NUMERIC;
  skill_count INTEGER;
BEGIN
  SELECT 
    AVG(climate_relevance),
    COUNT(*)
  INTO avg_score, skill_count
  FROM skill_records
  WHERE user_id = p_user_id 
    AND climate_relevance IS NOT NULL;
  
  IF skill_count = 0 THEN
    RETURN NULL;
  ELSIF skill_count < 3 THEN
    RETURN avg_score * 0.7;
  ELSE
    RETURN avg_score;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. OPTIMIZED VIEWS
-- =====================================================

-- View for user profiles with aggregated skill data
CREATE OR REPLACE VIEW user_profiles_with_skills AS
SELECT 
  up.*,
  COALESCE(skill_stats.skill_count, 0) as total_skills,
  skill_stats.avg_climate_relevance,
  skill_stats.top_skills
FROM user_profiles up
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as skill_count,
    AVG(climate_relevance) as avg_climate_relevance,
    array_agg(skill_name ORDER BY climate_relevance DESC NULLS LAST) as top_skills
  FROM (
    SELECT DISTINCT ON (user_id, skill_name)
      user_id,
      skill_name,
      climate_relevance,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY climate_relevance DESC NULLS LAST) as rn
    FROM skill_records
  ) ranked_skills
  WHERE rn <= 5
  GROUP BY user_id
) skill_stats ON up.id = skill_stats.user_id;

-- View for job seekers with complete profile data
CREATE OR REPLACE VIEW complete_job_seeker_profiles AS
SELECT 
  up.id,
  up.created_at,
  up.updated_at,
  up.first_name,
  up.last_name,
  up.email,
  up.phone,
  up.location,
  up.user_type,
  up.profile_completed,
  up.organization_name,
  up.organization_type,
  up.website,
  up.resume_url,
  up.skills,
  up.interests,
  up.industry,
  jsp.resume_processed_at,
  jsp.climate_relevance_score,
  jsp.climate_relevance_explanation,
  jsp.veteran,
  jsp.international_professional,
  jsp.ej_community_resident,
  jsp.returning_citizen,
  jsp.onboarding_completed,
  jsp.onboarding_step,
  jsp.barriers,
  jsp.preferred_job_types,
  jsp.preferred_locations,
  jsp.preferred_work_environment,
  jsp.willing_to_relocate,
  jsp.salary_expectations,
  jsp.career_goals,
  jsp.highest_education,
  jsp.years_of_experience,
  jsp.resume_filename,
  jsp.resume_parsed,
  jsp.has_resume,
  jsp.will_upload_later,
  COALESCE(ed_stats.education_count, 0) as education_count,
  COALESCE(exp_stats.experience_count, 0) as experience_count,
  COALESCE(skill_stats.skill_count, 0) as skill_count,
  skill_stats.avg_climate_relevance as calculated_climate_score
FROM user_profiles up
JOIN job_seeker_profiles jsp ON up.id = jsp.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as education_count
  FROM education_records
  GROUP BY user_id
) ed_stats ON up.id = ed_stats.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as experience_count
  FROM experience_records
  GROUP BY user_id
) exp_stats ON up.id = exp_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as skill_count,
    AVG(climate_relevance) as avg_climate_relevance
  FROM skill_records
  WHERE climate_relevance IS NOT NULL
  GROUP BY user_id
) skill_stats ON up.id = skill_stats.user_id
WHERE up.user_type = 'job_seeker';

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on tables
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON job_seeker_profiles TO authenticated;
GRANT ALL ON partner_profiles TO authenticated;
GRANT ALL ON admin_profiles TO authenticated;
GRANT ALL ON education_records TO authenticated;
GRANT ALL ON experience_records TO authenticated;
GRANT ALL ON skill_records TO authenticated;
GRANT ALL ON knowledge_resources TO authenticated;
GRANT ALL ON system_config TO authenticated;
GRANT ALL ON user_memory_state TO authenticated;
GRANT ALL ON resume_analysis_results TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_complete_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_climate_relevance_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- Grant permissions on views
GRANT SELECT ON user_profiles_with_skills TO authenticated;
GRANT SELECT ON complete_job_seeker_profiles TO authenticated; 