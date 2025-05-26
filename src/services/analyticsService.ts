import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles analytics tracking and reporting
 * for the Climate Ecosystem Assistant platform.
 */

/**
 * Track a user activity
 * @param userId The user ID
 * @param activityType The type of activity
 * @param activityData Additional data about the activity
 * @returns A promise that resolves to the created activity
 */
export const trackActivity = async (
  userId: string,
  activityType: string,
  activityData: Record<string, unknown> = {}
): Promise<models.UserActivityType | null> => {
  try {
    const { data, error } = await supabase
      .from('user_activities')
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error tracking activity:', error);
    return null;
  }
};

/**
 * Track a page view
 * @param userId The user ID
 * @param path The page path
 * @param referrer The referrer URL
 * @returns A promise that resolves to the created activity
 */
export const trackPageView = async (
  userId: string,
  path: string,
  referrer?: string
): Promise<models.UserActivityType | null> => {
  return trackActivity(userId, 'page_view', {
    path,
    referrer,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track a feature usage
 * @param userId The user ID
 * @param feature The feature name
 * @param action The action performed
 * @param details Additional details about the usage
 * @returns A promise that resolves to the created activity
 */
export const trackFeatureUsage = async (
  userId: string,
  feature: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<models.UserActivityType | null> => {
  return trackActivity(userId, 'feature_usage', {
    feature,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Record an analytics metric
 * @param metricName The name of the metric
 * @param metricValue The value of the metric
 * @param dimension Optional dimension name
 * @param dimensionValue Optional dimension value
 * @returns A promise that resolves to the created metric
 */
export const recordMetric = async (
  metricName: string,
  metricValue: number,
  dimension?: string,
  dimensionValue?: string
): Promise<models.AnalyticsMetricType | null> => {
  try {
    const { data, error } = await supabase
      .from('analytics_metrics')
      .insert([
        {
          metric_name: metricName,
          metric_value: metricValue,
          dimension,
          dimension_value: dimensionValue,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      timestamp: new Date(data.timestamp)
    };
  } catch (error) {
    console.error('Error recording metric:', error);
    return null;
  }
};

/**
 * Get user activity history
 * @param userId The user ID
 * @param activityType Optional activity type filter
 * @param limit Maximum number of activities to return
 * @param offset Number of activities to skip (for pagination)
 * @returns A promise that resolves to an array of user activities
 */
export const getUserActivityHistory = async (
  userId: string,
  activityType?: string,
  limit = 50,
  offset = 0
): Promise<models.UserActivityType[]> => {
  try {
    let query = supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(activity => ({
      ...activity,
      created_at: new Date(activity.created_at)
    }));
  } catch (error) {
    console.error('Error fetching user activity history:', error);
    return [];
  }
};

/**
 * Get metrics for a specific time period
 * @param metricName The name of the metric
 * @param startDate The start date
 * @param endDate The end date
 * @param dimension Optional dimension to group by
 * @returns A promise that resolves to an array of metrics
 */
export const getMetrics = async (
  metricName: string,
  startDate: Date,
  endDate: Date,
  dimension?: string
): Promise<models.AnalyticsMetricType[]> => {
  try {
    let query = supabase
      .from('analytics_metrics')
      .select('*')
      .eq('metric_name', metricName)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    if (dimension) {
      query = query.eq('dimension', dimension);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(metric => ({
      ...metric,
      timestamp: new Date(metric.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return [];
  }
};

export default {
  trackActivity,
  trackPageView,
  trackFeatureUsage,
  recordMetric,
  getUserActivityHistory,
  getMetrics
};
