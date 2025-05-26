import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, MapPin, DollarSign } from 'lucide-react';

interface JobMatch {
  id: string;
  match_score: number;
  match_reasons: string[];
  skill_gaps: string[];
  job_listing: {
    id: string;
    title: string;
    company: {
      organization_name: string;
      logo_url: string;
    };
    location: string;
    job_type: string;
    salary_range: string;
    climate_sector: string;
  };
}

interface JobMatchCardProps {
  match: JobMatch;
}

const JobMatchCard: React.FC<JobMatchCardProps> = ({ match }) => {
  const navigate = useNavigate();
  
  const formatMatchScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };
  
  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success-600';
    if (score >= 0.6) return 'text-primary-600';
    return 'text-neutral-600';
  };
  
  const handleClick = () => {
    navigate(`/jobs/${match.job_listing.id}`);
  };
  
  return (
    <div 
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Company logo */}
        <div className="flex-shrink-0">
          {match.job_listing.company.logo_url ? (
            <img
              src={match.job_listing.company.logo_url}
              alt={match.job_listing.company.organization_name}
              className="h-12 w-12 rounded-md object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-100">
              <Briefcase className="h-6 w-6 text-primary-600" />
            </div>
          )}
        </div>
        
        {/* Job details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-neutral-900 truncate">
                {match.job_listing.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 truncate">
                {match.job_listing.company.organization_name}
              </p>
            </div>
            <div className={`text-sm font-medium ${getMatchScoreColor(match.match_score)}`}>
              {formatMatchScore(match.match_score)}
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <div className="flex items-center">
              <MapPin className="mr-1 h-3 w-3" />
              <span>{match.job_listing.location}</span>
            </div>
            <div className="flex items-center">
              <Briefcase className="mr-1 h-3 w-3" />
              <span>{match.job_listing.job_type}</span>
            </div>
            {match.job_listing.salary_range && (
              <div className="flex items-center">
                <DollarSign className="mr-1 h-3 w-3" />
                <span>{match.job_listing.salary_range}</span>
              </div>
            )}
          </div>
          
          {/* Match reasons */}
          {match.match_reasons && match.match_reasons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-neutral-700">Match reasons:</p>
              <ul className="mt-1 text-xs text-neutral-600">
                {match.match_reasons.slice(0, 2).map((reason, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span className="truncate">{reason}</span>
                  </li>
                ))}
                {match.match_reasons.length > 2 && (
                  <li className="text-xs text-primary-600">
                    +{match.match_reasons.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-end">
        <button
          className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/jobs/${match.job_listing.id}`);
          }}
        >
          View details
          <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default JobMatchCard;
