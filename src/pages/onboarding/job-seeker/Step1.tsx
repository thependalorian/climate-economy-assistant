import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';

interface LocationData {
  city: string;
  state: string;
  zip: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  phone: string;
  location: LocationData;
}

export const JobSeekerStep1: React.FC = () => {
  console.log('👤 JobSeekerStep1 component rendering');

  // All hooks must be called before any early returns
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(() => {
    // Pre-populate with data from registration if available
    const storedFirstName = localStorage.getItem('pendingFirstName');
    const storedLastName = localStorage.getItem('pendingLastName');

    console.log('👤 Pre-populating form with stored data:', {
      firstName: storedFirstName,
      lastName: storedLastName
    });

    return {
      first_name: storedFirstName || '',
      last_name: storedLastName || '',
      phone: '',
      location: {
        city: '',
        state: 'Massachusetts',
        zip: ''
      }
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('👤 JobSeekerStep1 - User:', user?.email);
  console.log('👤 JobSeekerStep1 - Form data:', formData);

  // Test mode disabled - component ready for production
  const isTestMode = false;
  if (isTestMode) {
    console.log('👤 JobSeekerStep1 - Early return test');
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container mx-auto max-w-3xl">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-primary-600 mb-4">Job Seeker Step 1 - Test</h1>
            <p className="text-neutral-600">This is a test to see if the job seeker component renders.</p>
            <p className="text-sm text-neutral-500 mt-4">If you see this, the job seeker component is working!</p>
          </div>
        </div>
      </div>
    );
  }

  // Note: We don't fetch existing profile data here because this is the first step
  // where we create the profile. The form is pre-populated with registration data.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof FormData] as Record<string, unknown>,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create or update user profile
      const { data: existingUserProfile, error: checkUserError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkUserError && checkUserError.code !== 'PGRST116') throw checkUserError;

      if (!existingUserProfile) {
        console.log('👤 Creating user profile for job seeker');

        // Create user profile if it doesn't exist
        const { error: createUserError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            user_type: 'job_seeker',
            profile_completed: false,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            location: formData.location
          });

        if (createUserError) throw createUserError;

        console.log('✅ User profile created successfully');

        // Clear the stored registration data since we've now created the profile
        localStorage.removeItem('pendingUserType');
        localStorage.removeItem('pendingFirstName');
        localStorage.removeItem('pendingLastName');
      } else {
        console.log('👤 Updating existing user profile');

        // Update existing user profile
        const { error: updateUserError } = await supabase
          .from('user_profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            location: formData.location,
            user_type: 'job_seeker'
          })
          .eq('id', user.id);

        if (updateUserError) throw updateUserError;
      }

      // Check if job seeker profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('job_seeker_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      // Create job seeker profile if it doesn't exist
      if (!existingProfile) {
        const { error: createError } = await supabase
          .from('job_seeker_profiles')
          .insert({
            id: user.id,
            onboarding_step: 1,
            onboarding_completed: false
          });

        if (createError) throw createError;
      } else {
        // Update onboarding step
        const { error: stepError } = await supabase
          .from('job_seeker_profiles')
          .update({
            onboarding_step: 1
          })
          .eq('id', user.id);

        if (stepError) throw stepError;
      }

      // Proceed to next step
      navigate('/onboarding/job-seeker/step2');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={5}
      title="Tell us about yourself"
      description="Let's start with some basic information to personalize your experience."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-error-50 text-sm text-error-600">
            {error}
          </div>
        )}

        {/* Name fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-neutral-700">
              First name
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-neutral-700">
              Last name
            </label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Phone field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
            Phone number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* Location fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-700">Location</h3>

          <div>
            <label htmlFor="location.city" className="block text-sm font-medium text-neutral-700">
              City
            </label>
            <input
              type="text"
              name="location.city"
              id="location.city"
              required
              value={formData.location.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="location.state" className="block text-sm font-medium text-neutral-700">
              State
            </label>
            <select
              name="location.state"
              id="location.state"
              required
              value={formData.location.state}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="Massachusetts">Massachusetts</option>
              <option value="Connecticut">Connecticut</option>
              <option value="Maine">Maine</option>
              <option value="New Hampshire">New Hampshire</option>
              <option value="Rhode Island">Rhode Island</option>
              <option value="Vermont">Vermont</option>
              <option value="New York">New York</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="location.zip" className="block text-sm font-medium text-neutral-700">
              ZIP Code
            </label>
            <input
              type="text"
              name="location.zip"
              id="location.zip"
              required
              value={formData.location.zip}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-end">
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

export default JobSeekerStep1;
