import React, { useEffect } from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

export const DashboardRouter: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Debug: Log the current location and profile
  useEffect(() => {
    console.log('🎯 DashboardRouter - Current location:', location.pathname);
    console.log('🎯 DashboardRouter - User:', user?.email);
    console.log('🎯 DashboardRouter - Profile:', profile);
    console.log('🎯 DashboardRouter - User Type:', profile?.user_type);
    console.log('🎯 DashboardRouter - Loading:', loading);
  }, [location, user, profile, loading]);

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-neutral-200 rounded mb-4"></div>
            <div className="h-4 w-96 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Redirect to login if no user
  if (!user) {
    console.log('🔄 No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Show error if no profile
  if (!profile) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            No profile found. Please complete your profile setup.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user is a partner and redirect to partner dashboard
  if (profile.user_type === 'partner') {
    console.log('🏢 User is a partner, redirecting to partner dashboard');
    return <Navigate to="/partner-dashboard" replace />;
  }

  // Use the Outlet component to render the nested routes for job seekers
  return (
    <DashboardLayout>
      <Outlet context={profile} />
    </DashboardLayout>
  );
};
