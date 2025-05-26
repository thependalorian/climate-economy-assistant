import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, CheckCircle, Zap, Lightbulb } from 'lucide-react';
import { updateUserSkills } from '../../services/profileService';

interface Skill {
  id: string;
  user_id: string;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  created_at?: string;
}

interface Interest {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

interface SkillsManagementProps {
  userId: string;
}

const SkillsManagement: React.FC<SkillsManagementProps> = ({ userId }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<Skill['proficiency']>('intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('technical');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Predefined skills for clean energy sector
  const suggestedSkills = [
    { name: 'Solar Installation', category: 'technical' },
    { name: 'Wind Turbine Maintenance', category: 'technical' },
    { name: 'Energy Efficiency Analysis', category: 'technical' },
    { name: 'Project Management', category: 'soft' },
    { name: 'Electrical Engineering', category: 'technical' },
    { name: 'Mechanical Engineering', category: 'technical' },
    { name: 'Data Analysis', category: 'technical' },
    { name: 'Renewable Energy Policy', category: 'knowledge' },
    { name: 'HVAC', category: 'technical' },
    { name: 'Building Performance', category: 'technical' },
    { name: 'Energy Modeling', category: 'technical' },
    { name: 'Grid Integration', category: 'technical' },
    { name: 'Battery Storage', category: 'technical' },
    { name: 'Sustainability', category: 'knowledge' },
    { name: 'Environmental Compliance', category: 'knowledge' },
    { name: 'Technical Writing', category: 'soft' },
    { name: 'Customer Service', category: 'soft' }
  ];

  // Predefined interests for clean energy sector
  const suggestedInterests = [
    'Solar Energy',
    'Wind Energy',
    'Energy Storage',
    'Energy Efficiency',
    'Green Building',
    'Electric Vehicles',
    'Grid Modernization',
    'Climate Policy',
    'Sustainable Transportation',
    'Environmental Justice',
    'Clean Tech',
    'Renewable Energy Finance',
    'Carbon Reduction',
    'Community Solar'
  ];

  // Fetch skills and interests
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (skillsError) throw skillsError;

        setSkills(skillsData || []);

        // Fetch interests
        const { data: interestsData, error: interestsError } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (interestsError) throw interestsError;

        setInterests(interestsData || []);
      } catch (err) {
        console.error('Error fetching skills and interests:', err);
        setError('Failed to load your skills and interests.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Add a new skill
  const addSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      setSaving(true);
      setError(null);

      // Check if skill already exists
      if (skills.some(skill => skill.name.toLowerCase() === newSkill.toLowerCase())) {
        setError('This skill is already in your profile.');
        return;
      }

      // Create the new skill object
      const newSkillObj = {
        name: newSkill,
        proficiency: newSkillProficiency,
        category: newSkillCategory
      };

      // Add skill using the profile service
      // This will also trigger recommendation updates
      await updateUserSkills(userId, [newSkillObj], 'add');

      // Fetch the updated skills to get the new ID
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update local state
      setSkills(data || []);

      // Clear input
      setNewSkill('');
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error adding skill:', err);
      setError('Failed to add skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Remove a skill
  const removeSkill = async (skillId: string) => {
    try {
      setSaving(true);

      // Find the skill to remove
      const skillToRemove = skills.find(skill => skill.id === skillId);

      if (!skillToRemove) {
        throw new Error('Skill not found');
      }

      // Remove skill using the profile service
      // This will also trigger recommendation updates
      await updateUserSkills(userId, [skillToRemove], 'remove');

      // Update local state
      setSkills(skills.filter(skill => skill.id !== skillId));
    } catch (err) {
      console.error('Error removing skill:', err);
      setError('Failed to remove skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Add a new interest
  const addInterest = async () => {
    if (!newInterest.trim()) return;

    try {
      setSaving(true);
      setError(null);

      // Check if interest already exists
      if (interests.some(interest => interest.name.toLowerCase() === newInterest.toLowerCase())) {
        setError('This interest is already in your profile.');
        return;
      }

      // Add interest to database
      const { data, error } = await supabase
        .from('user_interests')
        .insert([
          {
            user_id: userId,
            name: newInterest
          }
        ])
        .select();

      if (error) throw error;

      // Update local state
      if (data) {
        setInterests([...data, ...interests]);
      }

      // Clear input
      setNewInterest('');
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error adding interest:', err);
      setError('Failed to add interest. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Remove an interest
  const removeInterest = async (interestId: string) => {
    try {
      setSaving(true);

      // Remove interest from database
      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('id', interestId);

      if (error) throw error;

      // Update local state
      setInterests(interests.filter(interest => interest.id !== interestId));
    } catch (err) {
      console.error('Error removing interest:', err);
      setError('Failed to remove interest. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get proficiency color
  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'beginner':
        return 'bg-neutral-100 text-neutral-700';
      case 'intermediate':
        return 'bg-primary-100 text-primary-700';
      case 'advanced':
        return 'bg-primary-200 text-primary-800';
      case 'expert':
        return 'bg-primary-300 text-primary-900';
      default:
        return 'bg-neutral-100 text-neutral-700';
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
          Your skills and interests have been updated!
        </div>
      )}

      {/* Skills Section */}
      <div>
        <div className="flex items-center mb-4">
          <Zap className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-medium text-neutral-900">Skills</h2>
        </div>

        {/* Add new skill */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="new-skill" className="sr-only">
              Add a skill
            </label>
            <input
              type="text"
              id="new-skill"
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="skill-proficiency" className="sr-only">
              Proficiency
            </label>
            <select
              id="skill-proficiency"
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value as Skill['proficiency'])}
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={addSkill}
              disabled={!newSkill.trim() || saving}
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </button>
          </div>
        </div>

        {/* Skills list */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Your Skills</h3>
          {skills.length === 0 ? (
            <p className="text-sm text-neutral-500">No skills added yet. Add skills to improve job matches.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getProficiencyColor(
                    skill.proficiency
                  )}`}
                >
                  <span>{skill.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-500 focus:bg-neutral-500 focus:text-white focus:outline-none"
                  >
                    <span className="sr-only">Remove {skill.name}</span>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested skills */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Suggested Skills</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills
              .filter(
                (suggestion) =>
                  !skills.some((skill) => skill.name.toLowerCase() === suggestion.name.toLowerCase())
              )
              .slice(0, 10)
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setNewSkill(suggestion.name);
                    setNewSkillCategory(suggestion.category);
                  }}
                  className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion.name}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Interests Section */}
      <div>
        <div className="flex items-center mb-4">
          <Lightbulb className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-medium text-neutral-900">Interests</h2>
        </div>

        {/* Add new interest */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="new-interest" className="sr-only">
              Add an interest
            </label>
            <input
              type="text"
              id="new-interest"
              placeholder="Add an interest..."
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={addInterest}
              disabled={!newInterest.trim() || saving}
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Interest
            </button>
          </div>
        </div>

        {/* Interests list */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Your Interests</h3>
          {interests.length === 0 ? (
            <p className="text-sm text-neutral-500">No interests added yet. Add interests to improve job matches.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <div
                  key={interest.id}
                  className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700"
                >
                  <span>{interest.name}</span>
                  <button
                    type="button"
                    onClick={() => removeInterest(interest.id)}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:bg-primary-500 focus:text-white focus:outline-none"
                  >
                    <span className="sr-only">Remove {interest.name}</span>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested interests */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Suggested Interests</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedInterests
              .filter(
                (suggestion) =>
                  !interests.some((interest) => interest.name.toLowerCase() === suggestion.toLowerCase())
              )
              .slice(0, 10)
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setNewInterest(suggestion)}
                  className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsManagement;
