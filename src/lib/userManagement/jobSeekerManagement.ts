/**
 * Job Seeker Management Service
 * 
 * Specialized management tools for job seekers:
 * - Profile verification and validation
 * - Skills assessment and tracking
 * - Career progression monitoring
 * - Resume analysis and feedback
 * - Job matching and recommendations
 */

import { supabase } from '../supabase';
import { logSecurityEvent } from '../security/userSecurity';
// Import types for future use
// import type { UnifiedJobSeekerProfile } from '../../types/unified';

export interface JobSeekerVerification {
  id: string;
  jobSeekerId: string;
  verificationType: 'identity' | 'education' | 'experience' | 'skills' | 'references';
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verificationDate?: string;
  documents: string[];
  notes?: string;
}

export interface SkillAssessment {
  id: string;
  jobSeekerId: string;
  skillName: string;
  assessmentType: 'self_reported' | 'verified' | 'tested' | 'employer_validated';
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score?: number;
  assessedBy?: string;
  assessmentDate: string;
  validUntil?: string;
}

export interface CareerGoal {
  id: string;
  jobSeekerId: string;
  goalType: 'job_title' | 'industry_transition' | 'skill_development' | 'salary_target' | 'location_change';
  description: string;
  targetDate?: string;
  status: 'active' | 'achieved' | 'paused' | 'cancelled';
  progress: number; // 0-100
  milestones: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobSeekerAnalytics {
  profileCompleteness: number;
  skillsVerified: number;
  totalSkills: number;
  resumeScore: number;
  climateRelevanceScore: number;
  jobMatchScore: number;
  profileViews: number;
  applicationsSent: number;
  interviewsScheduled: number;
  lastActivity: string;
}

/**
 * Get comprehensive job seeker profile with analytics
 */
export async function getJobSeekerProfile(
  jobSeekerId: string,
  requestingUserId: string
): Promise<{ success: boolean; profile?: Record<string, unknown>; analytics?: JobSeekerAnalytics; error?: string }> {
  try {
    // Get job seeker profile with related data
    const { data: profile, error } = await supabase
      .from('job_seeker_profiles')
      .select(`
        *,
        user_profiles(*)
      `)
      .eq('id', jobSeekerId)
      .single();

    if (error || !profile) {
      return { success: false, error: 'Job seeker profile not found' };
    }

    // Calculate analytics
    const analytics = await calculateJobSeekerAnalytics(jobSeekerId);

    // Log profile access
    await logSecurityEvent(
      requestingUserId,
      'profile_viewed',
      '127.0.0.1',
      'Job Seeker Management',
      { targetJobSeekerId: jobSeekerId },
      'low'
    );

    return { success: true, profile, analytics };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify job seeker credentials
 */
export async function verifyJobSeekerCredentials(
  jobSeekerId: string,
  verificationType: JobSeekerVerification['verificationType'],
  verifiedBy: string,
  status: 'verified' | 'rejected',
  notes?: string,
  documents: string[] = []
): Promise<{ success: boolean; error?: string }> {
  try {
    const verification: Omit<JobSeekerVerification, 'id'> = {
      jobSeekerId,
      verificationType,
      status,
      verifiedBy,
      verificationDate: new Date().toISOString(),
      documents,
      notes
    };

    const { error } = await supabase
      .from('job_seeker_verifications')
      .insert(verification);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update profile verification status
    const verificationFields: Record<string, boolean> = {};
    verificationFields[`${verificationType}_verified`] = status === 'verified';

    await supabase
      .from('job_seeker_profiles')
      .update({
        ...verificationFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobSeekerId);

    // Log verification action
    await logSecurityEvent(
      verifiedBy,
      'profile_updated',
      '127.0.0.1',
      'Job Seeker Management',
      { 
        action: 'credential_verification',
        jobSeekerId,
        verificationType,
        status
      },
      'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Add or update skill assessment
 */
export async function assessJobSeekerSkill(
  jobSeekerId: string,
  skillData: Omit<SkillAssessment, 'id' | 'assessmentDate'>,
  assessedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const assessment: Omit<SkillAssessment, 'id'> = {
      ...skillData,
      jobSeekerId,
      assessmentDate: new Date().toISOString(),
      assessedBy
    };

    // Check if skill assessment already exists
    const { data: existing } = await supabase
      .from('skill_assessments')
      .select('id')
      .eq('jobSeekerId', jobSeekerId)
      .eq('skillName', skillData.skillName)
      .single();

    if (existing) {
      // Update existing assessment
      const { error } = await supabase
        .from('skill_assessments')
        .update(assessment)
        .eq('id', existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new assessment
      const { error } = await supabase
        .from('skill_assessments')
        .insert(assessment);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    // Log skill assessment
    await logSecurityEvent(
      assessedBy,
      'profile_updated',
      '127.0.0.1',
      'Job Seeker Management',
      { 
        action: 'skill_assessment',
        jobSeekerId,
        skillName: skillData.skillName,
        proficiencyLevel: skillData.proficiencyLevel
      },
      'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Set or update career goals
 */
export async function setCareerGoal(
  jobSeekerId: string,
  goalData: Omit<CareerGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    const goal: Omit<CareerGoal, 'id'> = {
      ...goalData,
      jobSeekerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('career_goals')
      .insert(goal)
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, goalId: data.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Update career goal progress
 */
export async function updateCareerGoalProgress(
  goalId: string,
  progress: number,
  milestones: string[] = [],
  status?: CareerGoal['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      progress: Math.max(0, Math.min(100, progress)),
      milestones,
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    const { error } = await supabase
      .from('career_goals')
      .update(updateData)
      .eq('id', goalId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get job seekers with advanced filtering
 */
export async function getJobSeekers(
  filters: {
    skills?: string[];
    experience?: string;
    location?: string;
    climateRelevanceMin?: number;
    verified?: boolean;
    available?: boolean;
    salaryRange?: { min: number; max: number };
  } = {},
  page: number = 1,
  limit: number = 50
): Promise<{ success: boolean; jobSeekers?: Record<string, unknown>[]; total?: number; error?: string }> {
  try {
    let query = supabase
      .from('job_seeker_profiles')
      .select(`
        *,
        user_profiles(*)
      `);

    // Apply filters
    if (filters.climateRelevanceMin) {
      query = query.gte('climate_relevance_score', filters.climateRelevanceMin);
    }

    if (filters.verified) {
      query = query.eq('identity_verified', true);
    }

    // Get total count
    const countQuery = supabase
      .from('job_seeker_profiles')
      .select('*', { count: 'exact', head: true });
    
    // Apply same filters for count
    if (filters.climateRelevanceMin) {
      countQuery.gte('climate_relevance_score', filters.climateRelevanceMin);
    }
    if (filters.verified) {
      countQuery.eq('identity_verified', true);
    }
    
    const { count } = await countQuery;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: jobSeekers, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, jobSeekers: jobSeekers || [], total: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Calculate job seeker analytics
 */
async function calculateJobSeekerAnalytics(jobSeekerId: string): Promise<JobSeekerAnalytics> {
  try {
    // Get profile data
    const { data: profile } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('id', jobSeekerId)
      .single();

    // Calculate profile completeness
    const requiredFields = ['resume_url', 'interests', 'preferred_job_types', 'salary_expectations'];
    const completedFields = requiredFields.filter(field => profile?.[field]);
    const profileCompleteness = (completedFields.length / requiredFields.length) * 100;

    // Get skill assessments
    const { data: skills } = await supabase
      .from('skill_assessments')
      .select('*')
      .eq('jobSeekerId', jobSeekerId);

    const totalSkills = skills?.length || 0;
    const skillsVerified = skills?.filter(s => s.assessmentType === 'verified').length || 0;

    // Get activity data
    const { data: activities } = await supabase
      .from('security_events')
      .select('created_at')
      .eq('user_id', jobSeekerId)
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      profileCompleteness,
      skillsVerified,
      totalSkills,
      resumeScore: profile?.resume_score || 0,
      climateRelevanceScore: profile?.climate_relevance_score || 0,
      jobMatchScore: 0, // Would be calculated based on job matching algorithm
      profileViews: 0, // Would track profile views
      applicationsSent: 0, // Would track job applications
      interviewsScheduled: 0, // Would track interviews
      lastActivity: activities?.[0]?.created_at || profile?.updated_at || ''
    };
  } catch (err) {
    console.error('Analytics calculation failed:', err);
    return {
      profileCompleteness: 0,
      skillsVerified: 0,
      totalSkills: 0,
      resumeScore: 0,
      climateRelevanceScore: 0,
      jobMatchScore: 0,
      profileViews: 0,
      applicationsSent: 0,
      interviewsScheduled: 0,
      lastActivity: ''
    };
  }
} 