import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  requiredRole?: 'job_seeker' | 'partner' | 'admin';
  allowWithoutProfile?: boolean; // Allow access even if no profile exists (for onboarding)
}



export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  children,
  requiredRole,
  allowWithoutProfile = false
}) => {
  console.log('🔓 ProtectedRoute: Component rendering', {
    isAuthenticated,
    requiredRole,
    allowWithoutProfile,
    currentPath: window.location.pathname
  });

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  console.log('🔓 ProtectedRoute: User from useAuth:', user?.email || 'no user');

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile to determine role
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('id, user_type, profile_completed, onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);

          // If allowWithoutProfile is true (for onboarding), allow access even without profile
          if (allowWithoutProfile) {
            console.log('🔓 ProtectedRoute: No profile found, but allowWithoutProfile=true, granting access');
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
          setLoading(false);
          return;
        }

        // Check if user has required role
        if (requiredRole && userProfile?.user_type !== requiredRole) {
          console.log(`Access denied. Required role: ${requiredRole}, User role: ${userProfile?.user_type}`);
          setAuthorized(false);
          setLoading(false);
          return;
        }

        console.log('🔓 ProtectedRoute: Access granted');
        setAuthorized(true);
      } catch (error) {
        console.error('Error in route authorization:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [isAuthenticated, user, requiredRole, allowWithoutProfile]);

  // Show loading while checking authentication and authorization
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spring-green"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to unauthorized page if role doesn't match
  if (requiredRole && !authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};