/**
 * Profile Service - Handles user profile creation and management
 * 
 * This service provides centralized profile management with proper error handling
 * and fallback mechanisms for RLS policy issues.
 */

import { supabase } from './supabase';
import type { 
  UnifiedUserProfile, 
  UnifiedJobSeekerProfile, 
  UnifiedPartnerProfile, 
  CreateUserProfileData,
  CreateJobSeekerProfileData,
  CreatePartnerProfileData
} from '../types/unified';

// Service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Legacy interface for backward compatibility
export interface UserProfile {
  id: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  profile_completed: boolean;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  organization_type: string | null;
}

// Legacy interface for backward compatibility
export interface CreateProfileData {
  id: string;
  email: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  organization_type?: string;
}

/**
 * Creates a user profile in the database
 */
export async function createUserProfile(
  profileData: CreateUserProfileData
): Promise<ServiceResponse<UnifiedUserProfile>> {
  try {
    console.log('🔄 ProfileService: Creating user profile for:', profileData.id);

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: profileData.id,
        email: profileData.email,
        user_type: profileData.user_type,
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null,
        organization_name: profileData.organization_name || null,
        organization_type: profileData.organization_type || null,
        profile_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ProfileService: Error creating user profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ ProfileService: User profile created successfully');
    return { success: true, data: data as UnifiedUserProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception creating user profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Creates a job seeker profile in the database
 */
export async function createJobSeekerProfile(
  userId: string,
  profileData?: Partial<CreateJobSeekerProfileData>
): Promise<ServiceResponse<UnifiedJobSeekerProfile>> {
  try {
    console.log('🔄 ProfileService: Creating job seeker profile for:', userId);

    const { data, error } = await supabase
      .from('job_seeker_profiles')
      .insert({
        id: userId,
        veteran: profileData?.veteran ?? false,
        international_professional: profileData?.international_professional ?? false,
        ej_community_resident: profileData?.ej_community_resident ?? false,
        returning_citizen: profileData?.returning_citizen ?? false,
        onboarding_completed: profileData?.onboarding_completed ?? false,
        onboarding_step: profileData?.onboarding_step ?? 1,
        willing_to_relocate: profileData?.willing_to_relocate ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ProfileService: Error creating job seeker profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ ProfileService: Job seeker profile created successfully');
    return { success: true, data: data as UnifiedJobSeekerProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception creating job seeker profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Creates a partner profile in the database
 */
export async function createPartnerProfile(
  userId: string,
  organizationName: string,
  organizationType: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association',
  profileData?: Partial<CreatePartnerProfileData>
): Promise<ServiceResponse<UnifiedPartnerProfile>> {
  try {
    console.log('🔄 ProfileService: Creating partner profile for:', userId);

    const { data, error } = await supabase
      .from('partner_profiles')
      .insert({
        id: userId,
        organization_name: organizationName,
        organization_type: organizationType,
        website: profileData?.website || 'https://example.com',
        description: profileData?.description || 'New partner organization',
        partnership_level: profileData?.partnership_level || 'standard',
        climate_focus: profileData?.climate_focus || ['renewable_energy'],
        verified: profileData?.verified ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ProfileService: Error creating partner profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ ProfileService: Partner profile created successfully');
    return { success: true, data: data as UnifiedPartnerProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception creating partner profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Retrieves a user profile from the database
 */
export async function getUserProfile(userId: string): Promise<ServiceResponse<UnifiedUserProfile>> {
  try {
    console.log('🔄 ProfileService: Fetching user profile for:', userId);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ ProfileService: Error fetching user profile:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.warn('⚠️ ProfileService: No user profile found for:', userId);
      return { success: false, error: 'Profile not found' };
    }

    console.log('✅ ProfileService: User profile fetched successfully');
    return { success: true, data: data as UnifiedUserProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception fetching user profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Retrieves a job seeker profile from the database
 */
export async function getJobSeekerProfile(userId: string): Promise<ServiceResponse<UnifiedJobSeekerProfile>> {
  try {
    console.log('🔄 ProfileService: Fetching job seeker profile for:', userId);

    const { data, error } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ ProfileService: Error fetching job seeker profile:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.warn('⚠️ ProfileService: No job seeker profile found for:', userId);
      return { success: false, error: 'Job seeker profile not found' };
    }

    console.log('✅ ProfileService: Job seeker profile fetched successfully');
    return { success: true, data: data as UnifiedJobSeekerProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception fetching job seeker profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Retrieves a partner profile from the database
 */
export async function getPartnerProfile(userId: string): Promise<ServiceResponse<UnifiedPartnerProfile>> {
  try {
    console.log('🔄 ProfileService: Fetching partner profile for:', userId);

    const { data, error } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ ProfileService: Error fetching partner profile:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.warn('⚠️ ProfileService: No partner profile found for:', userId);
      return { success: false, error: 'Partner profile not found' };
    }

    console.log('✅ ProfileService: Partner profile fetched successfully');
    return { success: true, data: data as UnifiedPartnerProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception fetching partner profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates a user profile in the database
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UnifiedUserProfile>
): Promise<ServiceResponse<UnifiedUserProfile>> {
  try {
    console.log('🔄 ProfileService: Updating user profile for:', userId);

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ ProfileService: Error updating user profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ ProfileService: User profile updated successfully');
    return { success: true, data: data as UnifiedUserProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception updating user profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates a job seeker profile in the database
 */
export async function updateJobSeekerProfile(
  userId: string,
  updates: Partial<UnifiedJobSeekerProfile>
): Promise<ServiceResponse<UnifiedJobSeekerProfile>> {
  try {
    console.log('🔄 ProfileService: Updating job seeker profile for:', userId);

    const { data, error } = await supabase
      .from('job_seeker_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ ProfileService: Error updating job seeker profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ ProfileService: Job seeker profile updated successfully');
    return { success: true, data: data as UnifiedJobSeekerProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception updating job seeker profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates a partner profile in the database
 */
export async function updatePartnerProfile(
  userId: string,
  updates: Partial<UnifiedPartnerProfile>
): Promise<ServiceResponse<UnifiedPartnerProfile>> {
  try {
    console.log('🔄 ProfileService: Updating partner profile for:', userId);

    const { data, error } = await supabase
      .from('partner_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ ProfileService: Error updating partner profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ ProfileService: Partner profile updated successfully');
    return { success: true, data: data as UnifiedPartnerProfile };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ ProfileService: Exception updating partner profile:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Checks if a user profile exists
 */
export async function profileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function createProfile(profileData: CreateProfileData): Promise<ServiceResponse<UserProfile>> {
  const result = await createUserProfile({
    id: profileData.id,
    email: profileData.email,
    user_type: profileData.user_type,
    first_name: profileData.first_name,
    last_name: profileData.last_name,
    organization_name: profileData.organization_name,
    organization_type: profileData.organization_type as 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association' | undefined,
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: {
        id: result.data.id,
        user_type: result.data.user_type,
        profile_completed: result.data.profile_completed,
        email: result.data.email,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        organization_name: result.data.organization_name,
        organization_type: result.data.organization_type,
      }
    };
  }

  return { success: false, error: result.error };
} 