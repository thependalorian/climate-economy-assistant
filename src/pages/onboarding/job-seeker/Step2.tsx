import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { Plus, Trash2, GraduationCap, Briefcase } from 'lucide-react';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  current: boolean;
}

interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

interface FormData {
  education: Education[];
  work_experience: WorkExperience[];
  highest_education: string;
  years_of_experience: string;
}

export const JobSeekerStep2: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    education: [],
    work_experience: [],
    highest_education: '',
    years_of_experience: ''
  });

  // Fetch existing data if available
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch job seeker profile
        const { data: profileData, error: profileError } = await supabase
          .from('job_seeker_profiles')
          .select('education, work_experience, highest_education, years_of_experience')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Pre-fill form with existing data
        if (profileData) {
          setFormData({
            education: profileData.education || [],
            work_experience: profileData.work_experience || [],
            highest_education: profileData.highest_education || '',
            years_of_experience: profileData.years_of_experience || ''
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

  // Add new education entry
  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      current: false
    };

    setFormData({
      ...formData,
      education: [...formData.education, newEducation]
    });
  };

  // Remove education entry
  const removeEducation = (id: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter(edu => edu.id !== id)
    });
  };

  // Add new work experience entry
  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      company: '',
      title: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    };

    setFormData({
      ...formData,
      work_experience: [...formData.work_experience, newExperience]
    });
  };

  // Remove work experience entry
  const removeWorkExperience = (id: string) => {
    setFormData({
      ...formData,
      work_experience: formData.work_experience.filter(exp => exp.id !== id)
    });
  };

  // Handle education field changes
  const handleEducationChange = (id: string, field: keyof Education, value: string | boolean) => {
    setFormData({
      ...formData,
      education: formData.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    });
  };

  // Handle work experience field changes
  const handleWorkExperienceChange = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    setFormData({
      ...formData,
      work_experience: formData.work_experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    });
  };

  // Handle select field changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

      // Update job seeker profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          education: formData.education,
          work_experience: formData.work_experience,
          highest_education: formData.highest_education,
          years_of_experience: formData.years_of_experience,
          onboarding_step: 2
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Proceed to next step
      navigate('/onboarding/job-seeker/step3');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/job-seeker/step1');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={5}
      title="Education & Experience"
      description="Tell us about your educational background and work experience."
    >
      {error && (
        <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Highest education level */}
        <div>
          <label htmlFor="highest_education" className="block text-sm font-medium text-neutral-700">
            Highest level of education
          </label>
          <select
            id="highest_education"
            name="highest_education"
            value={formData.highest_education}
            onChange={handleSelectChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select education level</option>
            <option value="high_school">High School</option>
            <option value="associate">Associate's Degree</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="doctorate">Doctorate</option>
            <option value="vocational">Vocational Training</option>
            <option value="certification">Professional Certification</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Years of experience */}
        <div>
          <label htmlFor="years_of_experience" className="block text-sm font-medium text-neutral-700">
            Years of work experience
          </label>
          <select
            id="years_of_experience"
            name="years_of_experience"
            value={formData.years_of_experience}
            onChange={handleSelectChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select years of experience</option>
            <option value="0-1">Less than 1 year</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        {/* Education section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-neutral-900">Education</h3>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Education
            </button>
          </div>

          {formData.education.length === 0 ? (
            <div className="rounded-md bg-neutral-50 p-4 text-center text-neutral-500">
              No education entries yet. Click "Add Education" to add your educational background.
            </div>
          ) : (
            <div className="space-y-6">
              {formData.education.map((edu) => (
                <div key={edu.id} className="rounded-md border border-neutral-200 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-md font-medium text-neutral-900">
                      {edu.institution || 'New Education Entry'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="inline-flex items-center text-error-600 hover:text-error-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={edu.field_of_study}
                        onChange={(e) => handleEducationChange(edu.id, 'field_of_study', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Start Date
                      </label>
                      <input
                        type="month"
                        value={edu.start_date}
                        onChange={(e) => handleEducationChange(edu.id, 'start_date', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div className={edu.current ? 'opacity-50' : ''}>
                      <label className="block text-sm font-medium text-neutral-700">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={edu.end_date}
                        onChange={(e) => handleEducationChange(edu.id, 'end_date', e.target.value)}
                        disabled={edu.current}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={edu.current}
                          onChange={(e) => handleEducationChange(edu.id, 'current', e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-neutral-700">Currently studying here</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Work Experience section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-neutral-900">Work Experience</h3>
            </div>
            <button
              type="button"
              onClick={addWorkExperience}
              className="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Experience
            </button>
          </div>

          {formData.work_experience.length === 0 ? (
            <div className="rounded-md bg-neutral-50 p-4 text-center text-neutral-500">
              No work experience entries yet. Click "Add Experience" to add your work history.
            </div>
          ) : (
            <div className="space-y-6">
              {formData.work_experience.map((exp) => (
                <div key={exp.id} className="rounded-md border border-neutral-200 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-md font-medium text-neutral-900">
                      {exp.title ? `${exp.title} at ${exp.company}` : 'New Work Experience'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(exp.id)}
                      className="inline-flex items-center text-error-600 hover:text-error-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Company
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleWorkExperienceChange(exp.id, 'company', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => handleWorkExperienceChange(exp.id, 'title', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Location
                      </label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => handleWorkExperienceChange(exp.id, 'location', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Start Date
                      </label>
                      <input
                        type="month"
                        value={exp.start_date}
                        onChange={(e) => handleWorkExperienceChange(exp.id, 'start_date', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div className={exp.current ? 'opacity-50' : ''}>
                      <label className="block text-sm font-medium text-neutral-700">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={exp.end_date}
                        onChange={(e) => handleWorkExperienceChange(exp.id, 'end_date', e.target.value)}
                        disabled={exp.current}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => handleWorkExperienceChange(exp.id, 'current', e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-neutral-700">I currently work here</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={exp.description}
                      onChange={(e) => handleWorkExperienceChange(exp.id, 'description', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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

export default JobSeekerStep2;
