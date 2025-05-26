import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, CheckCircle, GraduationCap } from 'lucide-react';

interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  current: boolean;
  created_at?: string;
}

interface EducationManagementProps {
  userId: string;
}

const EducationManagement: React.FC<EducationManagementProps> = ({ userId }) => {
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [highestEducation, setHighestEducation] = useState('');

  // Fetch education data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch education entries
        const { data: educationData, error: educationError } = await supabase
          .from('user_education')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });

        if (educationError) throw educationError;

        setEducation(educationData || []);

        // Fetch highest education level
        const { data: profileData, error: profileError } = await supabase
          .from('job_seeker_profiles')
          .select('highest_education')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData?.highest_education) {
          setHighestEducation(profileData.highest_education);
        }
      } catch (err) {
        console.error('Error fetching education data:', err);
        setError('Failed to load your education data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Add new education entry
  const addEducation = () => {
    const newEducation: Omit<Education, 'id' | 'created_at'> = {
      user_id: userId,
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      current: false
    };

    // Add temporary ID for UI purposes
    setEducation([
      ...education,
      { ...newEducation, id: `temp-${Date.now()}` } as Education
    ]);
  };

  // Update education entry
  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setEducation(
      education.map(edu => {
        if (edu.id === id) {
          return { ...edu, [field]: value };
        }
        return edu;
      })
    );

    // If current is set to true, clear end date
    if (field === 'current' && value === true) {
      setEducation(
        education.map(edu => {
          if (edu.id === id) {
            return { ...edu, current: true, end_date: '' };
          }
          return edu;
        })
      );
    }
  };

  // Remove education entry
  const removeEducation = async (id: string) => {
    // If it's a temporary ID (not saved to database yet)
    if (id.startsWith('temp-')) {
      setEducation(education.filter(edu => edu.id !== id));
      return;
    }

    try {
      setSaving(true);

      // Remove from database
      const { error } = await supabase
        .from('user_education')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setEducation(education.filter(edu => edu.id !== id));
    } catch (err) {
      console.error('Error removing education:', err);
      setError('Failed to remove education entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save all education entries
  const saveEducation = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      const invalidEntries = education.filter(
        edu => !edu.institution || !edu.degree || !edu.field_of_study || !edu.start_date
      );

      if (invalidEntries.length > 0) {
        setError('Please fill in all required fields for each education entry.');
        return;
      }

      // Separate new and existing entries
      const newEntries = education.filter(edu => edu.id.startsWith('temp-'));
      const existingEntries = education.filter(edu => !edu.id.startsWith('temp-'));

      // Insert new entries
      if (newEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('user_education')
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
          .from('user_education')
          .update({
            institution: entry.institution,
            degree: entry.degree,
            field_of_study: entry.field_of_study,
            start_date: entry.start_date,
            end_date: entry.end_date,
            current: entry.current
          })
          .eq('id', entry.id);

        if (updateError) throw updateError;
      }

      // Update highest education level
      if (highestEducation) {
        const { error: profileError } = await supabase
          .from('job_seeker_profiles')
          .update({
            highest_education: highestEducation
          })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Refresh education data
      const { data: refreshedData, error: refreshError } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (refreshError) throw refreshError;

      setEducation(refreshedData || []);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving education:', err);
      setError('Failed to save education data. Please try again.');
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
          Your education information has been saved!
        </div>
      )}

      {/* Highest Education Level */}
      <div>
        <label htmlFor="highest_education" className="block text-sm font-medium text-neutral-700">
          Highest Level of Education
        </label>
        <select
          id="highest_education"
          value={highestEducation}
          onChange={(e) => setHighestEducation(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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

      {/* Education Entries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <GraduationCap className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-medium text-neutral-900">Education History</h2>
          </div>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Education
          </button>
        </div>

        {education.length === 0 ? (
          <div className="rounded-md bg-neutral-50 p-6 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No education entries</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Add your educational background to improve job matches.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Education
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-md font-medium text-neutral-900">
                    {edu.institution || 'New Education Entry'}
                  </h3>
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
                      Institution*
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Degree*
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Field of Study*
                    </label>
                    <input
                      type="text"
                      value={edu.field_of_study}
                      onChange={(e) => updateEducation(edu.id, 'field_of_study', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Start Date*
                    </label>
                    <input
                      type="month"
                      value={edu.start_date}
                      onChange={(e) => updateEducation(edu.id, 'start_date', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div className={edu.current ? 'opacity-50' : ''}>
                    <label className="block text-sm font-medium text-neutral-700">
                      End Date
                    </label>
                    <input
                      type="month"
                      value={edu.end_date}
                      onChange={(e) => updateEducation(edu.id, 'end_date', e.target.value)}
                      disabled={edu.current}
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={edu.current}
                        onChange={(e) => updateEducation(edu.id, 'current', e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-neutral-700">Currently studying here</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveEducation}
                disabled={saving}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {saving ? 'Saving...' : 'Save Education'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationManagement;
