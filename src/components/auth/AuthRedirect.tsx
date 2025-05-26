import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * AuthRedirect Component
 * 
 * Handles proper authentication flow:
 * 1. If user is not authenticated → redirect to login
 * 2. If user is authenticated but has no profile → redirect to onboarding
 * 3. If user is authenticated and has profile → allow access
 * 
 * This component replaces the problematic QuickAuthCheck for onboarding routes
 */
export const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      console.log('🔄 AuthRedirect: Still loading, waiting...');
      return;
    }

    console.log('🔍 AuthRedirect: Checking auth state', {
      user: user?.email || 'none',
      profile: profile?.id || 'none',
      currentPath: window.location.pathname
    });

    // Case 1: No user at all → redirect to login
    if (!user) {
      console.log('🚫 AuthRedirect: No user found, redirecting to login');
      setRedirectPath('/login');
      return;
    }

    // Case 2: User exists but no profile → this is a NEW USER, allow onboarding
    if (user && !profile) {
      console.log('✅ AuthRedirect: New user detected (no profile), allowing onboarding access');
      setRedirectPath(null); // Allow access to onboarding
      return;
    }

    // Case 3: User exists and has profile → check if they should be in onboarding
    if (user && profile) {
      const currentPath = window.location.pathname;
      
      // If user has completed profile but is on onboarding page, redirect to dashboard
      if (profile.profile_completed && currentPath.includes('/onboarding/')) {
        console.log('🔄 AuthRedirect: User has completed profile, redirecting to dashboard');
        const dashboardPath = profile.user_type === 'partner' ? '/partner-dashboard' : '/dashboard';
        setRedirectPath(dashboardPath);
        return;
      }

      // If user has incomplete profile and is on onboarding page, allow access
      if (!profile.profile_completed && currentPath.includes('/onboarding/')) {
        console.log('✅ AuthRedirect: User has incomplete profile, allowing onboarding access');
        setRedirectPath(null);
        return;
      }

      // If user has incomplete profile but NOT on onboarding page, redirect to onboarding
      if (!profile.profile_completed && !currentPath.includes('/onboarding/')) {
        console.log('🔄 AuthRedirect: User has incomplete profile, redirecting to onboarding');
        const onboardingPath = `/onboarding/${profile.user_type}/step1`;
        setRedirectPath(onboardingPath);
        return;
      }

      // Default: allow access
      console.log('✅ AuthRedirect: All checks passed, allowing access');
      setRedirectPath(null);
    }
  }, [user, profile, loading]);

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
    console.log('🔄 AuthRedirect: Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Allow access
  return <>{children}</>;
}; 