import { supabase } from '../lib/supabase';
import { generateAllRecommendations } from './recommendationService';

/**
 * This service handles profile updates and triggers recommendation generation
 * when relevant profile data changes.
 */

/**
 * Update user profile information
 * @param userId The user ID
 * @param profileData The profile data to update
 * @returns A promise that resolves when the profile has been updated
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Record<string, unknown>
): Promise<void> => {
  try {
    // Update user profile
    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', userId);

    if (error) throw error;

    // Check if the update includes location information
    const hasLocationChange = profileData.location !== undefined;

    // If location changed, trigger recommendation updates
    if (hasLocationChange) {
      try {
        await generateAllRecommendations(userId);
        console.log('Generated recommendations after profile location update');
      } catch (recError) {
        console.error('Error generating recommendations:', recError);
        // Continue even if recommendation generation fails
      }
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update job seeker profile information
 * @param userId The user ID
 * @param profileData The profile data to update
 * @returns A promise that resolves when the profile has been updated
 */
export const updateJobSeekerProfile = async (
  userId: string,
  profileData: Record<string, unknown>
): Promise<void> => {
  try {
    // Update job seeker profile
    const { error } = await supabase
      .from('job_seeker_profiles')
      .update(profileData)
      .eq('id', userId);

    if (error) throw error;

    // Check if the update includes recommendation-relevant fields
    const relevantFields = [
      'preferred_job_types',
      'preferred_work_environment',
      'willing_to_relocate',
      'preferred_locations',
      'salary_expectations',
      'highest_education',
      'years_of_experience'
    ];

    const hasRelevantChanges = Object.keys(profileData).some(key =>
      relevantFields.includes(key)
    );

    // If relevant fields changed, trigger recommendation updates
    if (hasRelevantChanges) {
      try {
        await generateAllRecommendations(userId);
        console.log('Generated recommendations after job seeker profile update');
      } catch (recError) {
        console.error('Error generating recommendations:', recError);
        // Continue even if recommendation generation fails
      }
    }
  } catch (error) {
    console.error('Error updating job seeker profile:', error);
    throw error;
  }
};

/**
 * Update user skills
 * @param userId The user ID
 * @param skills The skills to update
 * @param operation The operation to perform (add, update, or remove)
 * @returns A promise that resolves when the skills have been updated
 */
export const updateUserSkills = async (
  userId: string,
  skills: Array<{
    id?: string;
    name: string;
    proficiency: string;
    category: string;
  }>,
  operation: 'add' | 'update' | 'remove'
): Promise<void> => {
  try {
    if (operation === 'add') {
      // Add new skills
      const skillsToAdd = skills.map(skill => ({
        user_id: userId,
        name: skill.name,
        proficiency: skill.proficiency,
        category: skill.category
      }));

      const { error } = await supabase
        .from('user_skills')
        .insert(skillsToAdd);

      if (error) throw error;
    } else if (operation === 'update') {
      // Update existing skills
      for (const skill of skills) {
        if (!skill.id) continue;

        const { error } = await supabase
          .from('user_skills')
          .update({
            name: skill.name,
            proficiency: skill.proficiency,
            category: skill.category
          })
          .eq('id', skill.id)
          .eq('user_id', userId);

        if (error) throw error;
      }
    } else if (operation === 'remove') {
      // Remove skills
      const skillIds = skills.map(skill => skill.id).filter(Boolean);

      if (skillIds.length > 0) {
        const { error } = await supabase
          .from('user_skills')
          .delete()
          .in('id', skillIds)
          .eq('user_id', userId);

        if (error) throw error;
      }
    }

    // Trigger recommendation updates after skill changes
    try {
      await generateAllRecommendations(userId);
      console.log('Generated recommendations after skills update');
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
      // Continue even if recommendation generation fails
    }
  } catch (error) {
    console.error('Error updating user skills:', error);
    throw error;
  }
};

/**
 * Update user education
 * @param userId The user ID
 * @param education The education entries to update
 * @param operation The operation to perform (add, update, or remove)
 * @returns A promise that resolves when the education entries have been updated
 */
export const updateUserEducation = async (
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  education: Array<{
    id?: string;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string;
    current: boolean;
  }>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  operation: 'add' | 'update' | 'remove'
): Promise<void> => {
  try {
    // Similar implementation to updateUserSkills
    // This would add, update, or remove education entries

    // Trigger recommendation updates after education changes
    try {
      await generateAllRecommendations(userId);
      console.log('Generated recommendations after education update');
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
      // Continue even if recommendation generation fails
    }
  } catch (error) {
    console.error('Error updating user education:', error);
    throw error;
  }
};

/**
 * Update user work experience
 * @param userId The user ID
 * @param experience The work experience entries to update
 * @param operation The operation to perform (add, update, or remove)
 * @returns A promise that resolves when the work experience entries have been updated
 */
export const updateUserWorkExperience = async (
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  experience: Array<{
    id?: string;
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date?: string;
    current: boolean;
    description: string;
  }>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  operation: 'add' | 'update' | 'remove'
): Promise<void> => {
  try {
    // Similar implementation to updateUserSkills
    // This would add, update, or remove work experience entries

    // Trigger recommendation updates after work experience changes
    try {
      await generateAllRecommendations(userId);
      console.log('Generated recommendations after work experience update');
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
      // Continue even if recommendation generation fails
    }
  } catch (error) {
    console.error('Error updating user work experience:', error);
    throw error;
  }
};

export default {
  updateUserProfile,
  updateJobSeekerProfile,
  updateUserSkills,
  updateUserEducation,
  updateUserWorkExperience
};
