import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  subtext: string;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'success';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color
}) => {
  const colorClasses = {
    primary: 'bg-spring-green-100 text-spring-green-600',
    secondary: 'bg-moss-green-100 text-moss-green-600',
    success: 'bg-seafoam-blue-100 text-seafoam-blue-600'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-midnight-forest-600">{title}</p>
          <h3 className="text-xl font-semibold text-midnight-forest-900">{value}</h3>
          <p className="text-xs text-midnight-forest-500">{subtext}</p>
        </div>
      </div>
    </div>
  );
};