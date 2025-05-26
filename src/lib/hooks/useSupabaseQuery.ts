import { useEffect, useState, useMemo } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  match?: Record<string, unknown>;
  single?: boolean;
  realtime?: boolean;
}

export function useSupabaseQuery<T = unknown>({
  table,
  select = '*',
  match = {},
  single = false,
  realtime = false
}: UseSupabaseQueryOptions) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the match object to avoid unnecessary re-renders
  const matchString = useMemo(() => JSON.stringify(match), [match]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase
          .from(table)
          .select(select);

        // Add any match conditions
        Object.entries(match).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        // Get single result if specified
        if (single) {
          query = query.single();
        }

        const { data, error } = await query;

        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscription if enabled
    if (realtime) {
      const subscription = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: table
        }, (payload) => {
          // Update data based on change type
          if (payload.eventType === 'INSERT') {
            setData((prev: T | null) => Array.isArray(prev) ? [...prev, payload.new] as T : payload.new as T);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev: T | null) => {
              if (Array.isArray(prev)) {
                return prev.map((item: unknown) => (item as { id: string }).id === payload.new.id ? payload.new : item) as T;
              }
              return payload.new as T;
            });
          } else if (payload.eventType === 'DELETE') {
            setData((prev: T | null) => {
              if (Array.isArray(prev)) {
                return prev.filter((item: unknown) => (item as { id: string }).id !== payload.old.id) as T;
              }
              return null;
            });
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [table, select, matchString, single, realtime, match]);

  return { data, error, loading };
}