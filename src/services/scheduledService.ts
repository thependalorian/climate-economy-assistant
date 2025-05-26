import { supabase } from '../lib/supabase';
import { generateAllRecommendations } from './recommendationService';

/**
 * This service handles scheduled tasks such as refreshing recommendations
 * for all users and processing new opportunities.
 */

/**
 * Refresh recommendations for all users
 * @returns A promise that resolves when recommendations have been refreshed for all users
 */
export const refreshAllRecommendations = async (): Promise<void> => {
  try {
    // Fetch all active users
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('active', true);
    
    if (error) throw error;
    
    console.log(`Refreshing recommendations for ${users?.length || 0} users`);
    
    // Process users in batches to avoid overwhelming the system
    const batchSize = 10;
    const userIds = users?.map(user => user.id) || [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Process each user in the batch concurrently
      await Promise.all(
        batch.map(userId => 
          generateAllRecommendations(userId)
            .catch(error => {
              console.error(`Error refreshing recommendations for user ${userId}:`, error);
              // Continue with other users even if one fails
            })
        )
      );
      
      console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(userIds.length / batchSize)}`);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished refreshing recommendations for all users');
  } catch (error) {
    console.error('Error refreshing all recommendations:', error);
    throw error;
  }
};

/**
 * Process new opportunities and update recommendations
 * @param since Optional timestamp to process opportunities added since a specific time
 * @returns A promise that resolves when new opportunities have been processed
 */
export const processNewOpportunities = async (since?: string): Promise<void> => {
  try {
    const timestamp = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default to last 24 hours
    
    // Fetch new job listings
    const { data: newJobs, error: jobsError } = await supabase
      .from('job_listings')
      .select('id')
      .eq('active', true)
      .gte('created_at', timestamp);
    
    if (jobsError) throw jobsError;
    
    // Fetch new training programs
    const { data: newTraining, error: trainingError } = await supabase
      .from('training_programs')
      .select('id')
      .eq('active', true)
      .gte('created_at', timestamp);
    
    if (trainingError) throw trainingError;
    
    // Fetch new resources
    const { data: newResources, error: resourcesError } = await supabase
      .from('resources')
      .select('id')
      .gte('created_at', timestamp);
    
    if (resourcesError) throw resourcesError;
    
    const totalNew = (newJobs?.length || 0) + (newTraining?.length || 0) + (newResources?.length || 0);
    
    console.log(`Processing ${totalNew} new opportunities added since ${timestamp}`);
    
    if (totalNew > 0) {
      // If there are new opportunities, refresh recommendations for all users
      await refreshAllRecommendations();
    } else {
      console.log('No new opportunities to process');
    }
  } catch (error) {
    console.error('Error processing new opportunities:', error);
    throw error;
  }
};

/**
 * Simulate a scheduled run of the recommendation refresh
 * This would be triggered by a cron job in a real application
 * @returns A promise that resolves when the scheduled run is complete
 */
export const simulateScheduledRun = async (): Promise<void> => {
  console.log('Starting scheduled recommendation refresh');
  
  try {
    // Process new opportunities first
    await processNewOpportunities();
    
    // Then refresh recommendations for all users
    await refreshAllRecommendations();
    
    console.log('Scheduled recommendation refresh completed successfully');
  } catch (error) {
    console.error('Error in scheduled recommendation refresh:', error);
  }
};

export default {
  refreshAllRecommendations,
  processNewOpportunities,
  simulateScheduledRun
};
