import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Users, Building2, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormData } from '../lib/validations';
import { createUserProfile, createJobSeekerProfile, createPartnerProfile, getUserProfile } from '../lib/profileService';
import { supabase } from '../lib/supabase';

type UserType = 'job_seeker' | 'partner' | 'admin';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!selectedUserType) {
      setError('Please select a login type');
      return;
    }

    try {
      setError(null);

      // For admin login, check if email domain is joinact.org
      if (selectedUserType === 'admin' && !data.email.endsWith('@joinact.org')) {
        setError('Admin login is restricted to @joinact.org email addresses');
        return;
      }

      console.log('🔄 LoginPage: Attempting login for:', data.email, 'as:', selectedUserType);

      // Store the selected user type for potential profile creation
      localStorage.setItem('pendingUserType', selectedUserType);

      // Sign in with Supabase
      await signIn(data.email, data.password);

      console.log('✅ LoginPage: Login successful');

      // Get user session to check profile
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found after login');
      }

      console.log('🔍 LoginPage: Checking user profile...');

      // Try to get existing profile
      const existingProfile = await getUserProfile(user.id);

      if (!existingProfile) {
        console.log('🔄 LoginPage: No profile found, creating one...');
        
        // Create user profile
        const profileResult = await createUserProfile({
          id: user.id,
          email: user.email || '',
          user_type: selectedUserType,
        });

        if (!profileResult.success) {
          console.warn('⚠️ LoginPage: Profile creation failed:', profileResult.error);
          // Continue anyway, user can still access the app
        }

        // Create specific profile based on user type
        if (selectedUserType === 'job_seeker') {
          const jobSeekerResult = await createJobSeekerProfile(user.id);
          if (!jobSeekerResult.success) {
            console.warn('⚠️ LoginPage: Job seeker profile creation failed:', jobSeekerResult.error);
          }
        } else if (selectedUserType === 'partner') {
          const partnerResult = await createPartnerProfile(user.id, '', 'employer');
          if (!partnerResult.success) {
            console.warn('⚠️ LoginPage: Partner profile creation failed:', partnerResult.error);
          }
        }
      }

      // Determine redirect destination
      let redirectPath = '/dashboard'; // Default

      if (selectedUserType === 'admin') {
        redirectPath = '/admin-dashboard';
      } else if (selectedUserType === 'partner') {
        const profileCompleted = existingProfile?.data?.profile_completed || false;
        if (!profileCompleted) {
          redirectPath = '/onboarding/partner/step1';
        } else {
          redirectPath = '/partner-dashboard';
        }
      } else if (selectedUserType === 'job_seeker') {
        const profileCompleted = existingProfile?.data?.profile_completed || false;
        if (!profileCompleted) {
          redirectPath = '/onboarding/job-seeker/step1';
        } else {
          redirectPath = '/dashboard';
        }
      }

      console.log('🔄 LoginPage: Redirecting to:', redirectPath);
      navigate(redirectPath);

    } catch (error) {
      console.error('❌ LoginPage: Login error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Invalid email or password');
      }
    }
  };

  return (
    <div className="container section-lg">
      <div className="mx-auto max-w-md">
        <div className="mb-8 act-fade-in">
          <Link to="/" className="inline-flex items-center font-body text-sm font-medium text-midnight-forest-600 hover:text-spring-green tracking-act-tight transition-colors duration-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="card act-bracket bg-white p-8 act-fade-in">
          <div className="mb-8 text-center">
            <h1 className="font-display font-medium text-3xl text-midnight-forest tracking-act-tight leading-act-tight">
              Welcome back
            </h1>
            <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
              Sign in to your Climate Ecosystem account
            </p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block font-body text-sm font-medium text-midnight-forest-700 mb-3 tracking-act-tight">
              I am signing in as:
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setSelectedUserType('job_seeker')}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  selectedUserType === 'job_seeker'
                    ? 'border-spring-green bg-spring-green/5'
                    : 'border-sand-gray-200 hover:border-spring-green/50'
                }`}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-spring-green mr-3" />
                  <div>
                    <div className="font-body font-medium text-midnight-forest tracking-act-tight">Job Seeker</div>
                    <div className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Looking for climate career opportunities</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserType('partner')}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  selectedUserType === 'partner'
                    ? 'border-spring-green bg-spring-green/5'
                    : 'border-sand-gray-200 hover:border-spring-green/50'
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-spring-green mr-3" />
                  <div>
                    <div className="font-body font-medium text-midnight-forest tracking-act-tight">Partner Organization</div>
                    <div className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Hiring or providing training programs</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserType('admin')}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  selectedUserType === 'admin'
                    ? 'border-spring-green bg-spring-green/5'
                    : 'border-sand-gray-200 hover:border-spring-green/50'
                }`}
              >
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-spring-green mr-3" />
                  <div>
                    <div className="font-body font-medium text-midnight-forest tracking-act-tight">Administrator</div>
                    <div className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Platform administration (@joinact.org)</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block font-body text-sm font-medium text-midnight-forest-700 mb-2 tracking-act-tight">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-sand-gray-200 rounded-lg focus:ring-2 focus:ring-spring-green focus:border-transparent font-body tracking-act-tight transition-colors duration-200"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-body tracking-act-tight">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block font-body text-sm font-medium text-midnight-forest-700 mb-2 tracking-act-tight">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-sand-gray-200 rounded-lg focus:ring-2 focus:ring-spring-green focus:border-transparent font-body tracking-act-tight transition-colors duration-200"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 font-body tracking-act-tight">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('remember')}
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-spring-green focus:ring-spring-green border-sand-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block font-body text-sm text-midnight-forest-600 tracking-act-tight">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-body font-medium text-spring-green hover:text-moss-green tracking-act-tight transition-colors duration-200">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedUserType}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-sm text-midnight-forest-600 tracking-act-tight">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-spring-green hover:text-moss-green tracking-act-tight transition-colors duration-200">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};