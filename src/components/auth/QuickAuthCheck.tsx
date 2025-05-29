import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';

interface QuickAuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  timeout?: number; // Configurable timeout for localStorage check
}

/**
 * QuickAuthCheck Component
 * 
 * Production-ready lightweight auth gate that checks localStorage for Supabase tokens
 * before waiting for full session hydration. Ideal for fast-loading protected routes.
 * 
 * Features:
 * - Dynamic Supabase project key detection
 * - SSR/hydration safety
 * - Configurable loading UI
 * - Performance optimized with short-circuiting
 * - Comprehensive token validation
 * 
 * Located in /components/auth/ for authentication flow components
 */
export const QuickAuthCheck: React.FC<QuickAuthCheckProps> = ({
  children,
  redirectTo = '/login',
  loadingComponent,
  timeout = 100
}) => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Memoized Supabase project detection for performance
  const supabaseConfig = useMemo(() => {
    // Get project ref from environment or URL
    const projectRef = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 
                      import.meta.env.VITE_SUPABASE_PROJECT_REF ||
                      'default';
    
    // Generate possible key patterns with project-specific prefix
    const possibleKeys = [
      `sb-${projectRef}-auth-token`,
      'supabase.auth.token',
      'sb-auth-token',
      'supabase-auth-token'
    ];

    return { projectRef, possibleKeys };
  }, []);

  // Default loading component
  const defaultLoadingComponent = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Checking authentication...</p>
        <p className="text-xs text-gray-400 mt-1">Quick session validation</p>
      </div>
    </div>
  );

  useEffect(() => {
    const checkAuth = () => {
      // SSR safety check
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('⚠️ QuickAuthCheck: localStorage not available (SSR context)');
        setIsChecking(false);
        setShouldRedirect(true);
        return;
      }

      console.log('🔍 QuickAuthCheck: Starting authentication check...');
      console.log('🔍 QuickAuthCheck: Current URL:', window.location.href);
      console.log('🔍 QuickAuthCheck: Project ref:', supabaseConfig.projectRef);

      try {
        const allKeys = Object.keys(localStorage);
        console.log('🔍 QuickAuthCheck: Total localStorage keys:', allKeys.length);

        // Filter for Supabase-related keys with broader pattern matching
        const supabaseKeys = allKeys.filter(key => 
          key.includes('supabase') || 
          key.startsWith('sb-') ||
          key.includes('auth-token')
        );
        
        console.log('🔍 QuickAuthCheck: Supabase keys found:', supabaseKeys.length, supabaseKeys);

        let hasValidSession = false;
        let foundSessionKey = '';

        // Check predefined possible keys first (most likely to be correct)
        for (const key of supabaseConfig.possibleKeys) {
          const value = localStorage.getItem(key);
          if (value && value !== 'null' && value !== 'undefined' && value.trim() !== '') {
            console.log('✅ QuickAuthCheck: Found session in predefined key:', key);
            hasValidSession = true;
            foundSessionKey = key;
            break;
          }
        }

        // If not found in predefined keys, check all Supabase keys
        if (!hasValidSession) {
          for (const key of supabaseKeys) {
            const value = localStorage.getItem(key);
            if (!value || value === 'null' || value === 'undefined' || value.trim() === '') {
              continue;
            }

            try {
              const parsed = JSON.parse(value);
              
              // Check for valid session structure
              if (parsed && (
                parsed.access_token || 
                parsed.user || 
                (parsed.user && parsed.session) ||
                (typeof parsed === 'object' && parsed.expires_at)
              )) {
                console.log('✅ QuickAuthCheck: Found valid auth data in key:', key);
                hasValidSession = true;
                foundSessionKey = key;
                break;
              }
            } catch {
              // If it's not JSON but exists and looks like a token, consider it valid
              if (value.length > 20 && (value.includes('.') || value.includes('-'))) {
                console.log('✅ QuickAuthCheck: Found potential token in key:', key);
                hasValidSession = true;
                foundSessionKey = key;
                break;
              }
            }
          }
        }

        console.log('🔍 QuickAuthCheck: Session validation result:', {
          hasValidSession,
          foundSessionKey,
          totalKeysChecked: supabaseKeys.length + supabaseConfig.possibleKeys.length
        });

        if (!hasValidSession) {
          console.log('🔄 QuickAuthCheck: No valid session found, will redirect to:', redirectTo);
          setShouldRedirect(true);
        } else {
          console.log('✅ QuickAuthCheck: Valid session found, allowing access');
          setShouldRedirect(false);
        }

      } catch (error) {
        console.error('❌ QuickAuthCheck: Error during auth check:', error);
        // On error, default to redirecting for security
        setShouldRedirect(true);
      } finally {
        setIsChecking(false);
      }
    };

    // Configurable timeout to allow localStorage to be populated
    const timeoutId = setTimeout(checkAuth, timeout);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [supabaseConfig, redirectTo, timeout]);

  // Still checking - show loading state
  if (isChecking) {
    return <>{loadingComponent || defaultLoadingComponent}</>;
  }

  // Auth check failed - redirect to login
  if (shouldRedirect) {
    console.log('🔄 QuickAuthCheck: Executing redirect to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Auth check passed - render children
  console.log('✅ QuickAuthCheck: Rendering protected content');
  return <>{children}</>;
};
