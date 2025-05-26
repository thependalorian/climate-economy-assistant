import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, CheckCircle, Briefcase } from 'lucide-react';

interface WorkExperience {
  id: string;
  user_id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
  created_at?: string;
}

interface ExperienceManagementProps {
  userId: string;
}

const ExperienceManagement: React.FC<ExperienceManagementProps> = ({ userId }) => {
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  // Fetch work experience data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch work experience entries
        const { data: experienceData, error: experienceError } = await supabase
          .from('user_work_experience')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });

        if (experienceError) throw experienceError;

        setExperience(experienceData || []);

        // Fetch years of experience
        const { data: profileData, error: profileError } = await supabase
          .from('job_seeker_profiles')
          .select('years_of_experience')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData?.years_of_experience) {
          setYearsOfExperience(profileData.years_of_experience);
        }
      } catch (err) {
        console.error('Error fetching work experience data:', err);
        setError('Failed to load your work experience data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Add new work experience entry
  const addExperience = () => {
    const newExperience: Omit<WorkExperience, 'id' | 'created_at'> = {
      user_id: userId,
      company: '',
      title: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    };

    // Add temporary ID for UI purposes
    setExperience([
      ...experience,
      { ...newExperience, id: `temp-${Date.now()}` } as WorkExperience
    ]);
  };

  // Update work experience entry
  const updateExperience = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    setExperience(
      experience.map(exp => {
        if (exp.id === id) {
          return { ...exp, [field]: value };
        }
        return exp;
      })
    );

    // If current is set to true, clear end date
    if (field === 'current' && value === true) {
      setExperience(
        experience.map(exp => {
          if (exp.id === id) {
            return { ...exp, current: true, end_date: '' };
          }
          return exp;
        })
      );
    }
  };

  // Remove work experience entry
  const removeExperience = async (id: string) => {
    // If it's a temporary ID (not saved to database yet)
    if (id.startsWith('temp-')) {
      setExperience(experience.filter(exp => exp.id !== id));
      return;
    }

    try {
      setSaving(true);

      // Remove from database
      const { error } = await supabase
        .from('user_work_experience')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setExperience(experience.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error removing work experience:', err);
      setError('Failed to remove work experience entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save all work experience entries
  const saveExperience = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      const invalidEntries = experience.filter(
        exp => !exp.company || !exp.title || !exp.start_date
      );

      if (invalidEntries.length > 0) {
        setError('Please fill in all required fields for each work experience entry.');
        return;
      }

      // Separate new and existing entries
      const newEntries = experience.filter(exp => exp.id.startsWith('temp-'));
      const existingEntries = experience.filter(exp => !exp.id.startsWith('temp-'));

      // Insert new entries
      if (newEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('user_work_experience')
          .insert(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            newEntries.map(({ id: _unused, ...entry }) => ({
              ...entry,
              user_id: userId
            }))
          );

        if (insertError) throw insertError;
      }

      // Update existing entries
      for (const entry of existingEntries) {
        const { error: updateError } = await supabase
          .from('user_work_experience')
          .update({
            company: entry.company,
            title: entry.title,
            location: entry.location,
            start_date: entry.start_date,
            end_date: entry.end_date,
            current: entry.current,
            description: entry.description
          })
          .eq('id', entry.id);

        if (updateError) throw updateError;
      }

      // Update years of experience
      if (yearsOfExperience) {
        const { error: profileError } = await supabase
          .from('job_seeker_profiles')
          .update({
            years_of_experience: yearsOfExperience
          })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Refresh work experience data
      const { data: refreshedData, error: refreshError } = await supabase
        .from('user_work_experience')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (refreshError) throw refreshError;

      setExperience(refreshedData || []);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving work experience:', err);
      setError('Failed to save work experience data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-success-50 p-4 text-sm text-success-600 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Your work experience information has been saved!
        </div>
      )}

      {/* Years of Experience */}
      <div>
        <label htmlFor="years_of_experience" className="block text-sm font-medium text-neutral-700">
          Years of Work Experience
        </label>
        <select
          id="years_of_experience"
          value={yearsOfExperience}
          onChange={(e) => setYearsOfExperience(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        >
          <option value="">Select years of experience</option>
          <option value="0-1">Less than 1 year</option>
          <option value="1-3">1-3 years</option>
          <option value="3-5">3-5 years</option>
          <option value="5-10">5-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>

      {/* Work Experience Entries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-medium text-neutral-900">Work Experience</h2>
          </div>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Experience
          </button>
        </div>

        {experience.length === 0 ? (
          <div className="rounded-md bg-neutral-50 p-6 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No work experience entries</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Add your work history to improve job matches.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Experience
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-md font-medium text-neutral-900">
                    {exp.title ? `${exp.title} at ${exp.company}` : 'New Work Experience'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="inline-flex items-center text-error-600 hover:text-error-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Company*
                    </label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Job Title*
                    </label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Location
                    </label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Start Date*
                    </label>
                    <input
                      type="month"
                      value={exp.start_date}
                      onChange={(e) => updateExperience(exp.id, 'start_date', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div className={exp.current ? 'opacity-50' : ''}>
                    <label className="block text-sm font-medium text-neutral-700">
                      End Date
                    </label>
                    <input
                      type="month"
                      value={exp.end_date}
                      onChange={(e) => updateExperience(exp.id, 'end_date', e.target.value)}
                      disabled={exp.current}
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
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
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveExperience}
                disabled={saving}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {saving ? 'Saving...' : 'Save Experience'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceManagement;
