/**
 * Unified Type Definitions
 * 
 * This file provides unified type definitions that align with:
 * - Supabase database schema
 * - Pydantic models (Zod schemas)
 * - Frontend form requirements
 * 
 * These types ensure data consistency across the entire application.
 */

import { Database } from '../lib/database.types';

// Base types from Supabase
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type JobSeekerProfileRow = Database['public']['Tables']['job_seeker_profiles']['Row'];
export type PartnerProfileRow = Database['public']['Tables']['partner_profiles']['Row'];

// Standardized Location type (matches frontend usage)
export interface LocationData {
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Standardized Salary Expectations (matches frontend usage)
export interface SalaryExpectations {
  min: string;
  max: string;
  type: 'hourly' | 'annual' | 'contract';
  currency?: string;
}

// Unified User Profile (matches user_profiles table exactly)
export interface UnifiedUserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  location: LocationData | null;
  user_type: 'job_seeker' | 'partner' | 'admin';
  profile_completed: boolean;
  
  // Organization fields (for partners)
  organization_name: string | null;
  organization_type: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association' | null;
  website: string | null;
  
  // Additional fields aligned with database
  resume_url: string | null;
  skills: string[] | null;
  interests: string[] | null;
  industry: string[] | null;
}

// Unified Job Seeker Profile (matches job_seeker_profiles table exactly)
export interface UnifiedJobSeekerProfile {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Resume and AI processing
  resume_url: string | null;
  resume_processed_at: string | null;
  climate_relevance_score: number | null;
  climate_relevance_explanation: string | null;
  
  // Personal characteristics
  veteran: boolean;
  international_professional: boolean;
  ej_community_resident: boolean;
  returning_citizen: boolean; // Added from database schema
  
  // Onboarding
  onboarding_completed: boolean;
  onboarding_step: number;
  
  // Preferences and goals
  barriers: string[] | null;
  interests: string[] | null;
  preferred_job_types: string[] | null;
  preferred_locations: string[] | null;
  preferred_work_environment: string[] | null;
  willing_to_relocate: boolean;
  salary_expectations: SalaryExpectations | null;
  career_goals: string | null;
  
  // Education and experience
  highest_education: string | null;
  years_of_experience: string | null;
  
  // Resume processing fields
  resume_filename: string | null;
  resume_parsed: boolean;
  has_resume: boolean;
  will_upload_later: boolean;
}

// Unified Partner Profile (matches partner_profiles table exactly)
export interface UnifiedPartnerProfile {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Organization details
  organization_name: string;
  organization_type: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association';
  website: string;
  description: string;
  
  // Partnership details
  partnership_level: 'basic' | 'standard' | 'premium' | 'enterprise';
  climate_focus: string[];
  verified: boolean;
  
  // Contact and location
  industry: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  location: LocationData | null;
  
  // Partnership benefits and requirements
  partnership_benefits: string[] | null;
  partnership_requirements: string[] | null;
  
  // Vector embedding for AI matching
  embedding: number[] | null;
}

// Admin Profile (matches admin_profiles table)
export interface UnifiedAdminProfile {
  id: string;
  created_at: string;
  updated_at: string;
  permissions: string[] | null;
  department: string | null;
}

// Knowledge Resource (matches knowledge_resources table)
export interface KnowledgeResource {
  id: string;
  title: string;
  description: string;
  content_type: 'pdf' | 'text' | 'html' | 'markdown' | 'docx' | 'url';
  content: string;
  source_url: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  tags: string[];
  categories: string[];
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  partner_id: string | null;
  
  // Processing status fields
  content_hash: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  chunk_index: number;
  total_chunks: number;
  similarity_threshold: number;
}

// Education record (for separate table or JSON storage)
export interface EducationRecord {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

// Work Experience record (for separate table or JSON storage)
export interface ExperienceRecord {
  id: string;
  user_id: string;
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

// Skill record (for separate table or JSON storage)
export interface SkillRecord {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience: number | null;
  created_at: string;
  updated_at: string;
}

// Form data types for frontend components
export interface PersonalInfoFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: LocationData;
}

export interface JobSeekerPreferencesFormData {
  preferred_job_types: string[];
  preferred_work_environment: string[];
  willing_to_relocate: boolean;
  preferred_locations: string[];
  salary_expectations: SalaryExpectations;
  career_goals: string;
}

export interface PartnerOnboardingFormData {
  organization_name: string;
  organization_type: string;
  website: string;
  description: string;
  climate_focus: string[];
  partnership_level: string;
}

// Form data for creating user profiles
export interface CreateUserProfileData {
  id: string;
  email: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  organization_type?: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association';
}

// Form data for creating job seeker profiles
export interface CreateJobSeekerProfileData {
  veteran?: boolean;
  international_professional?: boolean;
  ej_community_resident?: boolean;
  returning_citizen?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  willing_to_relocate?: boolean;
  barriers?: string[];
  interests?: string[];
  preferred_job_types?: string[];
  preferred_locations?: string[];
  preferred_work_environment?: string[];
  salary_expectations?: SalaryExpectations;
  career_goals?: string;
  highest_education?: string;
  years_of_experience?: string;
}

// Form data for creating partner profiles
export interface CreatePartnerProfileData {
  website?: string;
  description?: string;
  partnership_level?: 'basic' | 'standard' | 'premium' | 'enterprise';
  climate_focus?: string[];
  verified?: boolean;
  industry?: string[];
  contact_email?: string;
  contact_phone?: string;
  location?: LocationData;
  partnership_benefits?: string[];
  partnership_requirements?: string[];
}

// Combined profile for frontend usage
export interface CombinedUserProfile extends Omit<UnifiedUserProfile, 'skills'> {
  job_seeker_profile?: UnifiedJobSeekerProfile;
  partner_profile?: UnifiedPartnerProfile;
  admin_profile?: UnifiedAdminProfile;
  education?: EducationRecord[];
  experience?: ExperienceRecord[];
  skills?: SkillRecord[];
  user_skills?: string[];
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Validation helpers
export const isJobSeeker = (profile: UnifiedUserProfile): boolean => {
  return profile.user_type === 'job_seeker';
};

export const isPartner = (profile: UnifiedUserProfile): boolean => {
  return profile.user_type === 'partner';
};

export const isAdmin = (profile: UnifiedUserProfile): boolean => {
  return profile.user_type === 'admin';
};

// Type guards
export const isJobSeekerProfile = (profile: unknown): profile is UnifiedJobSeekerProfile => {
  return profile !== null && typeof profile === 'object' && 
         'id' in profile && typeof (profile as Record<string, unknown>).id === 'string' && 
         'onboarding_step' in profile && typeof (profile as Record<string, unknown>).onboarding_step === 'number';
};

export const isPartnerProfile = (profile: unknown): profile is UnifiedPartnerProfile => {
  return profile !== null && typeof profile === 'object' && 
         'id' in profile && typeof (profile as Record<string, unknown>).id === 'string' && 
         'organization_name' in profile && typeof (profile as Record<string, unknown>).organization_name === 'string';
};

export const isAdminProfile = (profile: unknown): profile is UnifiedAdminProfile => {
  return profile !== null && typeof profile === 'object' && 
         'id' in profile && typeof (profile as Record<string, unknown>).id === 'string' && 
         'permissions' in profile && Array.isArray((profile as Record<string, unknown>).permissions);
};
