import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { JobCard } from '../../components/dashboard/JobCard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  first_name?: string;
  user_type?: string;
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
    description?: string;
  };
}

interface JobsPageProps {
  userProfile?: UserProfile;
}

export const JobsPage: React.FC<JobsPageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = props.userProfile || outletContext;
  const { user } = useAuth();
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');

  const fetchJobMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Fetch job matches
      const { data, error } = await supabase
        .from('job_matches')
        .select(`
          *,
          job_listing:job_listings(*)
        `)
        .eq('job_seeker_id', user.id)
        .order('match_score', { ascending: false });

      if (error) throw error;

      setJobMatches(data || []);
    } catch (err) {
      console.error('Error fetching job matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job matches');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchJobMatches();
    }
  }, [user, fetchJobMatches]);

  // Filter jobs based on search term and selected sector
  const filteredJobs = jobMatches.filter(match => {
    const job = match.job_listing;
    const matchesSearch = searchTerm === '' ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = selectedSector === 'All Sectors' ||
      job.sector === selectedSector;

    return matchesSearch && matchesSector;
  });

  if (loading) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6">
                <div className="h-6 w-48 bg-sand-gray-200 rounded-act mb-3"></div>
                <div className="h-4 w-32 bg-sand-gray-200 rounded-act mb-2"></div>
                <div className="h-4 w-full bg-sand-gray-200 rounded-act"></div>
              </div>
            ))}
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
                Error Loading Jobs
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
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="act-fade-in">
          <h1 className="font-display font-normal text-3xl md:text-4xl text-midnight-forest tracking-act-tight leading-act-tight">
            Job Matches
          </h1>
          <p className="mt-2 font-body text-lg text-midnight-forest-600 tracking-act-tight leading-act-normal">
            We found {jobMatches.length} jobs that match your skills and interests
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <input
              type="text"
              className="input py-3 pl-10 pr-4 w-full sm:w-64"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-midnight-forest-400" />
          </div>
          <select
            className="select py-3 w-full sm:w-48"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option>All Sectors</option>
            <option>Renewable Energy</option>
            <option>Energy Efficiency</option>
            <option>Net Zero Grid</option>
            <option>Clean Transportation</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(match => (
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
              detailed
            />
          ))
        ) : (
          <div className="card act-bracket p-8 text-center bg-white">
            <div className="w-16 h-16 bg-spring-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-spring-green-700" />
            </div>
            <h3 className="font-display font-medium text-xl text-midnight-forest mb-3 tracking-act-tight leading-act-tight">
              No job matches found
            </h3>
            <p className="font-body text-midnight-forest-600 mb-6 tracking-act-tight leading-act-normal">
              {searchTerm || selectedSector !== 'All Sectors'
                ? 'Try adjusting your search filters to see more opportunities'
                : 'Complete your profile to get personalized job recommendations'}
            </p>
            {(searchTerm || selectedSector !== 'All Sectors') && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSector('All Sectors');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
