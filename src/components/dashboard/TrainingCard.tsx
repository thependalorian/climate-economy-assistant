import React from 'react';
import { MapPin, Clock, ExternalLink, GraduationCap } from 'lucide-react';

interface TrainingCardProps {
  program: {
    id: number;
    title: string;
    provider: string;
    location: string;
    duration: string;
    format: string;
    cost: string;
    relevance: string;
  };
  detailed?: boolean;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({ program, detailed = false }) => {
  // Map relevance to colors
  const relevanceColors: Record<string, string> = {
    'High': 'text-spring-green-600 bg-spring-green-50 border-spring-green-200',
    'Medium': 'text-moss-green-600 bg-moss-green-50 border-moss-green-200',
    'Low': 'text-midnight-forest-600 bg-midnight-forest-100 border-midnight-forest-200',
  };

  const relevanceColor = relevanceColors[program.relevance] || 'text-midnight-forest-600 bg-midnight-forest-100 border-midnight-forest-200';

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-moss-green-100">
            <GraduationCap className="h-5 w-5 text-moss-green-600" />
          </div>
          <h3 className="font-medium text-midnight-forest-900">{program.title}</h3>
          <p className="text-sm text-midnight-forest-600">{program.provider}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-midnight-forest-500">
            <div className="flex items-center">
              <MapPin className="mr-1 h-3 w-3" />
              {program.location}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {program.duration}
            </div>
          </div>
        </div>
        <div className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${relevanceColor}`}>
          {program.relevance} Relevance
        </div>
      </div>

      {detailed && (
        <div className="mt-4 pt-4 border-t border-midnight-forest-200">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Format</h4>
              <p className="text-sm text-midnight-forest-800">{program.format}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Duration</h4>
              <p className="text-sm text-midnight-forest-800">{program.duration}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Cost</h4>
              <p className="text-sm text-midnight-forest-800">{program.cost}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Provider</h4>
              <p className="text-sm text-midnight-forest-800">{program.provider}</p>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <a
              href="#"
              className="btn-secondary flex-1"
            >
              Enroll Now
            </a>
            <a
              href="#"
              className="btn-outline flex items-center"
            >
              Program Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {!detailed && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-midnight-forest-700">
            {program.format} • {program.duration}
          </div>
          <a
            href="#"
            className="text-sm font-medium text-moss-green-600 hover:text-moss-green-700 inline-flex items-center"
          >
            Learn more
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
};