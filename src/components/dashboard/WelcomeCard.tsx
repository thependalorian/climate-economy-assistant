import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FileUp } from 'lucide-react';
import { cn } from '../../utils/cn';

interface WelcomeCardProps {
  user: {
    firstName: string;
    profileCompletion: number;
    resumeUploaded: boolean;
    lastLogin: string;
  };
  className?: string;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ user, className }) => {
  return (
    <div className={cn("card p-6", className)}>
      <div className="flex justify-between">
        <div>
          <h2 className="text-xl font-semibold text-midnight-forest-900">
            Hello, {user.firstName}
          </h2>
          <p className="mt-1 text-sm text-midnight-forest-600">
            Let's continue your clean energy career journey
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-spring-green-100">
          <ArrowUpRight className="h-5 w-5 text-spring-green-600" />
        </div>
      </div>
      
      <div className="mt-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        {!user.resumeUploaded ? (
          <Link
            to="/profile"
            className="btn-primary flex items-center justify-center"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Upload Resume
          </Link>
        ) : (
          <Link
            to="/profile"
            className="btn-outline flex items-center justify-center"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Update Resume
          </Link>
        )}
        <Link
          to="/profile"
          className="btn-outline"
        >
          Complete Profile
        </Link>
      </div>
      
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-midnight-forest-700">Profile completion</span>
          <span className="text-sm font-medium text-midnight-forest-700">{user.profileCompletion}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-midnight-forest-100">
          <div 
            className="h-2 rounded-full bg-spring-green-500" 
            style={{ width: `${user.profileCompletion}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};