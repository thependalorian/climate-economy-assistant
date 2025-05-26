import { useCallback } from 'react';
import { supabase } from '../supabase';

export function useAnalytics() {
  const trackEvent = useCallback(async (eventName: string, properties?: Record<string, unknown>) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_name: eventName,
          properties,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  return { trackEvent };
}