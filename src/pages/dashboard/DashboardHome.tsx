import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WelcomeCard } from '../../components/dashboard/WelcomeCard';
import { CareerProgressCard } from '../../components/dashboard/CareerProgressCard';
import { SkillMatchCard } from '../../components/dashboard/SkillMatchCard';
import { JobCard } from '../../components/dashboard/JobCard';
import { TrainingCard } from '../../components/dashboard/TrainingCard';
import { ResourceCard } from '../../components/dashboard/ResourceCard';
import { AIAssistantCard } from '../../components/dashboard/AIAssistantCard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  first_name?: string;
  resume_url?: string;
}

interface JobMatch {
  id: string;
  match_score: number;
  job_listing: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_range?: string;
    created_at: string;
    sector?: string;
    job_type?: string;
  };
}

interface TrainingMatch {
  id: string;
  match_score: number;
  training_program: {
    id: string;
    title: string;
    provider: string;
    location: string;
    duration: string;
    format: string;
    cost?: string;
  };
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  resource_type?: string;
  url?: string;
  image_url?: string;
  tags?: string[];
}

interface DashboardHomeProps {
  userProfile?: UserProfile;
}

export const DashboardHome: React.FC<DashboardHomeProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  const userProfile = props.userProfile || outletContext;
  const { user } = useAuth();
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [trainingMatches, setTrainingMatches] = useState<TrainingMatch[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Only fetch other data if we have a valid user profile
      const [jobMatchesResult, trainingMatchesResult, resourcesResult] = await Promise.all([
        // Fetch job matches
        supabase
          .from('job_matches')
          .select(`
            *,
            job_listing:job_listings(*)
          `)
          .eq('job_seeker_id', user.id)
          .order('match_score', { ascending: false }),

        // Fetch training matches
        supabase
          .from('training_matches')
          .select(`
            *,
            training_program:training_programs(*)
          `)
          .eq('job_seeker_id', user.id)
          .order('match_score', { ascending: false }),

        // Fetch resources
        supabase
          .from('resources')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })
      ]);

      if (jobMatchesResult.error) throw jobMatchesResult.error;
      if (trainingMatchesResult.error) throw trainingMatchesResult.error;
      if (resourcesResult.error) throw resourcesResult.error;

      setJobMatches(jobMatchesResult.data || []);
      setTrainingMatches(trainingMatchesResult.data || []);
      setResources(resourcesResult.data || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  if (loading) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 card p-6">
              <div className="h-6 w-48 bg-sand-gray-200 rounded-act mb-3"></div>
              <div className="h-4 w-full bg-sand-gray-200 rounded-act"></div>
            </div>
            <div className="card p-6">
              <div className="h-6 w-32 bg-sand-gray-200 rounded-act mb-3"></div>
              <div className="h-4 w-24 bg-sand-gray-200 rounded-act"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        <div className="card act-bracket p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-600 font-medium">!</span>
            </div>
            <div>
              <h3 className="font-display font-medium text-red-800 tracking-act-tight">
                Error Loading Dashboard
              </h3>
              <p className="font-body text-red-600 text-sm tracking-act-tight leading-act-normal">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Dashboard Header */}
      <div className="mb-8 act-fade-in">
        <h1 className="font-display font-normal text-3xl md:text-4xl text-midnight-forest tracking-act-tight leading-act-tight">
          Welcome back, {userProfile?.first_name || 'there'}
        </h1>
        <p className="mt-2 font-body text-lg text-midnight-forest-600 tracking-act-tight leading-act-normal">
          Continue exploring clean energy opportunities tailored for you.
        </p>
      </div>

      <div className="space-y-6">
        {/* Top Row */}
        <div className="grid gap-6 md:grid-cols-3">
          <WelcomeCard
            user={{
              firstName: userProfile?.first_name || '',
              profileCompletion: 75, // TODO: Calculate this
              resumeUploaded: Boolean(userProfile?.resume_url),
              lastLogin: '2 days ago' // TODO: Track this
            }}
            className="md:col-span-2"
          />
          <CareerProgressCard
            progress={75} // TODO: Calculate this
          />
        </div>

        {/* Middle Row */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
                Top Job Matches
              </h2>
              <Link to="/dashboard/jobs" className="font-body text-sm font-medium text-spring-green hover:text-moss-green inline-flex items-center tracking-act-tight transition-colors duration-200">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {jobMatches.slice(0, 2).map(match => (
                <JobCard
                  key={match.id}
                  job={{
                    id: match.job_listing.id,
                    title: match.job_listing.title,
                    company: match.job_listing.company,
                    location: match.job_listing.location,
                    match_score: match.match_score,
                    salary_range: match.job_listing.salary_range,
                    created_at: match.job_listing.created_at,
                    sector: match.job_listing.sector,
                    job_type: match.job_listing.job_type
                  }}
                />
              ))}
              {jobMatches.length === 0 && (
                <div className="card p-6 text-center">
                  <div className="w-12 h-12 bg-spring-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ArrowRight className="h-6 w-6 text-spring-green-700" />
                  </div>
                  <p className="font-body text-midnight-forest-600 text-sm tracking-act-tight leading-act-normal">
                    No job matches found. Complete your profile to get personalized job recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="mb-6">
              <h2 className="font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
                Your Skills
              </h2>
            </div>
            <SkillMatchCard />
          </div>
        </div>

        {/* Training Row */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
              Recommended Training
            </h2>
            <Link to="/dashboard/training" className="font-body text-sm font-medium text-spring-green hover:text-moss-green inline-flex items-center tracking-act-tight transition-colors duration-200">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trainingMatches.slice(0, 3).map(match => (
              <TrainingCard
                key={match.id}
                program={{
                  id: match.training_program.id,
                  title: match.training_program.title,
                  provider: match.training_program.provider,
                  location: match.training_program.location,
                  duration: match.training_program.duration,
                  format: match.training_program.format,
                  cost: match.training_program.cost,
                  relevance: match.match_score >= 80 ? 'High' : match.match_score >= 60 ? 'Medium' : 'Low'
                }}
              />
            ))}
            {trainingMatches.length === 0 && (
              <div className="col-span-3 card p-6 text-center">
                <div className="w-12 h-12 bg-moss-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-6 w-6 text-moss-green-700" />
                </div>
                <p className="font-body text-midnight-forest-600 text-sm tracking-act-tight leading-act-normal">
                  No training recommendations found. Complete your profile to get personalized training suggestions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h2 className="font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
                Resources
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.slice(0, 4).map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={{
                    id: resource.id,
                    title: resource.title,
                    description: resource.description || '',
                    resource_type: resource.resource_type || 'guide',
                    url: resource.url || '#',
                    image_url: resource.image_url,
                    tags: resource.tags || []
                  }}
                />
              ))}
              {resources.length === 0 && (
                <div className="col-span-2 card p-6 text-center">
                  <div className="w-12 h-12 bg-seafoam-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ArrowRight className="h-6 w-6 text-midnight-forest" />
                  </div>
                  <p className="font-body text-midnight-forest-600 text-sm tracking-act-tight leading-act-normal">
                    No resources found. Check back later for updates.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div>
            <AIAssistantCard />
          </div>
        </div>
      </div>
    </div>
  );
};
