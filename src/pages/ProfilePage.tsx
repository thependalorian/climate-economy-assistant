import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Save, User } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    skills: [] as string[],
    interests: [] as string[],
    resume_url: '',
    user_type: 'job_seeker' as 'job_seeker' | 'partner' | 'admin',
  });

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          skills: profileData.skills || [],
          interests: profileData.interests || [],
          resume_url: profileData.resume_url || '',
          user_type: profileData.user_type || 'job_seeker',
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          skills: profile.skills,
          interests: profile.interests,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh data
      await fetchUserData();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingResume(true);
      setError(null);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      // Update profile with resume URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          resume_url: publicUrl,
          resume_processed_at: null // Trigger processing
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh data
      await fetchUserData();
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-neutral-200 rounded mb-4"></div>
            <div className="h-4 w-96 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">
            Profile Settings
          </h1>
          <p className="mt-2 text-neutral-600">
            Update your profile information and resume
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <div className="mb-6 flex items-center">
              <User className="mr-2 h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Basic Information</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="mt-1 input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="mt-1 input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="mt-1 input bg-neutral-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="mt-1 input"
                />
              </div>
            </div>
          </div>

          {/* Resume */}
          <div className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <FileUp className="mr-2 h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Resume</h2>
              </div>
              <div>
                <input
                  type="file"
                  id="resume"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
                <label
                  htmlFor="resume"
                  className={`btn-primary inline-flex items-center ${uploadingResume ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                </label>
              </div>
            </div>

            {profile.resume_url && (
              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileUp className="mr-2 h-5 w-5 text-neutral-600" />
                    <span className="text-sm text-neutral-900">Current Resume</span>
                  </div>
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Complete Onboarding */}
          <div className="card p-6">
            <div className="mb-6 flex items-center">
              <User className="mr-2 h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Complete Your Profile</h2>
            </div>

            <div className="space-y-4">
              <p className="text-neutral-600">
                If you haven't completed your onboarding process or need to update your detailed profile information,
                you can access the full onboarding flow using the button below.
              </p>

              <button
                type="button"
                onClick={() => navigate(profile.user_type === 'partner' ? '/onboarding/partner' : '/onboarding/job-seeker')}
                className="btn-secondary"
              >
                Complete Full Profile
              </button>
            </div>
          </div>

          {/* Save Changes */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProfileUpdate}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};