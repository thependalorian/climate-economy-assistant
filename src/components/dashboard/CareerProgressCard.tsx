import React from 'react';
import { Trophy } from 'lucide-react';

interface CareerProgressCardProps {
  progress: number;
}

export const CareerProgressCard: React.FC<CareerProgressCardProps> = ({ progress }) => {
  return (
    <div className="card p-6">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#E6E8E8"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#B2DE26"
              strokeWidth="10"
              strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-spring-green-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-midnight-forest-900">Career Progress</h3>
        <p className="mt-1 text-sm text-midnight-forest-600">
          You're making great progress on your clean energy journey!
        </p>
        
        <div className="mt-4 w-full">
          <div className="mt-2 grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-midnight-forest-600">Resume uploaded</span>
              <span className="rounded-full bg-spring-green-100 px-2.5 py-0.5 text-xs font-medium text-spring-green-800">
                Complete
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-midnight-forest-600">Skills identified</span>
              <span className="rounded-full bg-spring-green-100 px-2.5 py-0.5 text-xs font-medium text-spring-green-800">
                Complete
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-midnight-forest-600">Career interests</span>
              <span className="rounded-full bg-moss-green-100 px-2.5 py-0.5 text-xs font-medium text-moss-green-800">
                In progress
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-midnight-forest-600">Training plan</span>
              <span className="rounded-full bg-midnight-forest-100 px-2.5 py-0.5 text-xs font-medium text-midnight-forest-800">
                Not started
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};