/**
 * Error logging utility for Supabase operations
 *
 * This utility provides enhanced error logging for Supabase operations,
 * making it easier to diagnose and fix issues with database interactions.
 */

import { PostgrestError } from '@supabase/supabase-js';

interface ErrorLogOptions {
  context?: string;
  data?: unknown;
  silent?: boolean;
  throwError?: boolean;
}

/**
 * Log a Supabase error with additional context
 */
export function logSupabaseError(
  error: PostgrestError | Error | unknown,
  options: ErrorLogOptions = {}
): void {
  const {
    context = 'Supabase operation',
    data,
    silent = false,
    throwError = false
  } = options;

  // Format the error message
  let errorMessage = '';
  let errorDetails = '';

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    // Handle PostgrestError
    const postgrestError = error as PostgrestError;
    if (postgrestError.code && postgrestError.message) {
      errorMessage = `${postgrestError.code}: ${postgrestError.message}`;
      errorDetails = postgrestError.details || '';
    } else {
      // Handle other object errors
      errorMessage = JSON.stringify(error);
    }
  } else {
    // Handle primitive errors
    errorMessage = String(error);
  }

  // Create a structured log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    context,
    error: errorMessage,
    details: errorDetails,
    data
  };

  // Log the error (unless silent is true)
  if (!silent) {
    console.error(`[ERROR] ${context}:`, logEntry);
  }

  // Throw the error if requested
  if (throwError) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Wrap a Supabase operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: ErrorLogOptions = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logSupabaseError(error, options);

    if (options.throwError !== false) {
      throw error;
    }

    return null as T;
  }
}

/**
 * Check if an error is a specific Supabase error
 */
export function isSupabaseError(error: unknown, code?: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const postgrestError = error as PostgrestError;

  if (!postgrestError.code) {
    return false;
  }

  if (code) {
    return postgrestError.code === code;
  }

  return true;
}

/**
 * Get a user-friendly error message from a Supabase error
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  const postgrestError = error as PostgrestError;

  if (postgrestError.code) {
    // Handle specific error codes
    switch (postgrestError.code) {
      case '23505': // unique_violation
        return 'This record already exists';
      case '23503': // foreign_key_violation
        return 'This operation references a record that does not exist';
      case '42P01': // undefined_table
        return 'The requested resource does not exist';
      case '42501': // insufficient_privilege
        return 'You do not have permission to perform this action';
      case '22P02': // invalid_text_representation
        return 'Invalid input format';
      default:
        return postgrestError.message || 'An error occurred with the database';
    }
  }

  return 'An unexpected error occurred';
}
