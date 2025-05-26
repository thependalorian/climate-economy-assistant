import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { ResourceCard } from '../../components/dashboard/ResourceCard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  first_name?: string;
  user_type?: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  type?: string;
  url?: string;
  tags?: string[];
}

interface ResourcesPageProps {
  userProfile?: UserProfile;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = props.userProfile || outletContext;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch resources
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  // Filter resources based on search term and selected type
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === '' ||
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.tags && resource.tags.some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesType = selectedType === 'All Types' ||
      resource.type === selectedType;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-neutral-200 rounded mb-4"></div>
          <div className="h-4 w-96 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resource Library</h1>
          <p className="mt-2 text-neutral-600">
            Guides, programs, and tools to support your clean energy journey
          </p>
        </div>
        <div className="flex items-center">
          <div className="relative mr-2">
            <input
              type="text"
              className="input py-2 pl-9 pr-4"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          </div>
          <select
            className="select py-2"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option>All Types</option>
            <option>Guide</option>
            <option>Program</option>
            <option>Event</option>
            <option>Service</option>
          </select>
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={{
                id: resource.id,
                title: resource.title,
                type: resource.type,
                tags: resource.tags,
                description: resource.description,
                url: resource.url,
                recommended: true // TODO: Add recommendation logic
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <h3 className="text-lg font-medium text-neutral-900">No resources found</h3>
          <p className="mt-2 text-neutral-600">
            {searchTerm || selectedType !== 'All Types'
              ? 'Try adjusting your search filters'
              : 'Check back later for new resources'}
          </p>
          {(searchTerm || selectedType !== 'All Types') && (
            <button
              className="mt-4 btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('All Types');
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
