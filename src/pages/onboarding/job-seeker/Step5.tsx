import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { CheckCircle, FileText, MapPin, Briefcase, GraduationCap, Zap } from 'lucide-react';

interface JobSeekerProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    zip: string;
  };
  education?: Array<Record<string, unknown>>;
  work_experience?: Array<Record<string, unknown>>;
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
  onboarding_step: number;
  onboarding_completed: boolean;
}

export const JobSeekerStep5: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch user profile data
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, phone, location')
          .eq('id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        // Fetch job seeker profile data
        const { data: jobSeekerData, error: jobSeekerError } = await supabase
          .from('job_seeker_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (jobSeekerError && jobSeekerError.code !== 'PGRST116') {
          throw jobSeekerError;
        }

        // Combine the data
        if (userData && jobSeekerData) {
          setProfile({
            ...jobSeekerData,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            location: userData.location
          });
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load your profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Format education level for display
  const formatEducationLevel = (level: string) => {
    if (!level) return 'Not specified';

    const educationMap: Record<string, string> = {
      high_school: 'High School',
      associate: 'Associate\'s Degree',
      bachelor: 'Bachelor\'s Degree',
      master: 'Master\'s Degree',
      doctorate: 'Doctorate',
      vocational: 'Vocational Training',
      certification: 'Professional Certification',
      other: 'Other'
    };

    return educationMap[level] || level;
  };

  // Format years of experience for display
  const formatExperience = (years: string) => {
    if (!years) return 'Not specified';

    const experienceMap: Record<string, string> = {
      '0-1': 'Less than 1 year',
      '1-3': '1-3 years',
      '3-5': '3-5 years',
      '5-10': '5-10 years',
      '10+': '10+ years'
    };

    return experienceMap[years] || years;
  };

  // Format job type for display
  const formatJobType = (type: string) => {
    if (!type) return '';

    const jobTypeMap: Record<string, string> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      internship: 'Internship',
      apprenticeship: 'Apprenticeship'
    };

    return jobTypeMap[type] || type;
  };

  // Format work environment for display
  const formatWorkEnvironment = (env: string) => {
    if (!env) return '';

    const envMap: Record<string, string> = {
      on_site: 'On-site',
      remote: 'Remote',
      hybrid: 'Hybrid',
      field_work: 'Field work',
      travel_required: 'Travel required'
    };

    return envMap[env] || env;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setError('You must accept the terms and conditions to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Update job seeker profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          onboarding_step: 5,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update user profile (mark as completed)
      const { error: userError } = await supabase
        .from('user_profiles')
        .update({
          profile_completed: true
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/job-seeker/step4');
  };

  if (loading || !profile) {
    return (
      <OnboardingLayout
        currentStep={5}
        totalSteps={5}
        title="Review & Complete"
        description="Please wait while we load your profile information..."
      >
        <div className="flex justify-center py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={5}
      title="Review & Complete"
      description="Review your information and complete your profile setup."
    >
      {error && (
        <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile summary */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-neutral-900">
              Profile Summary
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Review your information before completing your profile setup.
            </p>
          </div>

          <div className="border-t border-neutral-200">
            {/* Personal Information */}
            <div className="bg-neutral-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="flex items-center text-sm font-medium text-neutral-500">
                <MapPin className="mr-2 h-4 w-4 text-primary-600" />
                Personal Information
              </dt>
              <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {profile.first_name} {profile.last_name}
                  </div>
                  {profile.phone && (
                    <div>
                      <span className="font-medium">Phone:</span> {profile.phone}
                    </div>
                  )}
                  {profile.location && (
                    <div>
                      <span className="font-medium">Location:</span> {profile.location.city}, {profile.location.state} {profile.location.zip}
                    </div>
                  )}
                </div>
              </dd>
            </div>

            {/* Education & Experience */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="flex items-center text-sm font-medium text-neutral-500">
                <GraduationCap className="mr-2 h-4 w-4 text-primary-600" />
                Education & Experience
              </dt>
              <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Highest Education:</span> {formatEducationLevel(profile.highest_education || '')}
                  </div>
                  <div>
                    <span className="font-medium">Years of Experience:</span> {formatExperience(profile.years_of_experience || '')}
                  </div>

                  {profile.education && profile.education.length > 0 && (
                    <div>
                      <span className="font-medium">Education:</span>
                      <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
                        {profile.education.map((edu, index) => (
                          <li key={index}>
                            {edu.degree} in {edu.field_of_study}, {edu.institution}
                            {edu.start_date && (
                              <span> ({edu.start_date} - {edu.current ? 'Present' : edu.end_date})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {profile.work_experience && profile.work_experience.length > 0 && (
                    <div>
                      <span className="font-medium">Work Experience:</span>
                      <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
                        {profile.work_experience.map((exp, index) => (
                          <li key={index}>
                            {exp.title} at {exp.company}
                            {exp.start_date && (
                              <span> ({exp.start_date} - {exp.current ? 'Present' : exp.end_date})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </dd>
            </div>

            {/* Skills & Interests */}
            <div className="bg-neutral-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="flex items-center text-sm font-medium text-neutral-500">
                <Zap className="mr-2 h-4 w-4 text-primary-600" />
                Skills & Interests
              </dt>
              <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                <div className="space-y-3">
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <span className="font-medium">Skills:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <span className="font-medium">Interests:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {profile.interests.map((interest, index) => (
                          <span key={index} className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>

            {/* Job Preferences */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="flex items-center text-sm font-medium text-neutral-500">
                <Briefcase className="mr-2 h-4 w-4 text-primary-600" />
                Job Preferences
              </dt>
              <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                <div className="space-y-2">
                  {profile.preferred_job_types && profile.preferred_job_types.length > 0 && (
                    <div>
                      <span className="font-medium">Preferred Job Types:</span> {profile.preferred_job_types.map(formatJobType).join(', ')}
                    </div>
                  )}

                  {profile.preferred_work_environment && profile.preferred_work_environment.length > 0 && (
                    <div>
                      <span className="font-medium">Preferred Work Environment:</span> {profile.preferred_work_environment.map(formatWorkEnvironment).join(', ')}
                    </div>
                  )}

                  {profile.salary_expectations && (
                    <div>
                      <span className="font-medium">Salary Expectations:</span>
                      {profile.salary_expectations.min && profile.salary_expectations.max ? (
                        <span> ${profile.salary_expectations.min} - ${profile.salary_expectations.max} {profile.salary_expectations.type === 'yearly' ? 'per year' : 'per hour'}</span>
                      ) : (
                        <span> Not specified</span>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="font-medium">Willing to Relocate:</span> {profile.willing_to_relocate ? 'Yes' : 'No'}
                  </div>

                  {profile.willing_to_relocate && profile.preferred_locations && profile.preferred_locations.length > 0 && (
                    <div>
                      <span className="font-medium">Preferred Locations:</span> {profile.preferred_locations.join(', ')}
                    </div>
                  )}
                </div>
              </dd>
            </div>

            {/* Resume */}
            <div className="bg-neutral-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="flex items-center text-sm font-medium text-neutral-500">
                <FileText className="mr-2 h-4 w-4 text-primary-600" />
                Resume
              </dt>
              <dd className="mt-1 text-sm text-neutral-900 sm:col-span-2 sm:mt-0">
                {profile.resume_url && profile.resume_filename ? (
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-success-600" />
                    <span>{profile.resume_filename}</span>
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-primary-600 hover:text-primary-800"
                    >
                      View
                    </a>
                  </div>
                ) : profile.will_upload_later ? (
                  <span>Will upload later</span>
                ) : profile.has_resume ? (
                  <span className="text-amber-600">No resume uploaded</span>
                ) : (
                  <span className="text-neutral-500">No resume</span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* Completion message */}
        <div className="rounded-md bg-success-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-success-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-success-800">Profile Ready</h3>
              <div className="mt-2 text-sm text-success-700">
                <p>
                  Your profile is ready to be completed. After completing your profile, you'll be able to:
                </p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Browse and apply for jobs in the clean energy sector</li>
                  <li>Get matched with relevant opportunities based on your skills and interests</li>
                  <li>Access training resources and career development tools</li>
                  <li>Connect with employers and organizations in the clean energy economy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="relative flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-neutral-700">
              I agree to the terms and conditions
            </label>
            <p className="text-neutral-500">
              By completing this profile, I confirm that all information provided is accurate and I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              termsAccepted
                ? 'bg-primary-600 hover:bg-primary-700'
                : 'bg-neutral-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Completing...' : 'Complete Setup'}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default JobSeekerStep5;
