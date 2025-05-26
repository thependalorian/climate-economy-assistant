import React from 'react';
import { Briefcase, GraduationCap, FileText, Building2, ExternalLink } from 'lucide-react';
import { models } from '../../agents';

interface SearchResultsProps {
  results: models.SearchResultType[];
  loading: boolean;
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, query }) => {
  const getIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'job':
        return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'training':
        return <GraduationCap className="h-5 w-5 text-green-600" />;
      case 'knowledge_resource':
        return <FileText className="h-5 w-5 text-purple-600" />;
      case 'partner':
        return <Building2 className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'job':
        return 'Job Opportunity';
      case 'training':
        return 'Training Program';
      case 'knowledge_resource':
        return 'Resource';
      case 'partner':
        return 'Organization';
      default:
        return 'Content';
    }
  };

  const getTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'job':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-green-100 text-green-800';
      case 'knowledge_resource':
        return 'bg-purple-100 text-purple-800';
      case 'partner':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="flex items-start space-x-4">
                <div className="h-5 w-5 bg-neutral-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-300 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-300 rounded w-1/4"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-neutral-300 rounded"></div>
                    <div className="h-3 bg-neutral-300 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-neutral-400" />
        <h3 className="mt-2 text-sm font-medium text-neutral-900">No results found</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Try adjusting your search terms or browse our categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {query && (
        <div className="text-sm text-neutral-600">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </div>
      )}
      
      {results.map((result) => (
        <div
          key={result.id}
          className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            // In a real app, this would navigate to the specific item
            console.log('Navigate to:', result.source_type, result.id);
          }}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getIcon(result.source_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.source_type)}`}>
                  {getTypeLabel(result.source_type)}
                </span>
                {result.similarity > 0.8 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    High Match
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {result.title}
              </h3>
              
              <p className="text-sm text-neutral-600 mb-3">
                {result.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                  Relevance: {Math.round(result.similarity * 100)}%
                </div>
                <ExternalLink className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
