import { supabase } from '../lib/supabase';

/**
 * This service handles the generation and management of recommendations for users.
 * It provides job matches, training programs, and resource recommendations based on
 * user profile data, skills, experience, and preferences.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    zip: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface JobSeekerProfile {
  id: string;
  highest_education?: string;
  years_of_experience?: string;
  skills?: string[];
  interests?: string[];
  preferred_job_types?: string[];
  preferred_work_environment?: string[];
  willing_to_relocate?: boolean;
  preferred_locations?: string[];
  salary_expectations?: {
    min: string;
    max: string;
    type: string;
  };
  climate_relevance_score?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Skill {
  id: string;
  user_id: string;
  name: string;
  proficiency: string;
  category: string;
  climate_relevance?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface JobListing {
  id: string;
  title: string;
  company_id: string;
  location: string;
  job_type: string;
  work_environment: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  required_skills: string[];
  preferred_skills?: string[];
  description: string;
  climate_sector: string;
  active: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TrainingProgram {
  id: string;
  title: string;
  provider: string;
  format: string;
  duration: string;
  cost?: number;
  financial_aid_available: boolean;
  skills_taught: string[];
  prerequisites?: string[];
  description: string;
  url: string;
  climate_sector: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string;
  tags: string[];
  climate_sector?: string;
}

interface JobMatch {
  job_seeker_id: string;
  job_listing_id: string;
  match_score: number;
  match_reasons: string[];
  skill_gaps: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TrainingMatch {
  job_seeker_id: string;
  training_program_id: string;
  match_score: number;
  match_reasons: string[];
  relevance_explanation: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ResourceMatch {
  job_seeker_id: string;
  resource_id: string;
  match_score: number;
  relevance_explanation: string;
}

/**
 * Generate job matches for a user based on their profile, skills, and preferences
 * @param userId The user ID
 * @returns A promise that resolves when job matches have been generated
 */
export const generateJobMatches = async (userId: string): Promise<void> => {
  try {
    // 1. Fetch user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // 2. Fetch job seeker profile
    const { data: jobSeekerData, error: jobSeekerError } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (jobSeekerError && jobSeekerError.code !== 'PGRST116') {
      throw jobSeekerError;
    }

    // 3. Fetch user skills
    const { data: skillsData, error: skillsError } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);

    if (skillsError) {
      throw skillsError;
    }

    // 4. Fetch active job listings
    const { data: jobsData, error: jobsError } = await supabase
      .from('job_listings')
      .select(`
        *,
        company:partner_id (organization_name, logo_url)
      `)
      .eq('active', true);

    if (jobsError) {
      throw jobsError;
    }

    // 5. Calculate matches
    const matches: JobMatch[] = [];
    const userSkills = skillsData?.map(skill => skill.name.toLowerCase()) || [];
    const userLocation = profileData?.location?.state || '';
    const userPreferredJobTypes = jobSeekerData?.preferred_job_types || [];
    const userPreferredWorkEnvironments = jobSeekerData?.preferred_work_environment || [];
    const userWillingToRelocate = jobSeekerData?.willing_to_relocate || false;
    const userPreferredLocations = jobSeekerData?.preferred_locations || [];
    const userClimateRelevanceScore = jobSeekerData?.climate_relevance_score || 50;

    // Process each job listing
    for (const job of (jobsData || [])) {
      // Calculate skill match
      const requiredSkills = job.required_skills.map((s: string) => s.toLowerCase());
      const preferredSkills = job.preferred_skills?.map((s: string) => s.toLowerCase()) || [];

      const requiredMatches = requiredSkills.filter(s => userSkills.includes(s));
      const preferredMatches = preferredSkills.filter(s => userSkills.includes(s));

      // Calculate skill match score (weighted)
      const requiredWeight = 0.7;
      const preferredWeight = 0.3;

      let skillScore = 0;
      if (requiredSkills.length > 0) {
        skillScore += (requiredMatches.length / requiredSkills.length) * requiredWeight;
      }

      if (preferredSkills.length > 0) {
        skillScore += (preferredMatches.length / preferredSkills.length) * preferredWeight;
      }

      // Calculate location match
      let locationScore = 0;
      if (userWillingToRelocate) {
        // If willing to relocate, check if job is in preferred locations
        if (userPreferredLocations.length > 0) {
          if (userPreferredLocations.some(loc => job.location.includes(loc))) {
            locationScore = 1;
          } else {
            locationScore = 0.5; // Partial match for willing to relocate but not preferred location
          }
        } else {
          locationScore = 0.8; // Willing to relocate anywhere
        }
      } else {
        // Not willing to relocate, must be in current state
        locationScore = job.location.includes(userLocation) ? 1 : 0;
      }

      // Calculate job type match
      const jobTypeScore = userPreferredJobTypes.includes(job.job_type) ? 1 : 0.5;

      // Calculate work environment match
      const workEnvScore = userPreferredWorkEnvironments.includes(job.work_environment) ? 1 : 0.5;

      // Calculate climate relevance adjustment
      const relevanceAdjustment = userClimateRelevanceScore / 100 * 0.2;

      // Calculate final score (weighted average)
      const finalScore = (
        skillScore * 0.5 +
        locationScore * 0.2 +
        jobTypeScore * 0.15 +
        workEnvScore * 0.15
      ) + relevanceAdjustment;

      // Only include matches with score >= 0.6 (60%)
      if (finalScore >= 0.6) {
        // Generate match reasons
        const matchReasons: string[] = [];

        if (requiredMatches.length > 0) {
          matchReasons.push(`You have ${requiredMatches.length} of ${requiredSkills.length} required skills`);
        }

        if (preferredMatches.length > 0) {
          matchReasons.push(`You have ${preferredMatches.length} of ${preferredSkills.length} preferred skills`);
        }

        if (locationScore > 0.8) {
          matchReasons.push(`Job location matches your preferences`);
        }

        if (jobTypeScore > 0.8) {
          matchReasons.push(`Job type (${job.job_type}) matches your preferences`);
        }

        if (workEnvScore > 0.8) {
          matchReasons.push(`Work environment (${job.work_environment}) matches your preferences`);
        }

        // Add to matches
        matches.push({
          job_seeker_id: userId,
          job_listing_id: job.id,
          match_score: finalScore,
          match_reasons: matchReasons,
          skill_gaps: requiredSkills.filter(s => !userSkills.includes(s))
        });
      }
    }

    // 6. Store matches in database
    if (matches.length > 0) {
      // First delete existing matches
      await supabase
        .from('job_matches')
        .delete()
        .eq('job_seeker_id', userId);

      // Then insert new matches
      const { error: matchError } = await supabase
        .from('job_matches')
        .insert(matches);

      if (matchError) throw matchError;
    }

    console.log(`Generated ${matches.length} job matches for user ${userId}`);
  } catch (error) {
    console.error('Error generating job matches:', error);
    throw error;
  }
};

/**
 * Generate training program recommendations for a user
 * @param userId The user ID
 * @returns A promise that resolves when training recommendations have been generated
 */
export const generateTrainingRecommendations = async (userId: string): Promise<void> => {
  try {
    // Similar implementation to job matches, but for training programs
    // This would fetch user data, training programs, and calculate matches

    // For this simulation, we'll just log a message
    console.log(`Generated training recommendations for user ${userId}`);
  } catch (error) {
    console.error('Error generating training recommendations:', error);
    throw error;
  }
};

/**
 * Generate resource recommendations for a user
 * @param userId The user ID
 * @returns A promise that resolves when resource recommendations have been generated
 */
export const generateResourceRecommendations = async (userId: string): Promise<void> => {
  try {
    // Similar implementation to job matches, but for resources
    // This would fetch user data, resources, and calculate matches

    // For this simulation, we'll just log a message
    console.log(`Generated resource recommendations for user ${userId}`);
  } catch (error) {
    console.error('Error generating resource recommendations:', error);
    throw error;
  }
};

/**
 * Generate all recommendations for a user
 * @param userId The user ID
 * @returns A promise that resolves when all recommendations have been generated
 */
export const generateAllRecommendations = async (userId: string): Promise<void> => {
  try {
    await Promise.all([
      generateJobMatches(userId),
      generateTrainingRecommendations(userId),
      generateResourceRecommendations(userId)
    ]);

    console.log(`Generated all recommendations for user ${userId}`);
  } catch (error) {
    console.error('Error generating all recommendations:', error);
    throw error;
  }
};

export default {
  generateJobMatches,
  generateTrainingRecommendations,
  generateResourceRecommendations,
  generateAllRecommendations
};
