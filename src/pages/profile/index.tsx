import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProfileTabs from '../../components/profile/ProfileTabs';
import PersonalInfoForm from '../../components/profile/PersonalInfoForm';
import SkillsManagement from '../../components/profile/SkillsManagement';
import EducationManagement from '../../components/profile/EducationManagement';
import ExperienceManagement from '../../components/profile/ExperienceManagement';
import PreferencesForm from '../../components/profile/PreferencesForm';
import ResumeUpload from '../../components/profile/ResumeUpload';

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
  created_at?: string;
  updated_at?: string;
  onboarding_completed?: boolean;
}

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
  resume_url?: string;
  resume_filename?: string;
  resume_parsed?: boolean;
  has_resume?: boolean;
  will_upload_later?: boolean;
  onboarding_step?: number;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CombinedProfile extends UserProfile, JobSeekerProfile {}

const ProfileManagement: React.FC = () => {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<CombinedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Fetch job seeker profile
        const { data: seekerData, error: seekerError } = await supabase
          .from('job_seeker_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (seekerError && seekerError.code !== 'PGRST116') {
          throw seekerError;
        }

        setProfile({
          ...(profileData || { id: user.id }),
          ...(seekerData || {})
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Determine which tab to show based on URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['personal', 'skills', 'education', 'experience', 'preferences', 'resume'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-neutral-900">Profile Management</h1>
          <p className="mt-1 text-neutral-600">
            Manage your profile information to improve job matches and recommendations.
          </p>
        </div>

        <ProfileTabs activeTab={activeTab} onChange={handleTabChange} />

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            </div>
          ) : (
            <>
              {activeTab === 'personal' && (
                <PersonalInfoForm profile={profile} userId={user?.id || ''} />
              )}

              {activeTab === 'skills' && (
                <SkillsManagement userId={user?.id || ''} />
              )}

              {activeTab === 'education' && (
                <EducationManagement userId={user?.id || ''} />
              )}

              {activeTab === 'experience' && (
                <ExperienceManagement userId={user?.id || ''} />
              )}

              {activeTab === 'preferences' && (
                <PreferencesForm profile={profile} userId={user?.id || ''} />
              )}

              {activeTab === 'resume' && (
                <ResumeUpload userId={user?.id || ''} profile={profile} />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileManagement;
