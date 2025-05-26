import React from 'react';
import { User, Zap, GraduationCap, Briefcase, Settings, FileText } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'skills', name: 'Skills & Interests', icon: Zap },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'experience', name: 'Work Experience', icon: Briefcase },
    { id: 'preferences', name: 'Job Preferences', icon: Settings },
    { id: 'resume', name: 'Resume', icon: FileText },
  ];
  
  return (
    <div className="border-b border-neutral-200">
      <div className="sm:hidden px-4 py-2">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
          value={activeTab}
          onChange={(e) => onChange(e.target.value)}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="hidden sm:block">
        <nav className="flex -mb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`
                  w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`mx-auto h-5 w-5 mb-1 ${
                    isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ProfileTabs;
