/**
 * Utility functions for Supabase operations
 *
 * This utility provides helper functions for common Supabase operations,
 * with built-in error handling and logging.
 */

import { supabase } from './supabase';
import { withErrorHandling } from './error-logger';
import { Database } from './database.types';

type Tables = Database['public']['Tables'];

/**
 * Get a single record by ID
 */
export async function getById<T extends keyof Tables>(
  table: T,
  id: string,
  options: {
    select?: string;
    throwOnError?: boolean;
  } = {}
): Promise<Tables[T]['Row'] | null> {
  const { select = '*', throwOnError = false } = options;

  return withErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    },
    {
      context: `Get ${String(table)} by ID: ${id}`,
      throwError: throwOnError
    }
  );
}

/**
 * Create a new record
 */
export async function createRecord<T extends keyof Tables>(
  table: T,
  record: Tables[T]['Insert'],
  options: {
    returnRecord?: boolean;
    select?: string;
    throwOnError?: boolean;
  } = {}
): Promise<Tables[T]['Row'] | null> {
  const {
    returnRecord = true,
    select = '*',
    throwOnError = false
  } = options;

  return withErrorHandling(
    async () => {
      const query = supabase
        .from(table)
        .insert(record);

      if (returnRecord) {
        query.select(select).single();
      }

      const { data, error } = await query;

      if (error) throw error;

      return returnRecord ? data : null;
    },
    {
      context: `Create ${String(table)} record`,
      data: { record },
      throwError: throwOnError
    }
  );
}

/**
 * Update a record by ID
 */
export async function updateById<T extends keyof Tables>(
  table: T,
  id: string,
  updates: Tables[T]['Update'],
  options: {
    returnRecord?: boolean;
    select?: string;
    throwOnError?: boolean;
  } = {}
): Promise<Tables[T]['Row'] | null> {
  const {
    returnRecord = true,
    select = '*',
    throwOnError = false
  } = options;

  return withErrorHandling(
    async () => {
      const query = supabase
        .from(table)
        .update(updates)
        .eq('id', id);

      if (returnRecord) {
        query.select(select).single();
      }

      const { data, error } = await query;

      if (error) throw error;

      return returnRecord ? data : null;
    },
    {
      context: `Update ${String(table)} record: ${id}`,
      data: { updates },
      throwError: throwOnError
    }
  );
}

/**
 * Delete a record by ID
 */
export async function deleteById<T extends keyof Tables>(
  table: T,
  id: string,
  options: {
    throwOnError?: boolean;
  } = {}
): Promise<boolean> {
  const { throwOnError = false } = options;

  return withErrorHandling(
    async () => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    },
    {
      context: `Delete ${String(table)} record: ${id}`,
      throwError: throwOnError
    }
  );
}

/**
 * Query records with filters
 */
export async function queryRecords<T extends keyof Tables>(
  table: T,
  options: {
    select?: string;
    filters?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    throwOnError?: boolean;
  } = {}
): Promise<Tables[T]['Row'][]> {
  const {
    select = '*',
    filters = {},
    order,
    limit,
    throwOnError = false
  } = options;

  return withErrorHandling(
    async () => {
      let query = supabase
        .from(table)
        .select(select);

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(column, value);
        }
      });

      // Apply ordering
      if (order) {
        query = query.order(order.column, {
          ascending: order.ascending !== false
        });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    {
      context: `Query ${String(table)} records`,
      data: { filters, order, limit },
      throwError: throwOnError
    }
  );
}
