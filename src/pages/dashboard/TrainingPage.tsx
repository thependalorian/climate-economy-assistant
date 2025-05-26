import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { TrainingCard } from '../../components/dashboard/TrainingCard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  first_name?: string;
  user_type?: string;
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
    description?: string;
  };
}

interface TrainingPageProps {
  userProfile?: UserProfile;
}

export const TrainingPage: React.FC<TrainingPageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = props.userProfile || outletContext;
  const { user } = useAuth();
  const [trainingMatches, setTrainingMatches] = useState<TrainingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All Formats');

  const fetchTrainingMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Fetch training matches
      const { data, error } = await supabase
        .from('training_matches')
        .select(`
          *,
          training_program:training_programs(*)
        `)
        .eq('job_seeker_id', user.id)
        .order('match_score', { ascending: false });

      if (error) throw error;

      setTrainingMatches(data || []);
    } catch (err) {
      console.error('Error fetching training matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load training recommendations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTrainingMatches();
    }
  }, [user, fetchTrainingMatches]);

  // Filter training programs based on search term and selected format
  const filteredPrograms = trainingMatches.filter(match => {
    const program = match.training_program;
    const matchesSearch = searchTerm === '' ||
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFormat = selectedFormat === 'All Formats' ||
      program.format === selectedFormat;

    return matchesSearch && matchesFormat;
  });

  if (loading) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6">
                <div className="h-6 w-48 bg-sand-gray-200 rounded-act mb-3"></div>
                <div className="h-4 w-32 bg-sand-gray-200 rounded-act mb-2"></div>
                <div className="h-4 w-full bg-sand-gray-200 rounded-act mb-4"></div>
                <div className="h-8 w-24 bg-sand-gray-200 rounded-act"></div>
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
                Error Loading Training Programs
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
            Training Recommendations
          </h1>
          <p className="mt-2 font-body text-lg text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Programs to help you build skills for clean energy careers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <input
              type="text"
              className="input py-3 pl-10 pr-4 w-full sm:w-64"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-midnight-forest-400" />
          </div>
          <select
            className="select py-3 w-full sm:w-48"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            <option>All Formats</option>
            <option>In-Person</option>
            <option>Online</option>
            <option>Hybrid</option>
          </select>
        </div>
      </div>

      {filteredPrograms.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map(match => (
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
              detailed
            />
          ))}
        </div>
      ) : (
        <div className="card act-bracket p-8 text-center bg-white">
          <div className="w-16 h-16 bg-moss-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-moss-green-700" />
          </div>
          <h3 className="font-display font-medium text-xl text-midnight-forest mb-3 tracking-act-tight leading-act-tight">
            No training programs found
          </h3>
          <p className="font-body text-midnight-forest-600 mb-6 tracking-act-tight leading-act-normal">
            {searchTerm || selectedFormat !== 'All Formats'
              ? 'Try adjusting your search filters to see more programs'
              : 'Complete your profile to get personalized training recommendations'}
          </p>
          {(searchTerm || selectedFormat !== 'All Formats') && (
            <button
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedFormat('All Formats');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
