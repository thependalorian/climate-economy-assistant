import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles search functionality across different content types
 * in the Climate Ecosystem Assistant platform.
 */

/**
 * Search for content across the platform
 * @param query The search query
 * @param filters Optional filters to apply to the search
 * @param limit Maximum number of results to return
 * @param offset Number of results to skip (for pagination)
 * @returns A promise that resolves to an array of search results
 */
export const searchContent = async ({
  query,
  filters = {},
  limit = 10,
  offset = 0
}: models.SearchQueryType): Promise<models.SearchResultType[]> => {
  try {
    // In a real implementation, this would use vector search with embeddings
    // For this simulation, we'll use a simple text search across multiple tables

    const results: models.SearchResultType[] = [];

    // Search job listings
    if (!filters.content_type || filters.content_type === 'job') {
      const { data: jobData, error: jobError } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          description,
          climate_sector,
          partner_id (organization_name)
        `)
        .textSearch('title', query, { type: 'websearch' })
        .or(`description.textSearch.${query}`)
        .eq('active', true)
        .limit(limit);

      if (jobError) throw jobError;

      if (jobData) {
        results.push(...jobData.map(job => ({
          id: job.id,
          title: job.title,
          description: job.description.substring(0, 200) + '...',
          content_type: 'job_listing',
          source_type: 'job',
          similarity: calculateRelevance(query, job.title + ' ' + job.description)
        })));
      }
    }

    // Search training programs
    if (!filters.content_type || filters.content_type === 'training') {
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_programs')
        .select(`
          id,
          title,
          description,
          climate_sector,
          partner_id (organization_name)
        `)
        .textSearch('title', query, { type: 'websearch' })
        .or(`description.textSearch.${query}`)
        .eq('active', true)
        .limit(limit);

      if (trainingError) throw trainingError;

      if (trainingData) {
        results.push(...trainingData.map(program => ({
          id: program.id,
          title: program.title,
          description: program.description.substring(0, 200) + '...',
          content_type: 'training_program',
          source_type: 'training',
          similarity: calculateRelevance(query, program.title + ' ' + program.description)
        })));
      }
    }

    // Search resources
    if (!filters.content_type || filters.content_type === 'resource') {
      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          resource_type,
          climate_sector,
          tags
        `)
        .textSearch('title', query, { type: 'websearch' })
        .or(`description.textSearch.${query}`)
        .eq('active', true)
        .limit(limit);

      if (resourceError) throw resourceError;

      if (resourceData) {
        results.push(...resourceData.map(resource => ({
          id: resource.id,
          title: resource.title,
          description: resource.description.substring(0, 200) + '...',
          content_type: resource.resource_type,
          source_type: 'knowledge_resource',
          similarity: calculateRelevance(query, resource.title + ' ' + resource.description)
        })));
      }
    }

    // Search partners
    if (!filters.content_type || filters.content_type === 'partner') {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select(`
          id,
          organization_name,
          description,
          climate_focus
        `)
        .textSearch('organization_name', query, { type: 'websearch' })
        .or(`description.textSearch.${query}`)
        .eq('verified', true)
        .limit(limit);

      if (partnerError) throw partnerError;

      if (partnerData) {
        results.push(...partnerData.map(partner => ({
          id: partner.id,
          title: partner.organization_name,
          description: partner.description?.substring(0, 200) + '...' || 'No description available',
          content_type: 'organization',
          source_type: 'partner',
          similarity: calculateRelevance(query, partner.organization_name + ' ' + (partner.description || ''))
        })));
      }
    }

    // Sort results by similarity score
    results.sort((a, b) => b.similarity - a.similarity);

    // Apply pagination
    return results.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
};

/**
 * Calculates the relevance score of a document to a query
 * @param query The search query
 * @param content The document content
 * @returns A relevance score between 0 and 1
 */
const calculateRelevance = (query: string, content: string): number => {
  // In a real implementation, this would use a more sophisticated algorithm
  // For this simulation, we'll use a simple keyword matching approach

  const queryTerms = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();

  // Count how many query terms appear in the content
  const matchCount = queryTerms.filter(term => contentLower.includes(term)).length;

  // Calculate relevance score
  return matchCount / queryTerms.length;
};

/**
 * Track a search query for analytics
 * @param userId The user ID
 * @param query The search query
 * @param filters The filters applied to the search
 * @param resultCount The number of results returned
 */
export const trackSearch = async (
  userId: string,
  query: string,
  filters: Record<string, unknown>,
  resultCount: number
): Promise<void> => {
  try {
    await supabase
      .from('user_activities')
      .insert([
        {
          user_id: userId,
          activity_type: 'search',
          activity_data: {
            query,
            filters,
            result_count: resultCount,
            timestamp: new Date().toISOString()
          }
        }
      ]);
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

export default {
  searchContent,
  trackSearch
};
