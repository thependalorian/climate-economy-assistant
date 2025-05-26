import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { AlertTriangle } from 'lucide-react';

interface PartnerProfile {
  id: string;
  organization_name: string;
  organization_type: string;
  website?: string;
  description?: string;
  climate_focus?: string[];
  services_offered?: string[];
  target_audience?: string[];
  logo_url?: string;
  verified: boolean;
}

export const PartnerStep4: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch partner profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('partner_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setPartnerProfile(data as PartnerProfile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Unable to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setError('You must accept the terms and conditions to continue');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Update partner profile (note: partner_profiles doesn't have onboarding_completed)
      // Just mark as verified for now
      const { error: partnerError } = await supabase
        .from('partner_profiles')
        .update({
          verified: true
        })
        .eq('id', user.id);

      if (partnerError) throw partnerError;

      // Update user profile
      const { error: userError } = await supabase
        .from('user_profiles')
        .update({
          profile_completed: true
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Redirect to partner dashboard
      navigate('/partner-dashboard');
    } catch (err: unknown) {
      console.error('Error completing onboarding:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/partner/step3');
  };

  // Format organization type for display
  const formatOrganizationType = (type: string) => {
    if (!type) return 'Not specified';

    const typeMap: Record<string, string> = {
      employer: 'Employer',
      training_provider: 'Training Provider',
      educational_institution: 'Educational Institution',
      government_agency: 'Government Agency',
      nonprofit: 'Nonprofit Organization',
      industry_association: 'Industry Association',
      other: 'Other'
    };

    return typeMap[type] || type;
  };

  // Format industry for display
  const formatIndustry = (industry: string) => {
    if (!industry) return '';

    const industryMap: Record<string, string> = {
      renewable_energy: 'Renewable Energy',
      energy_efficiency: 'Energy Efficiency',
      clean_transportation: 'Clean Transportation',
      grid_modernization: 'Grid Modernization',
      building_performance: 'High-Performance Buildings',
      energy_storage: 'Energy Storage',
      clean_tech: 'Clean Technology',
      other: 'Other Clean Energy Sectors'
    };

    return industryMap[industry] || industry;
  };

  // Format services for display
  const formatService = (service: string) => {
    if (!service) return '';

    const serviceMap: Record<string, string> = {
      jobs: 'Job Opportunities',
      internships: 'Internships',
      apprenticeships: 'Apprenticeships',
      training: 'Training Programs',
      education: 'Educational Programs',
      resources: 'Resources and Support Services'
    };

    return serviceMap[service] || service;
  };

  // Format audience for display
  const formatAudience = (audience: string) => {
    if (!audience) return '';

    const audienceMap: Record<string, string> = {
      entry_level: 'Entry-level Workers',
      experienced: 'Experienced Professionals',
      career_changers: 'Career Changers',
      veterans: 'Veterans',
      international: 'International Professionals',
      ej_communities: 'Environmental Justice Communities'
    };

    return audienceMap[audience] || audience;
  };

  if (loading) {
    return (
      <OnboardingLayout
        currentStep={4}
        totalSteps={4}
        title="Review & Submit"
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
      currentStep={4}
      totalSteps={4}
      title="Review & Submit"
      description="Review your organization information and submit for verification."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
            {error}
          </div>
        )}

        {/* Profile summary */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">
              Organization Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Please review the information below before submitting.
            </p>
          </div>

          <div className="border-t border-neutral-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-neutral-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Organization name</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.organization_name || 'Not provided'}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Organization type</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.organization_type ? formatOrganizationType(partnerProfile.organization_type) : 'Not provided'}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Website</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.website ? (
                    <a href={partnerProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                      {partnerProfile.website}
                    </a>
                  ) : 'Not provided'}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Industry</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.industry && partnerProfile.industry.length > 0
                    ? partnerProfile.industry.map(formatIndustry).join(', ')
                    : 'Not specified'}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Services offered</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.services_offered && partnerProfile.services_offered.length > 0
                    ? partnerProfile.services_offered.map(formatService).join(', ')
                    : 'Not specified'}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Target audience</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.target_audience && partnerProfile.target_audience.length > 0
                    ? partnerProfile.target_audience.map(formatAudience).join(', ')
                    : 'Not specified'}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-neutral-500">Logo</dt>
                <dd className="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                  {partnerProfile?.logo_url ? (
                    <div className="h-12 w-12 rounded-md border border-neutral-300 overflow-hidden">
                      <img src={partnerProfile.logo_url} alt="Organization logo" className="h-full w-full object-contain" />
                    </div>
                  ) : 'Not uploaded'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Verification notice */}
        <div className="bg-amber-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Verification Required
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Your organization profile will be reviewed by our team before you can post opportunities.
                  This typically takes 1-2 business days. You'll receive an email notification once your
                  account is verified.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
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
              By submitting this form, I confirm that all information provided is accurate and I agree to the{' '}
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
            disabled={submitting || !termsAccepted}
            className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              termsAccepted
                ? 'bg-primary-600 hover:bg-primary-700'
                : 'bg-neutral-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default PartnerStep4;
