import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, X, Plus } from 'lucide-react';
import {
  UnifiedUserProfile,
  JobSeekerPreferencesFormData,
  SalaryExpectations,
  isValidSalaryExpectations
} from '../../types/unified';

interface PreferencesFormProps {
  profile: UnifiedUserProfile | null;
  userId: string;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({ userId }) => {
  const [formData, setFormData] = useState<JobSeekerPreferencesFormData>({
    preferred_job_types: [],
    preferred_work_environment: [],
    willing_to_relocate: false,
    preferred_locations: [],
    salary_expectations: {
      min: '',
      max: '',
      type: 'yearly'
    },
    career_goals: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  // Job types options
  const jobTypeOptions = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'apprenticeship', label: 'Apprenticeship' }
  ];

  // Work environment options
  const workEnvironmentOptions = [
    { value: 'on_site', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'field_work', label: 'Field work' },
    { value: 'travel_required', label: 'Travel required' }
  ];

  // Initialize form with profile data
  useEffect(() => {
    const fetchJobSeekerProfile = async () => {
      if (!userId) return;

      try {
        // Fetch job seeker profile data
        const { data: jobSeekerData, error } = await supabase
          .from('job_seeker_profiles')
          .select('preferred_job_types, preferred_work_environment, willing_to_relocate, preferred_locations, salary_expectations, career_goals')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching job seeker profile:', error);
          return;
        }

        if (jobSeekerData) {
          // Handle salary expectations properly
          let salaryExpectations: SalaryExpectations = {
            min: '',
            max: '',
            type: 'yearly'
          };

          if (jobSeekerData.salary_expectations) {
            if (isValidSalaryExpectations(jobSeekerData.salary_expectations)) {
              salaryExpectations = jobSeekerData.salary_expectations;
            } else if (typeof jobSeekerData.salary_expectations === 'object') {
              const salary = jobSeekerData.salary_expectations as Record<string, unknown>;
              salaryExpectations = {
                min: (salary.min as string) || '',
                max: (salary.max as string) || '',
                type: (salary.type as 'hourly' | 'yearly' | 'monthly') || 'yearly'
              };
            }
          }

          setFormData({
            preferred_job_types: jobSeekerData.preferred_job_types || [],
            preferred_work_environment: jobSeekerData.preferred_work_environment || [],
            willing_to_relocate: jobSeekerData.willing_to_relocate || false,
            preferred_locations: jobSeekerData.preferred_locations || [],
            salary_expectations: salaryExpectations,
            career_goals: jobSeekerData.career_goals || ''
          });
        }
      } catch (err) {
        console.error('Error fetching job seeker profile:', err);
      }
    };

    fetchJobSeekerProfile();
  }, [userId]);

  // Handle checkbox changes for arrays
  const handleCheckboxChange = (field: keyof Profile, value: string) => {
    const currentValues = formData[field] as string[] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    setFormData({
      ...formData,
      [field]: newValues
    });
  };

  // Handle toggle changes
  const handleToggleChange = (field: keyof Profile, value: boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });

    // Clear preferred locations if not willing to relocate
    if (field === 'willing_to_relocate' && !value) {
      setFormData({
        ...formData,
        [field]: value,
        preferred_locations: []
      });
    }
  };

  // Handle salary expectation changes
  const handleSalaryChange = (field: keyof SalaryExpectations, value: string) => {
    setFormData({
      ...formData,
      salary_expectations: {
        ...formData.salary_expectations as SalaryExpectations,
        [field]: value
      }
    });
  };

  // Add a new preferred location
  const addLocation = () => {
    if (!newLocation.trim()) return;

    const currentLocations = formData.preferred_locations || [];

    if (currentLocations.includes(newLocation)) {
      setError('This location is already in your preferences.');
      return;
    }

    setFormData({
      ...formData,
      preferred_locations: [...currentLocations, newLocation]
    });

    setNewLocation('');
    setError(null);
  };

  // Remove a preferred location
  const removeLocation = (location: string) => {
    setFormData({
      ...formData,
      preferred_locations: (formData.preferred_locations || []).filter(loc => loc !== location)
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update job seeker profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          preferred_job_types: formData.preferred_job_types,
          preferred_work_environment: formData.preferred_work_environment,
          willing_to_relocate: formData.willing_to_relocate,
          preferred_locations: formData.preferred_locations,
          salary_expectations: formData.salary_expectations
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating your preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-success-50 p-4 text-sm text-success-600 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Job preferences updated successfully!
        </div>
      )}

      {/* Job Types */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Preferred Job Types</h3>
        <div className="space-y-2">
          {jobTypeOptions.map((option) => (
            <div key={option.value} className="relative flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id={`job-type-${option.value}`}
                  name="job_types"
                  type="checkbox"
                  checked={(formData.preferred_job_types || []).includes(option.value)}
                  onChange={() => handleCheckboxChange('preferred_job_types', option.value)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={`job-type-${option.value}`} className="font-medium text-neutral-700">
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Environment */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Preferred Work Environment</h3>
        <div className="space-y-2">
          {workEnvironmentOptions.map((option) => (
            <div key={option.value} className="relative flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id={`work-env-${option.value}`}
                  name="work_environment"
                  type="checkbox"
                  checked={(formData.preferred_work_environment || []).includes(option.value)}
                  onChange={() => handleCheckboxChange('preferred_work_environment', option.value)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={`work-env-${option.value}`} className="font-medium text-neutral-700">
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salary Expectations */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Salary Expectations</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="salary-min" className="block text-sm font-medium text-neutral-700">
              Minimum
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="salary-min"
                value={(formData.salary_expectations as SalaryExpectations)?.min || ''}
                onChange={(e) => handleSalaryChange('min', e.target.value)}
                className="block w-full rounded-md border border-neutral-300 pl-7 pr-12 py-2 focus:border-primary-500 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="salary-max" className="block text-sm font-medium text-neutral-700">
              Maximum
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="salary-max"
                value={(formData.salary_expectations as SalaryExpectations)?.max || ''}
                onChange={(e) => handleSalaryChange('max', e.target.value)}
                className="block w-full rounded-md border border-neutral-300 pl-7 pr-12 py-2 focus:border-primary-500 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="salary-type" className="block text-sm font-medium text-neutral-700">
              Type
            </label>
            <select
              id="salary-type"
              value={(formData.salary_expectations as SalaryExpectations)?.type || 'yearly'}
              onChange={(e) => handleSalaryChange('type', e.target.value)}
              className="mt-1 block w-full rounded-md border border-neutral-300 py-2 pl-3 pr-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="yearly">Per Year</option>
              <option value="hourly">Per Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relocation Preferences */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Relocation Preferences</h3>

        <div className="relative flex items-start mb-4">
          <div className="flex h-5 items-center">
            <input
              id="willing-to-relocate"
              name="willing_to_relocate"
              type="checkbox"
              checked={formData.willing_to_relocate || false}
              onChange={(e) => handleToggleChange('willing_to_relocate', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="willing-to-relocate" className="font-medium text-neutral-700">
              I am willing to relocate for the right opportunity
            </label>
          </div>
        </div>

        {formData.willing_to_relocate && (
          <div>
            <label htmlFor="preferred-locations" className="block text-sm font-medium text-neutral-700 mb-2">
              Preferred Locations
            </label>

            <div className="flex flex-wrap gap-2 mb-4">
              {(formData.preferred_locations || []).map((location) => (
                <div
                  key={location}
                  className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700"
                >
                  <span>{location}</span>
                  <button
                    type="button"
                    onClick={() => removeLocation(location)}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:bg-primary-500 focus:text-white focus:outline-none"
                  >
                    <span className="sr-only">Remove {location}</span>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex">
              <input
                type="text"
                id="preferred-locations"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Add a location..."
                className="block w-full rounded-l-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addLocation}
                disabled={!newLocation.trim()}
                className="inline-flex items-center rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Enter cities, states, or regions where you would be willing to relocate.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
};

export default PreferencesForm;
