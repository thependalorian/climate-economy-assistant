import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, GraduationCap, FileText, RefreshCw } from 'lucide-react';
import JobMatchCard from './JobMatchCard';
import ResourceCard from './ResourceCard';
import { generateAllRecommendations } from '../../services/recommendationService';

interface RecommendationPanelProps {
  userId: string;
}

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

interface TrainingProgram {
  id: string;
  title: string;
  provider: string;
  format: string;
  duration: string;
  description: string;
  url: string;
  match_score: number;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string;
  image_url?: string;
  tags?: string[];
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ userId }) => {
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch job matches
        const { data: jobData, error: jobError } = await supabase
          .from('job_matches')
          .select(`
            id,
            match_score,
            match_reasons,
            skill_gaps,
            job_listing:job_listing_id (
              id,
              title,
              company:partner_id (organization_name, logo_url),
              location,
              job_type,
              salary_range,
              climate_sector
            )
          `)
          .eq('job_seeker_id', userId)
          .order('match_score', { ascending: false })
          .limit(5);
        
        if (jobError) throw jobError;
        
        setJobMatches(jobData || []);
        
        // Fetch training program recommendations
        // In a real app, this would fetch from a training_matches table
        // For this simulation, we'll use dummy data
        setTrainingPrograms([
          {
            id: '1',
            title: 'Solar Installation Certification',
            provider: 'Clean Energy Institute',
            format: 'Online',
            duration: '8 weeks',
            description: 'Comprehensive training program for solar panel installation techniques and safety protocols.',
            url: 'https://example.com/solar-certification',
            match_score: 0.92
          },
          {
            id: '2',
            title: 'Energy Efficiency Analyst Training',
            provider: 'Green Building Academy',
            format: 'Hybrid',
            duration: '12 weeks',
            description: 'Learn to conduct energy audits and recommend efficiency improvements for residential and commercial buildings.',
            url: 'https://example.com/energy-efficiency',
            match_score: 0.85
          }
        ]);
        
        // Fetch resource recommendations
        // In a real app, this would fetch from a resource_matches table
        // For this simulation, we'll use dummy data
        setResources([
          {
            id: '1',
            title: 'Guide to Clean Energy Careers',
            description: 'Comprehensive overview of career paths in the clean energy sector, including job descriptions, required skills, and salary expectations.',
            resource_type: 'guide',
            url: 'https://example.com/clean-energy-careers',
            tags: ['career', 'clean energy', 'jobs']
          },
          {
            id: '2',
            title: 'Solar Industry Growth Trends',
            description: 'Analysis of current trends and future projections for the solar energy industry, including job growth and skill demands.',
            resource_type: 'article',
            url: 'https://example.com/solar-trends',
            tags: ['solar', 'industry', 'trends']
          }
        ]);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [userId]);
  
  // Refresh recommendations
  const handleRefresh = async () => {
    if (!userId || refreshing) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      // Generate new recommendations
      await generateAllRecommendations(userId);
      
      // Fetch updated recommendations
      const { data: jobData, error: jobError } = await supabase
        .from('job_matches')
        .select(`
          id,
          match_score,
          match_reasons,
          skill_gaps,
          job_listing:job_listing_id (
            id,
            title,
            company:partner_id (organization_name, logo_url),
            location,
            job_type,
            salary_range,
            climate_sector
          )
        `)
        .eq('job_seeker_id', userId)
        .order('match_score', { ascending: false })
        .limit(5);
      
      if (jobError) throw jobError;
      
      setJobMatches(jobData || []);
      
      // In a real app, we would also refresh training and resource recommendations
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}
      
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Recommendations</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 disabled:text-neutral-400"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Job Matches */}
      <div>
        <div className="flex items-center mb-3">
          <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-md font-medium text-neutral-900">Job Matches</h3>
        </div>
        
        {jobMatches.length === 0 ? (
          <p className="text-sm text-neutral-500">No job matches found. Update your profile to get personalized job recommendations.</p>
        ) : (
          <div className="space-y-3">
            {jobMatches.slice(0, 2).map((match) => (
              <JobMatchCard key={match.id} match={match} />
            ))}
            {jobMatches.length > 2 && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all {jobMatches.length} matches
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Training Programs */}
      <div>
        <div className="flex items-center mb-3">
          <GraduationCap className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-md font-medium text-neutral-900">Training Programs</h3>
        </div>
        
        {trainingPrograms.length === 0 ? (
          <p className="text-sm text-neutral-500">No training programs found. Update your profile to get personalized training recommendations.</p>
        ) : (
          <div className="space-y-3">
            {trainingPrograms.slice(0, 2).map((program) => (
              <div
                key={program.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open(program.url, '_blank', 'noopener,noreferrer')}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900">{program.title}</h4>
                    <p className="mt-1 text-xs text-neutral-500">{program.provider} • {program.format} • {program.duration}</p>
                  </div>
                  <div className="text-sm font-medium text-primary-600">
                    {Math.round(program.match_score * 100)}% match
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-600 line-clamp-2">{program.description}</p>
              </div>
            ))}
            {trainingPrograms.length > 2 && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all {trainingPrograms.length} programs
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Resources */}
      <div>
        <div className="flex items-center mb-3">
          <FileText className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-md font-medium text-neutral-900">Resources</h3>
        </div>
        
        {resources.length === 0 ? (
          <p className="text-sm text-neutral-500">No resources found. Update your profile to get personalized resource recommendations.</p>
        ) : (
          <div className="space-y-3">
            {resources.slice(0, 2).map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
            {resources.length > 2 && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all {resources.length} resources
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationPanel;
