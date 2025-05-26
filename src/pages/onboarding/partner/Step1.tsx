import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';

export const PartnerStep1: React.FC = () => {
  console.log('🏢 PartnerStep1 component rendering - UPDATED VERSION');

  // All hooks must be called before any early returns
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('🏢 PartnerStep1 - useAuth hook result:', { user: user?.email, loading: user ? 'loaded' : 'no user' });
  const [formData, setFormData] = useState(() => {
    // Pre-populate with data from registration if available
    const storedOrganization = localStorage.getItem('pendingOrganization');
    return {
      organization_name: storedOrganization || '',
      organization_type: '',
      website: '',
      description: '',
      climate_focus: [] as string[]
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing data if available - must be before any early returns
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch partner profile if it exists
        const { data: partnerData, error: partnerError } = await supabase
          .from('partner_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // It's okay if partner profile doesn't exist yet
        if (partnerError && partnerError.code !== 'PGRST116') {
          throw partnerError;
        }

        // Pre-fill form with existing data
        if (partnerData) {
          setFormData({
            organization_name: partnerData.organization_name || '',
            organization_type: partnerData.organization_type || '',
            website: partnerData.website || '',
            description: partnerData.description || '',
            climate_focus: partnerData.climate_focus || []
          });
        } else if (profileData) {
          // If no partner profile yet, use organization name from user profile
          setFormData(prev => ({
            ...prev,
            organization_name: profileData.organization_name || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load your profile data. Please try again.');
      }
    };

    fetchData();
  }, [user]);

  console.log('🏢 PartnerStep1 - User:', user?.email);
  console.log('🏢 PartnerStep1 - Form data:', formData);

  // Test mode disabled - component ready for production
  const isTestMode = false;
  if (isTestMode) {
    console.log('🏢 PartnerStep1 - Early return test');
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container mx-auto max-w-3xl">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-primary-600 mb-4">Partner Step 1 - Test</h1>
            <p className="text-neutral-600">This is a test to see if the component renders.</p>
            <p className="text-sm text-neutral-500 mt-4">If you see this, the component is working!</p>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleClimateFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData({
        ...formData,
        climate_focus: [...formData.climate_focus, value]
      });
    } else {
      setFormData({
        ...formData,
        climate_focus: formData.climate_focus.filter(item => item !== value)
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
        // Get stored registration data
        const storedFirstName = localStorage.getItem('pendingFirstName');
        const storedLastName = localStorage.getItem('pendingLastName');

        console.log('🏢 Creating user profile with stored data:', {
          firstName: storedFirstName,
          lastName: storedLastName,
          userType: 'partner'
        });

        // Create user profile if it doesn't exist
        const { error: createUserError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            user_type: 'partner',
            profile_completed: false,
            first_name: storedFirstName,
            last_name: storedLastName,
            organization_name: formData.organization_name,
            organization_type: formData.organization_type
          });

        if (createUserError) throw createUserError;

        console.log('✅ User profile created successfully');

        // Clear the stored registration data since we've now created the profile
        localStorage.removeItem('pendingUserType');
        localStorage.removeItem('pendingFirstName');
        localStorage.removeItem('pendingLastName');
        localStorage.removeItem('pendingOrganization');
      } else {
        // Update existing user profile
        const { error: updateUserError } = await supabase
          .from('user_profiles')
          .update({
            organization_name: formData.organization_name,
            organization_type: formData.organization_type,
            user_type: 'partner'
          })
          .eq('id', user.id);

        if (updateUserError) throw updateUserError;
      }

      // Check if partner profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      // Create or update partner profile
      const operation = existingProfile ? 'update' : 'insert';
      const partnerData = {
        id: user.id,
        organization_name: formData.organization_name,
        organization_type: formData.organization_type,
        website: formData.website,
        description: formData.description,
        climate_focus: formData.climate_focus,
        verified: false
      };

      let partnerError;
      if (operation === 'insert') {
        const { error } = await supabase
          .from('partner_profiles')
          .insert([partnerData]);
        partnerError = error;
      } else {
        const { error } = await supabase
          .from('partner_profiles')
          .update(partnerData)
          .eq('id', user.id);
        partnerError = error;
      }

      if (partnerError) throw partnerError;

      // Proceed to next step
      navigate('/onboarding/partner/step2');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add error boundary logging
  try {
    console.log('🏢 PartnerStep1 - About to render component');

    // Simple test to see if component renders at all
    if (!user) {
      console.log('🏢 PartnerStep1 - No user, showing login prompt');
      return (
        <div className="min-h-screen bg-neutral-50 py-12">
          <div className="container mx-auto max-w-3xl">
            <div className="card p-8">
              <h1 className="text-2xl font-bold text-primary-600 mb-4">Please log in</h1>
              <p className="text-neutral-600">You need to be logged in to access this page.</p>
            </div>
          </div>
        </div>
      );
    }

    console.log('🏢 PartnerStep1 - User found, rendering onboarding form');

    return (
      <OnboardingLayout
        currentStep={1}
        totalSteps={4}
        title="Tell us about your organization"
        description="Help us understand your organization and how it fits into the climate economy ecosystem."
      >
        {error && (
          <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization name */}
        <div>
          <label htmlFor="organization_name" className="block text-sm font-medium text-neutral-700">
            Organization name
          </label>
          <input
            type="text"
            name="organization_name"
            id="organization_name"
            required
            value={formData.organization_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* Organization type */}
        <div>
          <label htmlFor="organization_type" className="block text-sm font-medium text-neutral-700">
            Organization type
          </label>
          <select
            name="organization_type"
            id="organization_type"
            required
            value={formData.organization_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select organization type</option>
            <option value="employer">Employer</option>
            <option value="training_provider">Training Provider</option>
            <option value="educational_institution">Educational Institution</option>
            <option value="government_agency">Government Agency</option>
            <option value="nonprofit">Nonprofit Organization</option>
            <option value="industry_association">Industry Association</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-neutral-700">
            Website
          </label>
          <input
            type="url"
            name="website"
            id="website"
            value={formData.website}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="https://www.example.com"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            Organization description
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Tell us about your organization's mission and work in the climate economy..."
          />
        </div>

        {/* Industry selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Climate sectors (select all that apply)
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="renewable_energy"
                name="climate_focus"
                type="checkbox"
                value="renewable_energy"
                checked={formData.climate_focus.includes('renewable_energy')}
                onChange={handleClimateFocusChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="renewable_energy" className="ml-3 block text-sm text-neutral-700">
                Renewable Energy (Solar, Wind, etc.)
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="energy_efficiency"
                name="climate_focus"
                type="checkbox"
                value="energy_efficiency"
                checked={formData.climate_focus.includes('energy_efficiency')}
                onChange={handleClimateFocusChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="energy_efficiency" className="ml-3 block text-sm text-neutral-700">
                Energy Efficiency
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="clean_transportation"
                name="climate_focus"
                type="checkbox"
                value="clean_transportation"
                checked={formData.climate_focus.includes('clean_transportation')}
                onChange={handleClimateFocusChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="clean_transportation" className="ml-3 block text-sm text-neutral-700">
                Clean Transportation
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="grid_modernization"
                name="climate_focus"
                type="checkbox"
                value="grid_modernization"
                checked={formData.climate_focus.includes('grid_modernization')}
                onChange={handleClimateFocusChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="grid_modernization" className="ml-3 block text-sm text-neutral-700">
                Grid Modernization
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="building_performance"
                name="climate_focus"
                type="checkbox"
                value="building_performance"
                checked={formData.climate_focus.includes('building_performance')}
                onChange={handleClimateFocusChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="building_performance" className="ml-3 block text-sm text-neutral-700">
                High-Performance Buildings
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="other"
                name="climate_focus"
                type="checkbox"
                value="other"
                checked={formData.climate_focus.includes('other')}
                onChange={handleClimateFocusChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="other" className="ml-3 block text-sm text-neutral-700">
                Other
              </label>
            </div>
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
  } catch (err) {
    console.error('🏢 PartnerStep1 - Error rendering component:', err);
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container mx-auto max-w-3xl">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-error-600 mb-4">Component Error</h1>
            <p className="text-neutral-600">There was an error rendering the Partner Step1 component.</p>
            <pre className="mt-4 p-4 bg-neutral-100 rounded text-sm overflow-auto">
              {err instanceof Error ? err.message : 'Unknown error'}
            </pre>
          </div>
        </div>
      </div>
    );
  }
};

export default PartnerStep1;
