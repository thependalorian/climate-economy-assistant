import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface QuickAuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * A lightweight auth check that doesn't wait for the full Supabase session
 * Uses localStorage to quickly determine if user is likely authenticated
 */
export const QuickAuthCheck: React.FC<QuickAuthCheckProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 QuickAuthCheck: Checking authentication status...');
      console.log('🔍 QuickAuthCheck: Current URL:', window.location.href);

      // Check all possible Supabase localStorage keys
      const allKeys = Object.keys(localStorage);
      console.log('🔍 QuickAuthCheck: All localStorage keys:', allKeys);

      // Look for any Supabase auth-related keys
      const supabaseKeys = allKeys.filter(key => key.includes('supabase') || key.includes('sb-'));
      console.log('🔍 QuickAuthCheck: Supabase keys found:', supabaseKeys);

      // Check multiple possible key patterns
      const possibleKeys = [
        'sb-kvtkpguwoaqokcylzpic-auth-token',
        'supabase.auth.token',
        'sb-auth-token',
        'supabase-auth-token'
      ];

      let hasSupabaseSession = false;
      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value && value !== 'null' && value !== 'undefined') {
          console.log('🔍 QuickAuthCheck: Found session in key:', key);
          hasSupabaseSession = true;
          break;
        }
      }

      // Also check for any supabase key that contains auth data
      for (const key of supabaseKeys) {
        const value = localStorage.getItem(key);
        if (value && value !== 'null' && value !== 'undefined') {
          try {
            const parsed = JSON.parse(value);
            if (parsed && (parsed.access_token || parsed.user)) {
              console.log('🔍 QuickAuthCheck: Found auth data in key:', key);
              hasSupabaseSession = true;
              break;
            }
          } catch {
            // Not JSON, skip
          }
        }
      }

      console.log('🔍 QuickAuthCheck: Supabase session exists:', hasSupabaseSession);

      if (!hasSupabaseSession) {
        console.log('🔄 QuickAuthCheck: No session found, redirecting to login');
        setShouldRedirect(true);
      } else {
        console.log('✅ QuickAuthCheck: Session found, allowing access');
      }

      setIsChecking(false);
    };

    // Small delay to allow localStorage to be populated
    const timeout = setTimeout(checkAuth, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirect) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
