export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          resume_url: string | null
          skills: string[] | null
          interests: string[] | null
          profile_completed: boolean
          user_type: 'job_seeker' | 'partner' | 'admin'
          organization_name: string | null
          organization_type: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association' | null
          website: string | null
          location: Json | null
          industry: string[] | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          resume_url?: string | null
          skills?: string[] | null
          interests?: string[] | null
          profile_completed?: boolean
          user_type: 'job_seeker' | 'partner' | 'admin'
          organization_name?: string | null
          organization_type?: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association' | null
          website?: string | null
          location?: Json | null
          industry?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          resume_url?: string | null
          skills?: string[] | null
          interests?: string[] | null
          profile_completed?: boolean
          user_type?: 'job_seeker' | 'partner' | 'admin'
          organization_name?: string | null
          organization_type?: 'employer' | 'training_provider' | 'educational_institution' | 'government_agency' | 'nonprofit' | 'industry_association' | null
          website?: string | null
          location?: Json | null
          industry?: string[] | null
        }
      },
      job_seeker_profiles: {
        Row: {
          id: string
          climate_relevance_score: number | null
          climate_relevance_explanation: string | null
          resume_url: string | null
          resume_processed_at: string | null
          barriers: string[] | null
          interests: string[] | null
          veteran: boolean
          international_professional: boolean
          ej_community_resident: boolean
          onboarding_completed: boolean
          onboarding_step: number
          preferred_job_types: string[] | null
          preferred_locations: string[] | null
          salary_expectations: Json | null
          willing_to_relocate: boolean
          preferred_work_environment: string[] | null
          career_goals: string | null
          highest_education: string | null
          years_of_experience: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          climate_relevance_score?: number | null
          climate_relevance_explanation?: string | null
          resume_url?: string | null
          resume_processed_at?: string | null
          barriers?: string[] | null
          interests?: string[] | null
          veteran?: boolean
          international_professional?: boolean
          ej_community_resident?: boolean
          onboarding_completed?: boolean
          onboarding_step?: number
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          salary_expectations?: Json | null
          willing_to_relocate?: boolean
          preferred_work_environment?: string[] | null
          career_goals?: string | null
          highest_education?: string | null
          years_of_experience?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          climate_relevance_score?: number | null
          climate_relevance_explanation?: string | null
          resume_url?: string | null
          resume_processed_at?: string | null
          barriers?: string[] | null
          interests?: string[] | null
          veteran?: boolean
          international_professional?: boolean
          ej_community_resident?: boolean
          onboarding_completed?: boolean
          onboarding_step?: number
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          salary_expectations?: Json | null
          willing_to_relocate?: boolean
          preferred_work_environment?: string[] | null
          career_goals?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      partner_profiles: {
        Row: {
          id: string
          organization_name: string
          organization_type: string
          website: string | null
          description: string | null
          partnership_level: string
          climate_focus: string[]
          verified: boolean
          created_at: string
          updated_at: string
          embedding: unknown | null
        }
        Insert: {
          id: string
          organization_name: string
          organization_type: string
          website?: string | null
          description?: string | null
          partnership_level?: string
          climate_focus?: string[]
          verified?: boolean
          created_at?: string
          updated_at?: string
          embedding?: unknown | null
        }
        Update: {
          id?: string
          organization_name?: string
          organization_type?: string
          website?: string | null
          description?: string | null
          partnership_level?: string
          climate_focus?: string[]
          verified?: boolean
          created_at?: string
          updated_at?: string
          embedding?: unknown | null
        }
      },
      job_listings: {
        Row: {
          id: string
          title: string
          description: string
          partner_id: string
          location: Json
          job_type: string
          salary_range: Json | null
          skills_required: string[]
          experience_level: string
          education_required: string | null
          application_url: string | null
          status: string
          climate_impact_score: number | null
          climate_impact_explanation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          partner_id: string
          location: Json
          job_type: string
          salary_range?: Json | null
          skills_required: string[]
          experience_level: string
          education_required?: string | null
          application_url?: string | null
          status?: string
          climate_impact_score?: number | null
          climate_impact_explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          partner_id?: string
          location?: Json
          job_type?: string
          salary_range?: Json | null
          skills_required?: string[]
          experience_level?: string
          education_required?: string | null
          application_url?: string | null
          status?: string
          climate_impact_score?: number | null
          climate_impact_explanation?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      training_programs: {
        Row: {
          id: string
          title: string
          description: string
          partner_id: string
          program_type: string
          duration: string
          cost: number | null
          financial_aid_available: boolean
          location: Json | null
          is_remote: boolean
          skills_taught: string[]
          prerequisites: string[] | null
          certification_offered: string | null
          enrollment_url: string | null
          status: string
          climate_relevance_score: number | null
          climate_relevance_explanation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          partner_id: string
          program_type: string
          duration: string
          cost?: number | null
          financial_aid_available?: boolean
          location?: Json | null
          is_remote?: boolean
          skills_taught: string[]
          prerequisites?: string[] | null
          certification_offered?: string | null
          enrollment_url?: string | null
          status?: string
          climate_relevance_score?: number | null
          climate_relevance_explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          partner_id?: string
          program_type?: string
          duration?: string
          cost?: number | null
          financial_aid_available?: boolean
          location?: Json | null
          is_remote?: boolean
          skills_taught?: string[]
          prerequisites?: string[] | null
          certification_offered?: string | null
          enrollment_url?: string | null
          status?: string
          climate_relevance_score?: number | null
          climate_relevance_explanation?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      job_matches: {
        Row: {
          id: string
          job_seeker_id: string
          job_listing_id: string
          match_score: number
          match_reasons: Json | null
          skill_gaps: Json | null
          viewed: boolean
          saved: boolean
          applied: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_seeker_id: string
          job_listing_id: string
          match_score: number
          match_reasons?: Json | null
          skill_gaps?: Json | null
          viewed?: boolean
          saved?: boolean
          applied?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_seeker_id?: string
          job_listing_id?: string
          match_score?: number
          match_reasons?: Json | null
          skill_gaps?: Json | null
          viewed?: boolean
          saved?: boolean
          applied?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      training_matches: {
        Row: {
          id: string
          job_seeker_id: string
          training_program_id: string
          match_score: number
          match_reasons: Json | null
          viewed: boolean
          saved: boolean
          enrolled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_seeker_id: string
          training_program_id: string
          match_score: number
          match_reasons?: Json | null
          viewed?: boolean
          saved?: boolean
          enrolled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_seeker_id?: string
          training_program_id?: string
          match_score?: number
          match_reasons?: Json | null
          viewed?: boolean
          saved?: boolean
          enrolled?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      skills: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string | null
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string | null
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      education: {
        Row: {
          id: string
          user_id: string
          institution: string
          degree: string
          field_of_study: string
          start_year: number | null
          end_year: number | null
          current: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution: string
          degree: string
          field_of_study: string
          start_year?: number | null
          end_year?: number | null
          current?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution?: string
          degree?: string
          field_of_study?: string
          start_year?: number | null
          end_year?: number | null
          current?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      work_experience: {
        Row: {
          id: string
          user_id: string
          company: string
          title: string
          description: string | null
          start_date: string
          end_date: string | null
          current: boolean
          location: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company: string
          title: string
          description?: string | null
          start_date: string
          end_date?: string | null
          current?: boolean
          location?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          current?: boolean
          location?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}