import React from 'react';
import { MapPin, Calendar, Bookmark, ExternalLink, Building2 } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score: number;
  salary_range: string;
  created_at: string;
  sector: string;
  job_type: string;
}

interface JobCardProps {
  job: Job;
  detailed?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, detailed = false }) => {
  // Map job sectors to colors
  const sectorColors: Record<string, string> = {
    'solar': 'text-spring-green-600 bg-spring-green-50 border-spring-green-200',
    'energy-efficiency': 'text-moss-green-600 bg-moss-green-50 border-moss-green-200',
    'buildings': 'text-seafoam-blue-600 bg-seafoam-blue-50 border-seafoam-blue-200',
    'grid': 'text-spring-green-600 bg-spring-green-50 border-spring-green-200',
    'transportation': 'text-moss-green-600 bg-moss-green-50 border-moss-green-200',
  };
  
  const sectorColor = sectorColors[job.sector] || 'text-midnight-forest-600 bg-midnight-forest-100 border-midnight-forest-200';
  
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-spring-green-100">
            <Building2 className="h-6 w-6 text-spring-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-midnight-forest-900">{job.title}</h3>
            <p className="text-sm text-midnight-forest-600">{job.company}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-midnight-forest-500">
              <div className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" />
                {job.location}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="rounded-full bg-spring-green-100 px-2.5 py-1 text-xs font-medium text-spring-green-800">
            {job.match_score}% Match
          </div>
          <button
            type="button"
            className="mt-2 text-midnight-forest-400 hover:text-spring-green-600"
            aria-label="Save job"
          >
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {detailed && (
        <div className="mt-4 pt-4 border-t border-midnight-forest-200">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Salary Range</h4>
              <p className="text-sm text-midnight-forest-800">{job.salary_range}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Job Type</h4>
              <p className="text-sm text-midnight-forest-800 capitalize">{job.job_type}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Sector</h4>
              <div className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${sectorColor}`}>
                {job.sector.replace('-', ' ')}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase text-midnight-forest-500">Skill Match</h4>
              <p className="text-sm text-midnight-forest-800">{job.match_score}% match to your profile</p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <a
              href="#"
              className="btn-primary flex-1"
            >
              Apply Now
            </a>
            <a
              href="#"
              className="btn-outline flex items-center"
            >
              View Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      )}
      
      {!detailed && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm font-medium text-midnight-forest-900">
            {job.salary_range}
          </div>
          <a
            href="#"
            className="text-sm font-medium text-spring-green-600 hover:text-spring-green-700 inline-flex items-center"
          >
            View details
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
};