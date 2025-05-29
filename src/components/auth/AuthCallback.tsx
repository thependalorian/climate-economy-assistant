import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { RefreshCw } from 'lucide-react';
import { createUserProfile, createJobSeekerProfile, createPartnerProfile } from '../../lib/profileService';
import { logSecurityEvent } from '../../lib/security/userSecurity';
import { sendWelcomeEmail } from '../../lib/email/emailService';
import { UserType } from '../../types/auth';

/**
 * AuthCallback Component
 * 
 * Production-ready authentication callback handler with:
 * - Robust error handling and recovery
 * - Race condition protection for RLS
 * - Type-safe localStorage access
 * - Enhanced logging and monitoring
 * - Automatic profile creation and onboarding flow
 * 
 * Located in /components/auth/ for authentication flow components
 */
export const AuthCallback = () => {
  const router = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { refreshSession } = useAuth();

  // Helper function for exponential backoff retry
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Get stored user type with type safety
  const getStoredUserType = (): UserType => {
    const stored = localStorage.getItem('pendingUserType');
    if (stored && Object.values(UserType).includes(stored as UserType)) {
      return stored as UserType;
    }
    return UserType.JobSeeker; // Default fallback
  };

  // Enhanced profile fetch with race condition protection
  const fetchUserProfile = useCallback(async (userId: string) => {
    // Retry logic for profile operations with exponential backoff
    const retryOperation = async <T,>(
      operation: () => Promise<T>,
      maxRetries: number = 3,
      baseDelay: number = 1000
    ): Promise<T> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          if (attempt === maxRetries) throw error;
          
          const delayMs = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`🔄 AuthCallback: Retry attempt ${attempt}/${maxRetries} in ${delayMs}ms`);
          await delay(delayMs);
        }
      }
      throw new Error('Max retries exceeded');
    };

    return retryOperation(async () => {
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type, profile_completed, first_name')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() to avoid PGRST116 errors

      if (profileError) {
        console.error('❌ AuthCallback: Profile fetch error:', profileError.message || profileError);
        throw profileError;
      }

      return existingProfile;
    }, 3, 1000);
  }, []); // Empty dependencies since retryOperation is now defined inside

  useEffect(() => {
    const handleAuthCallback = async () => {
      const startTime = Date.now();
      let userId: string | undefined;
      
      try {
        setIsProcessing(true);
        console.log('🔄 AuthCallback: Processing authentication callback...');
        console.log('🔄 AuthCallback: URL:', window.location.href);
        console.log('🔄 AuthCallback: Retry count:', retryCount);

        // Get the URL query parameters
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        const errorParam = query.get('error');
        const errorDescription = query.get('error_description');

        // Check for errors in URL
        if (errorParam || errorDescription) {
          const errorMsg = errorDescription || errorParam || 'Authentication failed';
          console.error('❌ AuthCallback: URL contains error:', errorParam, errorDescription);
          throw new Error(errorMsg);
        }

        // If we have a code, exchange it for a session
        if (code) {
          console.log('🔄 AuthCallback: Exchanging code for session...');
          
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('❌ AuthCallback: Exchange error:', exchangeError.message || exchangeError);
              // Don't throw here, continue to check session as it might still be valid
              console.log('🔄 AuthCallback: Continuing despite exchange error...');
            } else {
              console.log('✅ AuthCallback: Code exchange successful');
            }
          } catch (exchangeErr) {
            console.error('❌ AuthCallback: Exchange failed:', exchangeErr);
            // Continue anyway, session might still be valid
          }
        }

        // Refresh the auth context and get session
        console.log('🔄 AuthCallback: Refreshing session...');
        await refreshSession();

        // Double-check session for robustness (recommended for callback flows)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ AuthCallback: Session error:', sessionError.message || sessionError);
          throw new Error('Failed to get session: ' + sessionError.message);
        }

        if (!sessionData?.session?.user) {
          console.error('❌ AuthCallback: No user session found');
          throw new Error('No active session found. Please try logging in again.');
        }

        const user = sessionData.session.user;
        userId = user.id;

        // Enhanced email validation with warning
        if (!user.email) {
          console.warn('⚠️ AuthCallback: User email is missing - this may cause issues');
        }

        console.log('✅ AuthCallback: User authenticated:', user.email || 'no-email');

        // Type-safe localStorage access
        const storedUserType = getStoredUserType();
        const storedFirstName = localStorage.getItem('pendingFirstName');
        const storedLastName = localStorage.getItem('pendingLastName');
        const storedOrganization = localStorage.getItem('pendingOrganization');

        console.log('🔍 AuthCallback: Stored user type:', storedUserType);
        console.log('🔍 AuthCallback: Stored user data:', {
          firstName: storedFirstName || 'none',
          lastName: storedLastName || 'none',
          organization: storedOrganization || 'none'
        });

        // Try to get existing profile with enhanced error handling
        let existingProfile;
        try {
          existingProfile = await fetchUserProfile(user.id);
          console.log('✅ AuthCallback: Profile fetch completed:', existingProfile ? 'found' : 'not found');
        } catch (profileError) {
          console.warn('⚠️ AuthCallback: Profile fetch failed after retries, proceeding with creation:', profileError);
          existingProfile = null;
        }

        let userType = storedUserType;
        let profileCompleted = false;
        let firstName = storedFirstName;

        if (existingProfile) {
          console.log('✅ AuthCallback: Existing profile found:', existingProfile);
          userType = existingProfile.user_type as UserType;
          profileCompleted = existingProfile.profile_completed;
          firstName = existingProfile.first_name || firstName;
        } else {
          console.log('🔄 AuthCallback: Creating new profile...');
          
          // Create user profile with enhanced error handling
          const profileResult = await createUserProfile({
            id: user.id,
            email: user.email || '',
            user_type: userType,
            first_name: storedFirstName || undefined,
            last_name: storedLastName || undefined,
            organization_name: storedOrganization || undefined,
            organization_type: userType === UserType.Partner ? 'employer' : undefined
          });

          if (!profileResult.success) {
            console.warn('⚠️ AuthCallback: Profile creation failed:', profileResult.error);
            // Continue anyway, onboarding can handle this
          } else {
            console.log('✅ AuthCallback: User profile created successfully');
          }

          // Create specific profile based on user type
          if (userType === UserType.JobSeeker) {
            const jobSeekerResult = await createJobSeekerProfile(user.id);
            if (!jobSeekerResult.success) {
              console.warn('⚠️ AuthCallback: Job seeker profile creation failed:', jobSeekerResult.error);
            } else {
              console.log('✅ AuthCallback: Job seeker profile created');
            }
          } else if (userType === UserType.Partner) {
            const partnerResult = await createPartnerProfile(
              user.id, 
              storedOrganization || '', 
              'employer'
            );
            if (!partnerResult.success) {
              console.warn('⚠️ AuthCallback: Partner profile creation failed:', partnerResult.error);
            } else {
              console.log('✅ AuthCallback: Partner profile created');
            }
          }

          // Send welcome email for new users
          if (user.email && firstName) {
            try {
              const welcomeResult = await sendWelcomeEmail(
                user.email,
                firstName,
                userType === UserType.Partner ? 'partner' : 'job_seeker'
              );
              if (welcomeResult.success) {
                console.log('✅ AuthCallback: Welcome email sent');
              } else {
                console.warn('⚠️ AuthCallback: Welcome email failed:', welcomeResult.error);
              }
            } catch (emailError) {
              console.warn('⚠️ AuthCallback: Welcome email error:', emailError);
            }
          }
        }

        // Log successful authentication event
        try {
          const ipAddress = '127.0.0.1'; // In production, get real IP
          const userAgent = navigator.userAgent;
          
          await logSecurityEvent(
            user.id,
            'login_success',
            ipAddress,
            userAgent,
            { 
              action: 'oauth_callback', 
              provider: 'supabase',
              userType,
              isNewUser: !existingProfile,
              processingTime: Date.now() - startTime
            },
            'low'
          );
        } catch (logError) {
          console.warn('⚠️ AuthCallback: Security event logging failed:', logError);
        }

        // Clean up localStorage
        const keysToRemove = [
          'pendingConfirmationEmail',
          'pendingUserType', 
          'pendingFirstName',
          'pendingLastName',
          'pendingOrganization'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🔄 AuthCallback: Cleaned up localStorage');

        // Type-safe redirect logic
        const getRedirectPath = (type: UserType, completed: boolean): string => {
          if (type === UserType.Admin) {
            return '/admin-dashboard';
          } else if (type === UserType.Partner) {
            return completed ? '/partner-dashboard' : '/onboarding/partner/step1';
          } else if (type === UserType.JobSeeker) {
            return completed ? '/dashboard' : '/onboarding/job-seeker/step1';
          }
          return '/dashboard'; // Default fallback
        };

        const redirectPath = getRedirectPath(userType, profileCompleted);

        console.log('🔄 AuthCallback: Authentication flow completed successfully', {
          userId: user.id,
          email: user.email || 'no-email',
          userType,
          profileCompleted,
          redirectPath,
          processingTime: `${Date.now() - startTime}ms`
        });

        console.log('🔄 AuthCallback: Redirecting to:', redirectPath);
        router(redirectPath, { replace: true });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        console.error('❌ AuthCallback: Error processing callback:', errorMessage);
        
        // Log failed authentication event if we have userId
        if (userId) {
          try {
            await logSecurityEvent(
              userId,
              'login_failed',
              '127.0.0.1',
              navigator.userAgent,
              { 
                action: 'oauth_callback_failed',
                error: errorMessage,
                retryCount,
                processingTime: Date.now() - startTime
              },
              'medium'
            );
          } catch (logError) {
            console.warn('⚠️ AuthCallback: Failed to log security event:', logError);
          }
        }

        // Enhanced error reporting for monitoring
        if (typeof window !== 'undefined') {
          const windowWithSentry = window as Window & { Sentry?: { captureException: (err: unknown, options?: unknown) => void } };
          if (windowWithSentry.Sentry) {
            windowWithSentry.Sentry.captureException(err, {
              tags: {
                component: 'AuthCallback',
                retryCount
              },
              extra: {
                url: window.location.href,
                processingTime: Date.now() - startTime
              }
            });
          }
        }

        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    // Add a small delay on retries to prevent rapid fire
    const executeCallback = async () => {
      if (retryCount > 0) {
        await delay(1000 * retryCount); // Progressive delay
      }
      await handleAuthCallback();
    };

    executeCallback();
  }, [router, refreshSession, retryCount, location.search, fetchUserProfile]);

  const handleRetry = () => {
    setError(null);
    setIsProcessing(true);
    setRetryCount(prev => prev + 1);
    
    // For excessive retries, reload the page
    if (retryCount >= 2) {
      console.log('🔄 AuthCallback: Max retries reached, reloading page');
      window.location.reload();
    }
  };

  const handleBackToLogin = () => {
    // Clean up any pending localStorage data
    localStorage.removeItem('pendingConfirmationEmail');
    localStorage.removeItem('pendingUserType');
    localStorage.removeItem('pendingFirstName');
    localStorage.removeItem('pendingLastName');
    localStorage.removeItem('pendingOrganization');
    
    router('/login', { replace: true });
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
            {retryCount > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Retry attempt: {retryCount}/3
              </p>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="w-full btn-outline flex items-center justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryCount >= 2 ? 'Reload Page' : 'Try Again'}
            </button>

            <div className="text-center">
              <button
                onClick={handleBackToLogin}
                className="font-body text-sm font-medium text-spring-green hover:text-moss-green tracking-act-tight transition-colors duration-200"
              >
                Return to Login
              </button>
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
        {retryCount > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Processing retry {retryCount}...
          </p>
        )}
      </div>
    </div>
  );
};
