import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export const PartnerDashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Debug: Log the current location
  useEffect(() => {
    console.log('Partner Dashboard - Current location:', location.pathname);
  }, [location]);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setError('No profile found. Please complete your profile.');
        setLoading(false);
        return;
      }

      // Check if user is a partner
      if (profileData.user_type !== 'partner') {
        console.log('User is not a partner, redirecting to regular dashboard');
        return;
      }

      setUserProfile(profileData);
    } catch (err: unknown) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  if (loading) {
    return (
      <DashboardLayout userProfile={null}>
        <div className="container section">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
            <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-6">
                  <div className="h-12 w-12 bg-sand-gray-200 rounded-act mb-4"></div>
                  <div className="h-4 w-20 bg-sand-gray-200 rounded-act mb-2"></div>
                  <div className="h-6 w-16 bg-sand-gray-200 rounded-act"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userProfile={null}>
        <div className="container section">
          <div className="card act-bracket p-6 bg-red-50 border-red-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-medium">!</span>
              </div>
              <div>
                <h3 className="font-display font-medium text-red-800 tracking-act-tight">
                  Error Loading Partner Dashboard
                </h3>
                <p className="font-body text-red-600 text-sm tracking-act-tight leading-act-normal">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user is a partner
  if (userProfile?.user_type !== 'partner') {
    console.log('User is not a partner, redirecting to regular dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Use the Outlet component to render the nested routes for partners
  return (
    <DashboardLayout userProfile={userProfile}>
      <Outlet context={userProfile} />
    </DashboardLayout>
  );
};
