import React from 'react';
import { PlusCircle } from 'lucide-react';

export const SkillMatchCard: React.FC = () => {
  // Mock skills data - would come from API in real app
  const skills = [
    { name: 'Customer Service', level: 'Advanced', match: 'solar-installer' },
    { name: 'Problem Solving', level: 'Advanced', match: 'energy-auditor' },
    { name: 'Technical Knowledge', level: 'Intermediate', match: 'hvac-tech' },
    { name: 'Communication', level: 'Advanced', match: 'sales' },
    { name: 'Attention to Detail', level: 'Advanced', match: 'quality-control' },
    { name: 'Time Management', level: 'Intermediate', match: 'project-management' },
  ];
  
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-midnight-forest-900">Your Skills</h3>
      <p className="mt-1 mb-4 text-sm text-midnight-forest-600">
        These transferable skills match clean energy roles
      </p>
      
      <div className="space-y-3">
        {skills.slice(0, 5).map((skill, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-midnight-forest-800">{skill.name}</div>
              <div className="text-xs text-midnight-forest-500">{skill.level}</div>
            </div>
            <div className={`badge ${
              skill.level === 'Advanced' ? 'badge-primary' : 'badge-secondary'
            }`}>
              {skill.level === 'Advanced' ? 'Strong match' : 'Good match'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-midnight-forest-200">
        <button
          type="button"
          className="flex w-full items-center justify-center text-sm font-medium text-spring-green-600 hover:text-spring-green-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add more skills
        </button>
      </div>
    </div>
  );
};