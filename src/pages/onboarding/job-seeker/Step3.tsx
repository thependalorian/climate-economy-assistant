import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { X, Plus, Target, Lightbulb, Zap } from 'lucide-react';

interface FormData {
  skills: string[];
  interests: string[];
  preferred_job_types: string[];
  preferred_work_environment: string[];
  willing_to_relocate: boolean;
  preferred_locations: string[];
  salary_expectations: {
    min: string;
    max: string;
    type: string;
  };
}

export const JobSeekerStep3: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [formData, setFormData] = useState<FormData>({
    skills: [],
    interests: [],
    preferred_job_types: [],
    preferred_work_environment: [],
    willing_to_relocate: false,
    preferred_locations: [],
    salary_expectations: {
      min: '',
      max: '',
      type: 'yearly'
    }
  });

  // Predefined skills for clean energy sector
  const suggestedSkills = [
    'Solar Installation', 'Wind Turbine Maintenance', 'Energy Efficiency Analysis',
    'Project Management', 'Electrical Engineering', 'Mechanical Engineering',
    'Data Analysis', 'Renewable Energy Policy', 'HVAC', 'Building Performance',
    'Energy Modeling', 'Grid Integration', 'Battery Storage', 'Sustainability',
    'Environmental Compliance', 'Technical Writing', 'Customer Service'
  ];

  // Predefined interests for clean energy sector
  const suggestedInterests = [
    'Solar Energy', 'Wind Energy', 'Energy Storage', 'Energy Efficiency',
    'Green Building', 'Electric Vehicles', 'Grid Modernization', 'Climate Policy',
    'Sustainable Transportation', 'Environmental Justice', 'Clean Tech',
    'Renewable Energy Finance', 'Carbon Reduction', 'Community Solar'
  ];

  // Fetch existing data if available
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch job seeker profile
        const { data: profileData, error: profileError } = await supabase
          .from('job_seeker_profiles')
          .select('interests, preferred_job_types, preferred_work_environment, willing_to_relocate, preferred_locations, salary_expectations')
          .eq('id', user.id)
          .single();

        // Fetch skills separately
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('name')
          .eq('user_id', user.id);

        if (skillsError && skillsError.code !== 'PGRST116') {
          console.error('Error fetching skills:', skillsError);
        }

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Pre-fill form with existing data
        setFormData({
          skills: skillsData ? skillsData.map(skill => skill.name) : [],
          interests: profileData?.interests || [],
          preferred_job_types: profileData?.preferred_job_types || [],
          preferred_work_environment: profileData?.preferred_work_environment || [],
          willing_to_relocate: profileData?.willing_to_relocate || false,
          preferred_locations: profileData?.preferred_locations || [],
          salary_expectations: profileData?.salary_expectations || {
            min: '',
            max: '',
            type: 'yearly'
          }
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load your profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle checkbox changes
  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    if (field === 'preferred_job_types' || field === 'preferred_work_environment') {
      if (checked) {
        setFormData({
          ...formData,
          [field]: [...formData[field] as string[], value]
        });
      } else {
        setFormData({
          ...formData,
          [field]: (formData[field] as string[]).filter(item => item !== value)
        });
      }
    }
  };

  // Handle toggle changes
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Handle salary input changes
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name.split('.')[1]; // Extract the nested field name

    setFormData({
      ...formData,
      salary_expectations: {
        ...formData.salary_expectations,
        [field]: value
      }
    });
  };

  // Add a new skill
  const addSkill = (skill: string) => {
    if (!skill.trim()) return;

    if (!formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }

    setNewSkill('');
  };

  // Remove a skill
  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  // Add a new interest
  const addInterest = (interest: string) => {
    if (!interest.trim()) return;

    if (!formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }

    setNewInterest('');
  };

  // Remove an interest
  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  // Add a new location
  const addLocation = (location: string) => {
    if (!location.trim()) return;

    if (!formData.preferred_locations.includes(location)) {
      setFormData({
        ...formData,
        preferred_locations: [...formData.preferred_locations, location]
      });
    }

    setNewLocation('');
  };

  // Remove a location
  const removeLocation = (location: string) => {
    setFormData({
      ...formData,
      preferred_locations: formData.preferred_locations.filter(l => l !== location)
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

      // Update job seeker profile (without skills)
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          interests: formData.interests,
          preferred_job_types: formData.preferred_job_types,
          preferred_work_environment: formData.preferred_work_environment,
          willing_to_relocate: formData.willing_to_relocate,
          preferred_locations: formData.preferred_locations,
          salary_expectations: formData.salary_expectations,
          onboarding_step: 3
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Handle skills separately - first delete existing skills
      const { error: deleteSkillsError } = await supabase
        .from('skills')
        .delete()
        .eq('user_id', user.id);

      if (deleteSkillsError) {
        console.error('Error deleting existing skills:', deleteSkillsError);
        // Continue anyway - this is not critical
      }

      // Insert new skills
      if (formData.skills.length > 0) {
        const skillsToInsert = formData.skills.map(skill => ({
          user_id: user.id,
          name: skill,
          category: 'general', // Default category
          verified: false
        }));

        const { error: insertSkillsError } = await supabase
          .from('skills')
          .insert(skillsToInsert);

        if (insertSkillsError) {
          console.error('Error inserting skills:', insertSkillsError);
          // Continue anyway - this is not critical for onboarding
        }
      }

      // Proceed to next step
      navigate('/onboarding/job-seeker/step4');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/job-seeker/step2');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={5}
      title="Skills & Interests"
      description="Tell us about your skills and career interests in the climate economy."
    >
      {error && (
        <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Skills section */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-medium text-neutral-900">Skills</h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {formData.skills.map((skill) => (
              <div
                key={skill}
                className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              className="flex-1 rounded-l-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => addSkill(newSkill)}
              className="inline-flex items-center rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-sm text-neutral-500 mb-2">Suggested skills:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  disabled={formData.skills.includes(skill)}
                  className={`text-xs px-2 py-1 rounded-full ${
                    formData.skills.includes(skill)
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interests section */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-medium text-neutral-900">Interests</h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {formData.interests.map((interest) => (
              <div
                key={interest}
                className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{interest}</span>
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest..."
              className="flex-1 rounded-l-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => addInterest(newInterest)}
              className="inline-flex items-center rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-sm text-neutral-500 mb-2">Suggested interests:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => addInterest(interest)}
                  disabled={formData.interests.includes(interest)}
                  className={`text-xs px-2 py-1 rounded-full ${
                    formData.interests.includes(interest)
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Job Preferences */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-medium text-neutral-900">Job Preferences</h3>
          </div>

          {/* Preferred Job Types */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Preferred Job Types (select all that apply)
            </label>
            <div className="space-y-2">
              {[
                { id: 'full_time', label: 'Full-time' },
                { id: 'part_time', label: 'Part-time' },
                { id: 'contract', label: 'Contract' },
                { id: 'internship', label: 'Internship' },
                { id: 'apprenticeship', label: 'Apprenticeship' }
              ].map((type) => (
                <label key={type.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferred_job_types.includes(type.id)}
                    onChange={(e) => handleCheckboxChange('preferred_job_types', type.id, e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-neutral-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Work Environment */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Preferred Work Environment (select all that apply)
            </label>
            <div className="space-y-2">
              {[
                { id: 'on_site', label: 'On-site' },
                { id: 'remote', label: 'Remote' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'field_work', label: 'Field work' },
                { id: 'travel_required', label: 'Travel required' }
              ].map((env) => (
                <label key={env.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferred_work_environment.includes(env.id)}
                    onChange={(e) => handleCheckboxChange('preferred_work_environment', env.id, e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-neutral-700">{env.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Salary Expectations */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Salary Expectations
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="salary_min" className="block text-xs text-neutral-500">
                  Minimum
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="salary_expectations.min"
                    id="salary_min"
                    value={formData.salary_expectations.min}
                    onChange={handleSalaryChange}
                    className="pl-7 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="salary_max" className="block text-xs text-neutral-500">
                  Maximum
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="salary_expectations.max"
                    id="salary_max"
                    value={formData.salary_expectations.max}
                    onChange={handleSalaryChange}
                    className="pl-7 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="salary_type" className="block text-xs text-neutral-500">
                  Type
                </label>
                <select
                  name="salary_expectations.type"
                  id="salary_type"
                  value={formData.salary_expectations.type}
                  onChange={handleSalaryChange}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="yearly">Yearly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Relocation */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="willing_to_relocate" className="text-sm font-medium text-neutral-700">
                Willing to relocate
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="willing_to_relocate"
                  id="willing_to_relocate"
                  checked={formData.willing_to_relocate}
                  onChange={handleToggleChange}
                  className="sr-only"
                />
                <div className={`block h-6 rounded-full w-10 ${formData.willing_to_relocate ? 'bg-primary-600' : 'bg-neutral-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.willing_to_relocate ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </div>

            {formData.willing_to_relocate && (
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-neutral-700">
                  Preferred locations
                </label>

                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.preferred_locations.map((location) => (
                    <div
                      key={location}
                      className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{location}</span>
                      <button
                        type="button"
                        onClick={() => removeLocation(location)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Add a location (city, state, or region)..."
                    className="flex-1 rounded-l-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => addLocation(newLocation)}
                    className="inline-flex items-center rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
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

export default JobSeekerStep3;
