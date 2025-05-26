import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Users, Building2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import { registerSchema, type RegisterFormData } from '../lib/validations';


export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
      userType: undefined, // Explicitly set to undefined to force selection
    },
  });

  const userType = watch('userType');

  // Check URL parameters for partner type
  const handleUserTypeSelect = useCallback((type: 'job_seeker' | 'partner') => {
    console.log('🎯 User type selected:', type);
    setValue('userType', type, { shouldValidate: true });

    // Also store in localStorage immediately when selected
    localStorage.setItem('pendingUserType', type);
    console.log('✅ Stored user type in localStorage on selection:', type);
  }, [setValue]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    console.log('🔍 URL parameter type:', type);

    if (type === 'partner') {
      console.log('🎯 Setting user type to partner from URL');
      handleUserTypeSelect('partner');
    } else if (type === 'job_seeker') {
      console.log('🎯 Setting user type to job_seeker from URL');
      handleUserTypeSelect('job_seeker');
    } else {
      console.log('ℹ️ No user type in URL, user must select manually');
    }
  }, [location, handleUserTypeSelect]);

  // Helper function to store user data for onboarding
  const storeUserDataForOnboarding = (data: RegisterFormData) => {
    console.log('📝 Storing user data for onboarding:', data.userType);

    // Store all the registration data for onboarding to use
    localStorage.setItem('pendingConfirmationEmail', data.email);
    localStorage.setItem('pendingUserType', data.userType);
    localStorage.setItem('pendingFirstName', data.firstName);
    localStorage.setItem('pendingLastName', data.lastName);

    if (data.organization) {
      localStorage.setItem('pendingOrganization', data.organization);
    }

    console.log('✅ User data stored for onboarding process');
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      console.log('🔄 Starting registration process...');

      // Store user data for onboarding
      storeUserDataForOnboarding(data);

      // Use standard Supabase signup with email confirmation
      const { user, error: signUpError } = await signUp(data.email, data.password);

      if (signUpError) {
        console.error('Signup error:', signUpError);

        if (signUpError.message.includes('already registered')) {
          // Store the user type preference even for existing users
          localStorage.setItem('pendingUserType', data.userType);
          console.log('✅ Stored user type for existing user:', data.userType);

          setError(`An account with this email already exists. Please sign in instead. (User type: ${data.userType} has been saved for when you log in)`);

          // Redirect to login with the user type preserved
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }
        throw signUpError;
      }

      // Store email for confirmation page
      localStorage.setItem('pendingConfirmationEmail', data.email);

      // Check if email confirmation is required
      if (!user?.email_confirmed_at) {
        console.log('📧 Email confirmation required - redirecting to success page');
        console.log('📧 User email confirmed at:', user?.email_confirmed_at);
        // User needs to confirm their email - onboarding will happen after confirmation
        navigate('/register/success');
        return;
      }

      // If email is already confirmed (shouldn't happen in normal flow), redirect to onboarding
      console.log('✅ Email already confirmed - redirecting to onboarding');
      if (data.userType === 'partner') {
        navigate('/onboarding/partner/step1');
      } else {
        navigate('/onboarding/job-seeker/step1');
      }
    } catch (err) {
      if (err instanceof Error) {
        // Handle specific Supabase errors
        if (err.message.includes('Email rate limit exceeded')) {
          setError('Too many email requests. Please try again later.');
        } else if (err.message.includes('Email link is invalid or has expired')) {
          setError('The confirmation link is invalid or has expired. Please request a new one.');
        } else if (err.message.includes('Email not confirmed')) {
          // Store the email and user type, then redirect to success page
          localStorage.setItem('pendingConfirmationEmail', data.email);
          localStorage.setItem('pendingUserType', data.userType);
          navigate('/register/success');
          return;
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during registration');
      }
    }
  };

  return (
    <div className="container mx-auto py-12 md:py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-primary-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Create an Account</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Join the Climate Ecosystem and connect with clean energy opportunities
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600">
                {error}
                {error.includes('Please sign in') && (
                  <div className="mt-2">
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                      Go to login page →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleUserTypeSelect('job_seeker')}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 text-center transition-all",
                    userType === 'job_seeker'
                      ? "border-primary-600 bg-primary-50 ring-2 ring-primary-600/20"
                      : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/50"
                  )}
                >
                  <Users className="mb-2 h-8 w-8 text-primary-600" />
                  <span className="text-sm font-medium text-neutral-900">Job Seeker</span>
                  <span className="mt-1 text-xs text-neutral-500">Looking for opportunities</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUserTypeSelect('partner')}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 text-center transition-all",
                    userType === 'partner'
                      ? "border-primary-600 bg-primary-50 ring-2 ring-primary-600/20"
                      : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/50"
                  )}
                >
                  <Building2 className="mb-2 h-8 w-8 text-primary-600" />
                  <span className="text-sm font-medium text-neutral-900">Partner</span>
                  <span className="mt-1 text-xs text-neutral-500">Employer or organization</span>
                </button>
              </div>
              {errors.userType && (
                <p className="mt-1 text-sm text-error-600">{errors.userType.message}</p>
              )}
            </div>

            {userType === 'partner' && (
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-neutral-700">
                  Organization name
                </label>
                <input
                  {...register('organization')}
                  type="text"
                  className={`mt-1 input ${errors.organization ? 'border-error-600 focus:border-error-600 focus:ring-error-600/20' : ''}`}
                  placeholder="Your organization"
                />
                {errors.organization && (
                  <p className="mt-1 text-sm text-error-600">{errors.organization.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700">
                  First name
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  className={`mt-1 input ${errors.firstName ? 'border-error-600 focus:border-error-600 focus:ring-error-600/20' : ''}`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className={`mt-1 input ${errors.lastName ? 'border-error-600 focus:border-error-600 focus:ring-error-600/20' : ''}`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`mt-1 input ${errors.email ? 'border-error-600 focus:border-error-600 focus:ring-error-600/20' : ''}`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className={`mt-1 input ${errors.password ? 'border-error-600 focus:border-error-600 focus:ring-error-600/20' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  {...register('terms')}
                  type="checkbox"
                  className={`h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 ${
                    errors.terms ? 'border-error-600' : ''
                  }`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-neutral-600">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-error-600">{errors.terms.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};