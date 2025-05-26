import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

export const OnboardingRedirect: React.FC<OnboardingRedirectProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('🎯 OnboardingRedirect - User:', user?.email);
    console.log('🎯 OnboardingRedirect - Profile:', profile);
    console.log('🎯 OnboardingRedirect - Loading:', loading);
    console.log('🎯 OnboardingRedirect - Current path:', location.pathname);
  }, [user, profile, loading, location]);

  // Add a timeout to prevent infinite loading
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⏰ OnboardingRedirect: Loading timeout - this might indicate an auth issue');
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Don't redirect if still loading (but add timeout for debugging)
  if (loading) {
    console.log('🔄 OnboardingRedirect: Still loading auth state...');

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spring-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Don't redirect if no user
  if (!user) {
    return <>{children}</>;
  }

  // Don't redirect if already on onboarding pages
  if (location.pathname.includes('/onboarding/')) {
    return <>{children}</>;
  }

  // Don't redirect if on auth callback
  if (location.pathname.includes('/auth/callback')) {
    return <>{children}</>;
  }

  // If user exists but no profile, check for stored user type preference
  if (!profile) {
    // Check localStorage for user type preference from registration
    const storedUserType = localStorage.getItem('pendingUserType');
    console.log('🔄 No profile found - stored user type:', storedUserType);
    console.log('🔍 All localStorage keys:', Object.keys(localStorage));
    console.log('🔍 Current path:', location.pathname);

    // Check if we're already on an onboarding page to prevent infinite redirects
    if (location.pathname.includes('/onboarding/')) {
      console.log('ℹ️ Already on onboarding page, not redirecting');
      return <>{children}</>;
    }

    if (storedUserType === 'partner') {
      console.log('🔄 Redirecting to partner onboarding step 1 based on stored preference');
      return <Navigate to="/onboarding/partner/step1" replace />;
    } else if (storedUserType === 'job_seeker') {
      console.log('🔄 Redirecting to job seeker onboarding step 1 based on stored preference');
      return <Navigate to="/onboarding/job-seeker/step1" replace />;
    } else {
      console.log('⚠️ No stored user type found, checking URL or defaulting to job seeker');

      // Check if URL has type parameter as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const urlType = urlParams.get('type');

      if (urlType === 'partner') {
        console.log('🔄 Using URL parameter: redirecting to partner onboarding step 1');
        localStorage.setItem('pendingUserType', 'partner'); // Store for future use
        return <Navigate to="/onboarding/partner/step1" replace />;
      } else {
        console.log('🔄 Defaulting to job seeker onboarding step 1');
        return <Navigate to="/onboarding/job-seeker/step1" replace />;
      }
    }
  }

  // If profile exists but not completed, redirect to appropriate onboarding step 1
  if (!profile.profile_completed) {
    console.log('🔄 Profile not completed - redirecting to step 1 based on user type');

    switch (profile.user_type) {
      case 'partner':
        return <Navigate to="/onboarding/partner/step1" replace />;
      case 'admin':
        // Admins might not need onboarding, or have a different flow
        return <Navigate to="/admin-dashboard" replace />;
      case 'job_seeker':
      default:
        return <Navigate to="/onboarding/job-seeker/step1" replace />;
    }
  }

  // If profile is completed, redirect to appropriate dashboard
  if (profile.profile_completed && location.pathname === '/') {
    console.log('🔄 Profile completed - redirecting to dashboard');

    switch (profile.user_type) {
      case 'partner':
        return <Navigate to="/partner-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'job_seeker':
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // Default: render children
  return <>{children}</>;
};
