import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Zap, Plus, ArrowRight } from 'lucide-react';

interface SkillsOverviewProps {
  userId: string;
}

interface Skill {
  id: string;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

const SkillsOverview: React.FC<SkillsOverviewProps> = ({ userId }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSkills = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch user skills
        const { data, error } = await supabase
          .from('user_skills')
          .select('id, name, proficiency, category')
          .eq('user_id', userId)
          .order('proficiency', { ascending: false });
        
        if (error) throw error;
        
        setSkills(data || []);
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError('Failed to load skills data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkills();
  }, [userId]);
  
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
  
  const getProficiencyLabel = (proficiency: string) => {
    return proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
  };
  
  // Group skills by category
  const groupedSkills = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {});
  
  // Sort categories by number of skills (descending)
  const sortedCategories = Object.keys(groupedSkills).sort(
    (a, b) => groupedSkills[b].length - groupedSkills[a].length
  );
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary-500 border-r-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-error-50 p-4 text-sm text-error-600">
        {error}
      </div>
    );
  }
  
  if (skills.length === 0) {
    return (
      <div className="rounded-md bg-neutral-50 p-6 text-center">
        <Zap className="mx-auto h-8 w-8 text-neutral-400" />
        <h3 className="mt-2 text-sm font-medium text-neutral-900">No skills added yet</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Add skills to your profile to improve job matches and recommendations.
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Skills
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Skills summary */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            You have <span className="font-medium text-neutral-900">{skills.length}</span> skills in your profile
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Add more skills
          <Plus className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      {/* Skills by category */}
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category}>
            <h4 className="mb-2 text-sm font-medium text-neutral-900">{category}</h4>
            <div className="flex flex-wrap gap-2">
              {groupedSkills[category].map((skill) => (
                <div
                  key={skill.id}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getProficiencyColor(
                    skill.proficiency
                  )}`}
                  title={`${getProficiencyLabel(skill.proficiency)}`}
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Skill assessment CTA */}
      <div className="mt-6 rounded-md bg-primary-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Zap className="h-5 w-5 text-primary-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800">Improve your profile</h3>
            <div className="mt-2 text-sm text-primary-700">
              <p>
                Take skill assessments to verify your expertise and improve your job matches.
              </p>
            </div>
            <div className="mt-3">
              <button
                type="button"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Take an assessment
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsOverview;
