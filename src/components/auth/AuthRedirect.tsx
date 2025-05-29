import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserType } from '../../types/auth';

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * AuthRedirect Component
 * 
 * Handles proper authentication flow with type-safe routing:
 * 1. If user is not authenticated → redirect to login
 * 2. If user is authenticated but has no profile → redirect to onboarding
 * 3. If user is authenticated and has profile → allow access
 * 
 * This component replaces the problematic QuickAuthCheck for onboarding routes
 * and provides memoized redirect logic for optimal performance.
 */
export const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Memoized redirect logic for performance optimization
  const authRedirectLogic = useMemo(() => {
    if (loading) {
      return { shouldRedirect: false, path: null, reason: 'loading' };
    }

    const currentPath = window.location.pathname;

    // Case 1: No user at all → redirect to login
    if (!user) {
      return { 
        shouldRedirect: true, 
        path: '/login', 
        reason: 'no_user' 
      };
    }

    // Case 2: User exists but no profile → this is a NEW USER, allow onboarding
    if (user && !profile) {
      return { 
        shouldRedirect: false, 
        path: null, 
        reason: 'new_user_onboarding' 
      };
    }

    // Case 3: User exists and has profile → check routing logic
    if (user && profile) {
      const userType = profile.user_type as UserType;
      
      // Type-safe dashboard routing
      const getDashboardPath = (type: UserType): string => {
        switch (type) {
          case UserType.Partner:
            return '/partner-dashboard';
          case UserType.JobSeeker:
            return '/dashboard';
          case UserType.Admin:
            return '/admin-dashboard';
          default:
            return '/dashboard';
        }
      };

      // Type-safe onboarding routing
      const getOnboardingPath = (type: UserType): string => {
        switch (type) {
          case UserType.Partner:
            return '/onboarding/partner/step1';
          case UserType.JobSeeker:
            return '/onboarding/job_seeker/step1';
          case UserType.Admin:
            return '/onboarding/admin/step1';
          default:
            return '/onboarding/job_seeker/step1';
        }
      };

      // If user has completed profile but is on onboarding page, redirect to dashboard
      if (profile.profile_completed && currentPath.includes('/onboarding/')) {
        return { 
          shouldRedirect: true, 
          path: getDashboardPath(userType), 
          reason: 'profile_completed_on_onboarding' 
        };
      }

      // If user has incomplete profile and is on onboarding page, allow access
      if (!profile.profile_completed && currentPath.includes('/onboarding/')) {
        return { 
          shouldRedirect: false, 
          path: null, 
          reason: 'incomplete_profile_on_onboarding' 
        };
      }

      // If user has incomplete profile but NOT on onboarding page, redirect to onboarding
      if (!profile.profile_completed && !currentPath.includes('/onboarding/')) {
        return { 
          shouldRedirect: true, 
          path: getOnboardingPath(userType), 
          reason: 'incomplete_profile_not_onboarding' 
        };
      }

      // Default: allow access
      return { 
        shouldRedirect: false, 
        path: null, 
        reason: 'all_checks_passed' 
      };
    }

    return { shouldRedirect: false, path: null, reason: 'fallback' };
  }, [user, profile, loading]);

  useEffect(() => {
    const { shouldRedirect, path, reason } = authRedirectLogic;

    console.log('🔍 AuthRedirect: Auth state check', {
      user: user?.email || 'none',
      profile: profile?.id || 'none',
      userType: profile?.user_type || 'none',
      profileCompleted: profile?.profile_completed || false,
      currentPath: window.location.pathname,
      reason,
      redirectTo: path || 'none'
    });

    if (shouldRedirect && path) {
      console.log(`🔄 AuthRedirect: Redirecting to ${path} (reason: ${reason})`);
      setRedirectPath(path);
    } else {
      console.log(`✅ AuthRedirect: Access granted (reason: ${reason})`);
      setRedirectPath(null);
    }
  }, [authRedirectLogic, user, profile]);

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if needed
  if (redirectPath) {
    console.log('🔄 AuthRedirect: Executing redirect to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Allow access
  return <>{children}</>;
}; 