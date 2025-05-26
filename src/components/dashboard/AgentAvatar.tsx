import React from 'react';
import { Bot, User, Briefcase, Award, Globe, Home } from 'lucide-react';

interface AgentAvatarProps {
  agentName?: string;
  role: 'user' | 'assistant';
}

/**
 * Component to display an avatar for a user or AI agent in the chat interface
 */
const AgentAvatar: React.FC<AgentAvatarProps> = ({ agentName, role }) => {
  // If it's a user, show the user avatar
  if (role === 'user') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
        <User className="h-5 w-5 text-white" />
      </div>
    );
  }
  
  // Otherwise, show the appropriate agent avatar based on the agent name
  let Icon = Bot;
  let bgColor = 'bg-primary-100';
  let iconColor = 'text-primary-600';
  let tooltip = 'AI Assistant';
  
  switch (agentName) {
    case 'career_specialist':
      Icon = Briefcase;
      bgColor = 'bg-blue-100';
      iconColor = 'text-blue-600';
      tooltip = 'Career Specialist';
      break;
    case 'veterans_specialist':
      Icon = Award;
      bgColor = 'bg-amber-100';
      iconColor = 'text-amber-600';
      tooltip = 'Veterans Specialist';
      break;
    case 'international_specialist':
      Icon = Globe;
      bgColor = 'bg-emerald-100';
      iconColor = 'text-emerald-600';
      tooltip = 'International Specialist';
      break;
    case 'ej_specialist':
      Icon = Home;
      bgColor = 'bg-purple-100';
      iconColor = 'text-purple-600';
      tooltip = 'Environmental Justice Specialist';
      break;
    default:
      // Default AI assistant
      break;
  }
  
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bgColor} group relative`} title={tooltip}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {tooltip}
      </span>
    </div>
  );
};

export default AgentAvatar;
