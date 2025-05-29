import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { UserType, SecurityEventType } from '../../types/auth';
import { logSecurityEvent } from '../../lib/security/userSecurity';

interface UserProfile {
  id: string;
  user_type: UserType;
  profile_completed: boolean;
  onboarding_completed: boolean;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserType;
  allowWithoutProfile?: boolean; // Allow access even if no profile exists (for onboarding)
  fallbackRedirect?: string; // Custom redirect path for unauthorized access
  requireProfileCompleted?: boolean; // Require profile to be completed
  requireOnboardingCompleted?: boolean; // Require onboarding to be completed
}

/**
 * ProtectedRoute Component
 * 
 * Production-ready route protection with:
 * - Role-based access control using UserType enum
 * - Profile completion status checks
 * - Onboarding flow support
 * - Enhanced error handling and security logging
 * - Type-safe Supabase integration
 * - Optimized rendering with useMemo
 * 
 * Located in /components/auth/ for authentication and authorization components
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowWithoutProfile = false,
  fallbackRedirect,
  requireProfileCompleted = false,
  requireOnboardingCompleted = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Enhanced profile fetching function with retry logic
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔄 ProtectedRoute: Fetching user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id, user_type, profile_completed, onboarding_completed')
        .eq('id', userId)
        .maybeSingle<UserProfile>();

      if (error) {
        console.error('❌ ProtectedRoute: Profile fetch error:', error.message || error);
        throw error;
      }

      console.log('✅ ProtectedRoute: Profile fetched:', profile ? 'found' : 'not found');
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      console.error('❌ ProtectedRoute: Profile fetch failed:', errorMessage);
      
      // Log security event for profile fetch failures
      try {
        await logSecurityEvent(
          userId,
          SecurityEventType.SuspiciousActivity,
          '127.0.0.1',
          navigator.userAgent,
          { 
            action: 'profile_fetch_failed',
            error: errorMessage,
            route: window.location.pathname
          },
          'medium'
        );
      } catch (logError) {
        console.warn('⚠️ ProtectedRoute: Failed to log security event:', logError);
      }

      throw error;
    }
  }, []);

  // Authorization check logic
  const checkAuthorization = useCallback(async () => {
    // Defensive check for user and user.id
    if (!user?.id) {
      console.log('🔓 ProtectedRoute: No user ID available');
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError(null);

      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);

      // Handle missing profile case
      if (!profile) {
        if (allowWithoutProfile) {
          console.log('🔓 ProtectedRoute: No profile found, but allowWithoutProfile=true, granting access');
        } else {
          console.log('🔓 ProtectedRoute: No profile found, access denied');
          setProfileError('Profile not found');
        }
        return;
      }

      // Log successful profile access
      try {
        await logSecurityEvent(
          user.id,
          SecurityEventType.ProfileUpdated,
          '127.0.0.1',
          navigator.userAgent,
          { 
            action: 'route_access',
            route: window.location.pathname,
            userType: profile.user_type,
            requiredRole
          },
          'low'
        );
      } catch (logError) {
        console.warn('⚠️ ProtectedRoute: Failed to log access event:', logError);
      }

      console.log('✅ ProtectedRoute: Authorization check completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authorization check failed';
      console.error('❌ ProtectedRoute: Authorization check failed:', errorMessage);
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id, allowWithoutProfile, fetchUserProfile, requiredRole]);

  // Run authorization check when dependencies change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkAuthorization();
    }
  }, [isAuthenticated, user?.id, checkAuthorization]);

  // Memoized authorization logic for performance
  const authorizationResult = useMemo(() => {
    // Still loading authentication or profile
    if (authLoading || profileLoading) {
      return { authorized: false, redirect: null, reason: 'loading' };
    }

    // Profile error occurred
    if (profileError) {
      return { 
        authorized: false, 
        redirect: allowWithoutProfile ? null : '/complete-profile',
        reason: 'profile_error'
      };
    }

    // No profile but allowWithoutProfile is true
    if (!userProfile && allowWithoutProfile) {
      return { authorized: true, redirect: null, reason: 'no_profile_allowed' };
    }

    // No profile and allowWithoutProfile is false
    if (!userProfile && !allowWithoutProfile) {
      return { 
        authorized: false, 
        redirect: '/complete-profile',
        reason: 'no_profile'
      };
    }

    // Profile exists, check role requirements
    if (userProfile) {
      // Check required role
      if (requiredRole && userProfile.user_type !== requiredRole) {
        console.log(`🔓 ProtectedRoute: Access denied. Required role: ${requiredRole}, User role: ${userProfile.user_type}`);
        return { 
          authorized: false, 
          redirect: fallbackRedirect || '/unauthorized',
          reason: 'role_mismatch'
        };
      }

      // Check profile completion requirement
      if (requireProfileCompleted && !userProfile.profile_completed) {
        console.log('🔓 ProtectedRoute: Access denied. Profile completion required');
        return { 
          authorized: false, 
          redirect: `/onboarding/${userProfile.user_type}/step1`,
          reason: 'profile_incomplete'
        };
      }

      // Check onboarding completion requirement
      if (requireOnboardingCompleted && !userProfile.onboarding_completed) {
        console.log('🔓 ProtectedRoute: Access denied. Onboarding completion required');
        return { 
          authorized: false, 
          redirect: `/onboarding/${userProfile.user_type}/step1`,
          reason: 'onboarding_incomplete'
        };
      }

      // All checks passed
      return { authorized: true, redirect: null, reason: 'authorized' };
    }

    // Default fallback
    return { 
      authorized: false, 
      redirect: '/unauthorized',
      reason: 'default_fallback'
    };
  }, [
    authLoading,
    profileLoading,
    profileError,
    userProfile,
    allowWithoutProfile,
    requiredRole,
    requireProfileCompleted,
    requireOnboardingCompleted,
    fallbackRedirect
  ]);

  console.log('🔓 ProtectedRoute: Authorization result:', authorizationResult);

  // Check authentication first
  if (!isAuthenticated) {
    console.log('🔓 ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking authentication and authorization
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  // Handle redirects
  if (!authorizationResult.authorized && authorizationResult.redirect) {
    console.log(`🔄 ProtectedRoute: Redirecting to ${authorizationResult.redirect} (reason: ${authorizationResult.reason})`);
    return <Navigate to={authorizationResult.redirect} replace />;
  }

  // Handle authorization failure without redirect (shouldn't happen, but defensive)
  if (!authorizationResult.authorized) {
    console.log(`🔓 ProtectedRoute: Access denied without redirect (reason: ${authorizationResult.reason})`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorization successful - render children
  console.log('✅ ProtectedRoute: Access granted, rendering children');
  return <>{children}</>;
};