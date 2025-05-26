import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';

interface FormData {
  services_offered: string[];
  target_audience: string[];
  hiring_timeline: string;
  custom_fields: Record<string, unknown>;
}

export const PartnerStep2: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    services_offered: [],
    target_audience: [],
    hiring_timeline: '',
    custom_fields: {}
  });

  // Fetch existing data if available
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch partner profile if it exists
        const { data: partnerData, error: partnerError } = await supabase
          .from('partner_profiles')
          .select('services_offered, target_audience, hiring_timeline, custom_fields')
          .eq('id', user.id)
          .single();

        // It's okay if partner profile doesn't exist yet
        if (partnerError && partnerError.code !== 'PGRST116') {
          throw partnerError;
        }

        // Pre-fill form with existing data
        if (partnerData) {
          setFormData({
            services_offered: partnerData.services_offered || [],
            target_audience: partnerData.target_audience || [],
            hiring_timeline: partnerData.hiring_timeline || '',
            custom_fields: partnerData.custom_fields || {}
          });
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load your profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    if (field === 'services_offered' || field === 'target_audience') {
      if (checked) {
        setFormData({
          ...formData,
          [field]: [...formData[field], value]
        });
      } else {
        setFormData({
          ...formData,
          [field]: formData[field].filter(item => item !== value)
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Update partner profile
      const { error: updateError } = await supabase
        .from('partner_profiles')
        .update({
          services_offered: formData.services_offered,
          target_audience: formData.target_audience,
          hiring_timeline: formData.hiring_timeline,
          custom_fields: formData.custom_fields
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Proceed to next step
      navigate('/onboarding/partner/step3');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/partner/step1');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={4}
      title="Services & Offerings"
      description="Tell us about the opportunities and services your organization provides."
    >
      {error && (
        <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Services offered */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            What does your organization offer? (select all that apply)
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="jobs"
                type="checkbox"
                value="jobs"
                checked={formData.services_offered.includes('jobs')}
                onChange={(e) => handleCheckboxChange('services_offered', 'jobs', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="jobs" className="ml-3 block text-sm text-neutral-700">
                Job opportunities
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="internships"
                type="checkbox"
                value="internships"
                checked={formData.services_offered.includes('internships')}
                onChange={(e) => handleCheckboxChange('services_offered', 'internships', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="internships" className="ml-3 block text-sm text-neutral-700">
                Internships
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="apprenticeships"
                type="checkbox"
                value="apprenticeships"
                checked={formData.services_offered.includes('apprenticeships')}
                onChange={(e) => handleCheckboxChange('services_offered', 'apprenticeships', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="apprenticeships" className="ml-3 block text-sm text-neutral-700">
                Apprenticeships
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="training"
                type="checkbox"
                value="training"
                checked={formData.services_offered.includes('training')}
                onChange={(e) => handleCheckboxChange('services_offered', 'training', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="training" className="ml-3 block text-sm text-neutral-700">
                Training programs
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="education"
                type="checkbox"
                value="education"
                checked={formData.services_offered.includes('education')}
                onChange={(e) => handleCheckboxChange('services_offered', 'education', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="education" className="ml-3 block text-sm text-neutral-700">
                Educational programs
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="resources"
                type="checkbox"
                value="resources"
                checked={formData.services_offered.includes('resources')}
                onChange={(e) => handleCheckboxChange('services_offered', 'resources', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="resources" className="ml-3 block text-sm text-neutral-700">
                Resources and support services
              </label>
            </div>
          </div>
        </div>

        {/* Target audience */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Who is your target audience? (select all that apply)
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="entry_level"
                type="checkbox"
                value="entry_level"
                checked={formData.target_audience.includes('entry_level')}
                onChange={(e) => handleCheckboxChange('target_audience', 'entry_level', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="entry_level" className="ml-3 block text-sm text-neutral-700">
                Entry-level workers
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="experienced"
                type="checkbox"
                value="experienced"
                checked={formData.target_audience.includes('experienced')}
                onChange={(e) => handleCheckboxChange('target_audience', 'experienced', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="experienced" className="ml-3 block text-sm text-neutral-700">
                Experienced professionals
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="career_changers"
                type="checkbox"
                value="career_changers"
                checked={formData.target_audience.includes('career_changers')}
                onChange={(e) => handleCheckboxChange('target_audience', 'career_changers', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="career_changers" className="ml-3 block text-sm text-neutral-700">
                Career changers
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="veterans"
                type="checkbox"
                value="veterans"
                checked={formData.target_audience.includes('veterans')}
                onChange={(e) => handleCheckboxChange('target_audience', 'veterans', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="veterans" className="ml-3 block text-sm text-neutral-700">
                Veterans
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="international"
                type="checkbox"
                value="international"
                checked={formData.target_audience.includes('international')}
                onChange={(e) => handleCheckboxChange('target_audience', 'international', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="international" className="ml-3 block text-sm text-neutral-700">
                International professionals
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="ej_communities"
                type="checkbox"
                value="ej_communities"
                checked={formData.target_audience.includes('ej_communities')}
                onChange={(e) => handleCheckboxChange('target_audience', 'ej_communities', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="ej_communities" className="ml-3 block text-sm text-neutral-700">
                Environmental Justice communities
              </label>
            </div>
          </div>
        </div>

        {/* Hiring timeline (if offering jobs) */}
        {formData.services_offered.includes('jobs') && (
          <div>
            <label htmlFor="hiring_timeline" className="block text-sm font-medium text-neutral-700">
              Typical hiring timeline
            </label>
            <select
              id="hiring_timeline"
              name="hiring_timeline"
              value={formData.hiring_timeline}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Select timeline</option>
              <option value="immediate">Immediate (0-2 weeks)</option>
              <option value="short">Short-term (2-4 weeks)</option>
              <option value="medium">Medium-term (1-3 months)</option>
              <option value="long">Long-term (3+ months)</option>
              <option value="ongoing">Ongoing/continuous</option>
            </select>
          </div>
        )}

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
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default PartnerStep2;
