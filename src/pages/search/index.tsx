import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import SearchResults from '../../components/search/SearchResults';
import { searchContent, trackSearch } from '../../services/searchService';
import { useAuth } from '../../hooks/useAuth';
import { models } from '../../agents';

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<models.SearchResultType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    content_type: searchParams.get('type') || '',
    source_type: searchParams.get('source') || ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: Record<string, unknown> = {}) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchContent({
        query: searchQuery,
        filters: searchFilters,
        limit: 20,
        offset: 0
      });

      setResults(searchResults);

      // Track the search
      if (user) {
        await trackSearch(user.id, searchQuery, searchFilters, searchResults.length);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Update URL params
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.content_type) params.set('type', filters.content_type);
    if (filters.source_type) params.set('source', filters.source_type);
    setSearchParams(params);

    performSearch(query, filters);
  };

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);

    if (query) {
      performSearch(query, newFilters);
    }
  };

  // Load initial search if query params exist
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, filters);
    }
  }, [filters, performSearch, searchParams]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Search Climate Opportunities
          </h1>
          <p className="text-lg text-neutral-600">
            Find jobs, training programs, resources, and organizations in the clean energy sector.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for jobs, training, resources..."
                className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-3 border border-neutral-300 rounded-md shadow-sm bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 p-4 bg-neutral-50 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Filter Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="content_type" className="block text-sm font-medium text-neutral-700 mb-1">
                  Content Type
                </label>
                <select
                  id="content_type"
                  value={filters.content_type}
                  onChange={(e) => handleFilterChange('content_type', e.target.value)}
                  className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="job">Jobs</option>
                  <option value="training">Training Programs</option>
                  <option value="resource">Resources</option>
                  <option value="partner">Organizations</option>
                </select>
              </div>

              <div>
                <label htmlFor="source_type" className="block text-sm font-medium text-neutral-700 mb-1">
                  Source
                </label>
                <select
                  id="source_type"
                  value={filters.source_type}
                  onChange={(e) => handleFilterChange('source_type', e.target.value)}
                  className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Sources</option>
                  <option value="job">Job Listings</option>
                  <option value="training">Training Programs</option>
                  <option value="knowledge_resource">Knowledge Resources</option>
                  <option value="partner">Partner Organizations</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        <SearchResults results={results} loading={loading} query={query} />

        {/* Quick Search Suggestions */}
        {!query && !loading && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Popular Searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                'Solar installation',
                'Energy efficiency',
                'Wind technician',
                'Green building',
                'Electric vehicles',
                'Battery storage',
                'HVAC training',
                'Renewable energy'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion, filters);
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SearchPage;
