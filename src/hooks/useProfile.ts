/**
 * Enhanced Profile Management Hook
 * 
 * Comprehensive profile management with optimistic updates and completion tracking.
 * Supports job seekers, partners, and admin profiles with real-time validation.
 * 
 * Features:
 * - CRUD operations with optimistic updates
 * - Profile completion tracking
 * - Skills and experience management
 * - Education and certification tracking
 * - Analytics integration for engagement tracking
 * - Error handling with graceful degradation
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  updateUserProfile,
  updateJobSeekerProfile,
  updateUserSkills,
  updateUserEducation,
  updateUserWorkExperience
} from '../services/profileService';
import { 
  createUserProfile,
  createJobSeekerProfile,
  createPartnerProfile
} from '../lib/profileService';
import { 
  UnifiedUserProfile,
  UnifiedJobSeekerProfile,
  CreateUserProfileData,
  CreateJobSeekerProfileData,
  CreatePartnerProfileData
} from '../types/unified';
import { UserType, OrganizationType } from '../types/auth';

/**
 * useProfile Hook
 * 
 * Comprehensive profile management hook with:
 * - Profile creation and updates
 * - Skills, education, and experience management
 * - Error handling and validation
 * - Loading states
 * - Optimistic updates
 * 
 * Located in /hooks/ for profile management operations
 */
export function useProfile() {
  const { user, profile, refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState<UnifiedUserProfile | null>(null);

  // Initialize local profile from context
  useEffect(() => {
    if (profile) {
      setLocalProfile(profile as UnifiedUserProfile);
    }
  }, [profile]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create new user profile
  const createProfile = useCallback(async (
    profileData: CreateUserProfileData
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createUserProfile(profileData);
      
      if (result.success) {
        // Refresh session to get updated profile
        await refreshSession();
      } else {
        setError(result.error || 'Failed to create profile');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [refreshSession]);

  // Create job seeker profile
  const createJobSeekerSubProfile = useCallback(async (
    profileData: CreateJobSeekerProfileData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createJobSeekerProfile(user.id, profileData);
      
      if (result.success) {
        await refreshSession();
      } else {
        setError(result.error || 'Failed to create job seeker profile');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job seeker profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshSession]);

  // Create partner profile
  const createPartnerSubProfile = useCallback(async (
    organizationName: string,
    organizationType: OrganizationType,
    profileData?: CreatePartnerProfileData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createPartnerProfile(user.id, organizationName, organizationType, profileData);
      
      if (result.success) {
        await refreshSession();
      } else {
        setError(result.error || 'Failed to create partner profile');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create partner profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshSession]);

  // Update user profile with optimistic updates
  const updateProfile = useCallback(async (
    updates: Partial<UnifiedUserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    // Optimistic update
    if (localProfile) {
      setLocalProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    
    try {
      await updateUserProfile(user.id, updates);
      
      // Refresh session to get updated profile from server
      await refreshSession();
      
      return { success: true };
    } catch (err) {
      // Revert optimistic update on error
      setLocalProfile(profile as UnifiedUserProfile);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, localProfile, profile, refreshSession]);

  // Update job seeker profile
  const updateJobSeekerSubProfile = useCallback(async (
    updates: Partial<UnifiedJobSeekerProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await updateJobSeekerProfile(user.id, updates);
      await refreshSession();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job seeker profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshSession]);

  // Update skills
  const updateSkills = useCallback(async (
    skills: Array<{
      id?: string;
      name: string;
      proficiency: string;
      category: string;
    }>,
    operation: 'add' | 'update' | 'remove'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await updateUserSkills(user.id, skills, operation);
      await refreshSession();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update skills';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshSession]);

  // Update education
  const updateEducation = useCallback(async (
    education: Array<{
      id?: string;
      institution: string;
      degree: string;
      field_of_study: string;
      start_date: string;
      end_date?: string;
      current: boolean;
    }>,
    operation: 'add' | 'update' | 'remove'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await updateUserEducation(user.id, education, operation);
      await refreshSession();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update education';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshSession]);

  // Update work experience
  const updateWorkExperience = useCallback(async (
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
    operation: 'add' | 'update' | 'remove'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await updateUserWorkExperience(user.id, experience, operation);
      await refreshSession();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update work experience';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshSession]);

  // Mark profile as completed
  const markProfileCompleted = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return updateProfile({ profile_completed: true });
  }, [updateProfile]);

  // Check if profile is complete based on user type
  const isProfileComplete = useCallback((): boolean => {
    if (!localProfile) return false;

    const hasBasicInfo = !!(
      localProfile.first_name &&
      localProfile.last_name &&
      localProfile.email
    );

    if (localProfile.user_type === UserType.Partner) {
      return hasBasicInfo && !!(
        localProfile.organization_name &&
        localProfile.organization_type
      );
    }

    return hasBasicInfo;
  }, [localProfile]);

  return {
    // Profile data
    profile: localProfile,
    isProfileComplete: isProfileComplete(),
    
    // Profile creation
    createProfile,
    createJobSeekerSubProfile,
    createPartnerSubProfile,
    
    // Profile updates
    updateProfile,
    updateJobSeekerSubProfile,
    updateSkills,
    updateEducation,
    updateWorkExperience,
    markProfileCompleted,
    
    // State management
    isLoading,
    error,
    clearError,
    
    // Utilities
    refreshProfile: refreshSession
  };
} 