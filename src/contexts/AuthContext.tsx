/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { tracer } from '../utils/tracing';

interface UserProfile {
  id: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  profile_completed: boolean;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  organization_type: string | null;
  // Add other profile fields as needed
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to safely fetch user profile with fallback
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔄 AuthContext: Fetching user profile for:', userId);
      
      // Add timeout for profile fetch
      const profilePromise = supabase
        .from('user_profiles')
        .select('id, user_type, profile_completed, email, first_name, last_name, organization_name, organization_type')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });

      const { data: userProfile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]) as { data: UserProfile | null; error: Error | null };

      if (profileError) {
        console.error('❌ AuthContext: Profile error:', profileError);
        
        // If it's a timeout error, use fallback
        if (profileError.message === 'Profile fetch timeout') {
          console.warn('⏰ AuthContext: Profile fetch timed out, using fallback');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const fallbackProfile: UserProfile = {
              id: authUser.id,
              email: authUser.email || '',
              user_type: 'job_seeker', // Default to job_seeker
              profile_completed: false,
              first_name: null,
              last_name: null,
              organization_name: null,
              organization_type: null
            };
            console.log('✅ AuthContext: Using timeout fallback profile:', fallbackProfile);
            return fallbackProfile;
          }
        }
        
        // If it's a "no rows" error, the profile doesn't exist yet (this is normal for new users)
        if ('code' in profileError && profileError.code === 'PGRST116') {
          console.log('✅ AuthContext: No profile found - this is a NEW USER who needs onboarding');
          return null;
        }
        
        // If it's an RLS policy error, try to handle gracefully
        if (profileError.message.includes('infinite recursion') || profileError.message.includes('policy')) {
          console.warn('⚠️ AuthContext: RLS policy issue detected, using fallback approach');
          
          // Try to get user info from auth.users metadata as fallback
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            // Create a minimal profile from auth user data
            const fallbackProfile: UserProfile = {
              id: authUser.id,
              email: authUser.email || '',
              user_type: 'job_seeker', // Default to job_seeker
              profile_completed: false,
              first_name: null,
              last_name: null,
              organization_name: null,
              organization_type: null
            };
            
            console.log('✅ AuthContext: Using fallback profile:', fallbackProfile);
            return fallbackProfile;
          }
        }
        
        return null;
      }

      console.log('✅ AuthContext: Profile loaded:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('❌ AuthContext: Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Function to refresh the session and fetch user profile
  const refreshSession = useCallback(async () => {
    console.log('🔄 AuthContext: Starting session refresh...');
    tracer.auth('🔄 Starting session refresh');

    try {
      console.log('🔄 AuthContext: Calling supabase.auth.getSession()...');
      tracer.auth('🔄 Calling supabase.auth.getSession()');

      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session timeout')), 10000); // Increased to 10 seconds
      });

      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null }; error: Error | null };

      if (error) {
        console.error('❌ AuthContext: Session error:', error);
        // Don't throw error, just set to null and continue
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      console.log('✅ AuthContext: Session retrieved:', data.session ? 'User logged in' : 'No user');
      setSession(data.session);
      setUser(data.session?.user ?? null);

      // Fetch user profile if user exists
      if (data.session?.user) {
        const userProfile = await fetchUserProfile(data.session.user.id);
        setProfile(userProfile);
      } else {
        console.log('ℹ️ AuthContext: No user session, setting profile to null');
        setProfile(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing session:', error);
      if (error instanceof Error && (error.message.includes('timeout') || error.message === 'Session timeout')) {
        console.warn('⏰ Session call timed out - continuing without session');
      }
      // Set everything to null on error
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      console.log('✅ AuthContext: Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 AuthContext: useEffect triggered');
    console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔧 Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    let mounted = true;

    // Initialize auth state with timeout
    const initializeAuth = async () => {
      try {
        // Set a maximum time for initialization
        const initTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('⏰ Auth initialization timed out - setting loading to false');
            setLoading(false);
          }
        }, 10000); // 10 second max timeout

        // Get initial session
        await refreshSession();

        // Clear timeout if successful
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('❌ Initial session refresh failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'User logged in' : 'No user');

      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch user profile if user exists
        if (session?.user) {
          console.log('🔄 Fetching profile for user:', session.user.email);
          try {
            const userProfile = await fetchUserProfile(session.user.id);
            setProfile(userProfile);
          } catch (error) {
            console.error('❌ AuthContext: Error fetching profile in auth state change:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Refresh session after sign in
    await refreshSession();
  };

  const signUp = async (email: string, password: string) => {
    console.log('📧 Starting signup process...');
    console.log('📧 Signing up with redirect URL:', `${window.location.origin}/auth/callback`);

    try {
      console.log('📧 About to call supabase.auth.signUp...');

      // Simplified signup call
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log('📧 Supabase signup call completed');

      if (error) {
        console.error('Supabase signup error:', error);

        // If there's a 422 error, it might be due to the redirect URL
        if (error.status === 422) {
          console.warn('422 Error detected. This might be due to the redirect URL not being whitelisted in Supabase.');
          console.warn('Please add this URL to your Supabase project: Authentication > URL Configuration');
          console.warn(`URL to add: ${window.location.origin}/auth/callback`);
        }

        return {
          user: null,
          error: new Error(error.message)
        };
      }

      console.log('📧 Signup successful:', {
        user: data?.user?.email,
        emailConfirmed: data?.user?.email_confirmed_at,
        needsConfirmation: !data?.user?.email_confirmed_at
      });

      return {
        user: data?.user ?? null,
        error: null
      };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return {
        user: null,
        error: err instanceof Error ? err : new Error('Unknown error during signup')
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear session and profile after sign out
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    signIn,
    signUp,
    signOut,
    refreshSession,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

