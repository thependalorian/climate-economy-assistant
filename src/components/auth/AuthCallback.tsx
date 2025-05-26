import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { RefreshCw } from 'lucide-react';
import { createUserProfile, createJobSeekerProfile, createPartnerProfile } from '../../lib/profileService';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        console.log('🔄 AuthCallback: Processing authentication callback...');
        console.log('🔄 AuthCallback: URL:', window.location.href);

        // Get the URL query parameters
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        const errorParam = query.get('error');
        const errorDescription = query.get('error_description');

        // Check for errors in URL
        if (errorParam || errorDescription) {
          console.error('❌ AuthCallback: Error in URL:', errorParam, errorDescription);
          throw new Error(errorDescription || errorParam || 'Authentication failed');
        }

        // If we have a code, exchange it for a session
        if (code) {
          console.log('🔄 AuthCallback: Exchanging code for session...');
          
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('❌ AuthCallback: Exchange error:', exchangeError);
              // Don't throw here, continue to check session
              console.log('🔄 AuthCallback: Continuing despite exchange error...');
            } else {
              console.log('✅ AuthCallback: Code exchange successful');
            }
          } catch (exchangeErr) {
            console.error('❌ AuthCallback: Exchange failed:', exchangeErr);
            // Continue anyway, session might still be valid
          }
        }

        // Refresh the auth context
        await refreshSession();

        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ AuthCallback: Session error:', sessionError);
          throw new Error('Failed to get session');
        }

        if (!sessionData?.session?.user) {
          console.error('❌ AuthCallback: No user session found');
          throw new Error('No active session found. Please try logging in again.');
        }

        const user = sessionData.session.user;
        console.log('✅ AuthCallback: User authenticated:', user.email);

        // Get stored user type from localStorage
        const storedUserType = localStorage.getItem('pendingUserType') || 'job_seeker';
        const storedFirstName = localStorage.getItem('pendingFirstName');
        const storedLastName = localStorage.getItem('pendingLastName');
        const storedOrganization = localStorage.getItem('pendingOrganization');

        console.log('🔍 AuthCallback: Stored user type:', storedUserType);

        // Try to get existing profile
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_type, profile_completed')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // If it's not a "no rows" error, it might be an RLS issue
          console.warn('⚠️ AuthCallback: Profile fetch error (might be RLS):', profileError);
          
          // Continue with profile creation anyway
          console.log('🔄 AuthCallback: Proceeding with profile creation...');
        }

        let userType = storedUserType as 'job_seeker' | 'partner' | 'admin';
        let profileCompleted = false;

        if (existingProfile) {
          console.log('✅ AuthCallback: Existing profile found:', existingProfile);
          userType = existingProfile.user_type;
          profileCompleted = existingProfile.profile_completed;
        } else {
          console.log('🔄 AuthCallback: Creating new profile...');
          
          // Create user profile
          const profileResult = await createUserProfile({
            id: user.id,
            email: user.email || '',
            user_type: userType,
            first_name: storedFirstName || undefined,
            last_name: storedLastName || undefined,
            organization_name: storedOrganization || undefined,
            organization_type: userType === 'partner' ? 'employer' : undefined
          });

          if (!profileResult.success) {
            console.warn('⚠️ AuthCallback: Profile creation failed:', profileResult.error);
            // Continue anyway, onboarding can handle this
          }

          // Create specific profile based on user type
          if (userType === 'job_seeker') {
            const jobSeekerResult = await createJobSeekerProfile(user.id);
            if (!jobSeekerResult.success) {
              console.warn('⚠️ AuthCallback: Job seeker profile creation failed:', jobSeekerResult.error);
            }
          } else if (userType === 'partner') {
            const partnerResult = await createPartnerProfile(
              user.id, 
              storedOrganization || '', 
              'employer'
            );
            if (!partnerResult.success) {
              console.warn('⚠️ AuthCallback: Partner profile creation failed:', partnerResult.error);
            }
          }
        }

        // Clean up localStorage
        localStorage.removeItem('pendingConfirmationEmail');
        localStorage.removeItem('pendingUserType');
        localStorage.removeItem('pendingFirstName');
        localStorage.removeItem('pendingLastName');
        localStorage.removeItem('pendingOrganization');

        // Determine redirect destination
        let redirectPath = '/dashboard'; // Default

        if (userType === 'admin') {
          redirectPath = '/admin-dashboard';
        } else if (userType === 'partner') {
          if (!profileCompleted) {
            redirectPath = '/onboarding/partner/step1';
          } else {
            redirectPath = '/partner-dashboard';
          }
        } else if (userType === 'job_seeker') {
          if (!profileCompleted) {
            redirectPath = '/onboarding/job-seeker/step1';
          } else {
            redirectPath = '/dashboard';
          }
        }

        console.log('🔄 AuthCallback: Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });

      } catch (err) {
        console.error('❌ AuthCallback: Error processing callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location, refreshSession]);

  const handleRetry = () => {
    setError(null);
    setIsProcessing(true);
    // Reload the page to retry
    window.location.reload();
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-gray-50">
        <div className="max-w-md card act-bracket bg-white p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 font-medium text-xl">!</span>
            </div>
            <h2 className="font-display font-medium text-xl text-red-600 tracking-act-tight leading-act-tight">
              Authentication Error
            </h2>
            <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
              {error}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full btn-outline flex items-center justify-center py-3"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </button>

            <div className="text-center">
              <Link to="/login" className="font-body text-sm font-medium text-spring-green hover:text-moss-green tracking-act-tight transition-colors duration-200">
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-spring-green border-r-transparent mb-6"></div>
        <h2 className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight leading-act-tight">
          {isProcessing ? 'Completing authentication...' : 'Redirecting...'}
        </h2>
        <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  );
};
