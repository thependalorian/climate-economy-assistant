import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
// import { OnboardingRedirect } from './components/auth/OnboardingRedirect';
import { AuthCallback } from './components/auth/AuthCallback';
import { QuickAuthCheck } from './components/auth/QuickAuthCheck';
import { SimpleRedirect } from './components/auth/SimpleRedirect';
import { AuthRedirect } from './components/auth/AuthRedirect';
import { useAuth } from './hooks/useAuth';

// Development utilities - only loaded in development
if (import.meta.env.DEV) {
  import('./utils/devStartup');
}
import { tracer } from './utils/tracing';

// Main pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RegisterSuccessPage } from './pages/RegisterSuccessPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Dashboard system
import { DashboardPage } from './pages/DashboardPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { JobsPage } from './pages/dashboard/JobsPage';
import { TrainingPage } from './pages/dashboard/TrainingPage';
import { ResourcesPage } from './pages/dashboard/ResourcesPage';
import { ResumePage } from './pages/dashboard/ResumePage';
import { DashboardProfilePage } from './pages/dashboard/DashboardProfilePage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { HelpPage } from './pages/dashboard/HelpPage';
import SearchPage from './pages/search';

// Partner & Admin dashboards
import { PartnerDashboard } from './pages/PartnerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

// Onboarding step pages
import { /* PartnerStep1, */ PartnerStep2, PartnerStep3, PartnerStep4 } from './pages/onboarding/partner';
import { JobSeekerStep1, JobSeekerStep2, JobSeekerStep3, JobSeekerStep4, JobSeekerStep5 } from './pages/onboarding/job-seeker';

export function App() {
  const { user, loading } = useAuth();

  // Enhanced logging with tracing
  console.log('🚀 App: Rendering with loading:', loading, 'user:', user ? 'logged in' : 'not logged in');
  console.log('🚀 App: Current path:', window.location.pathname);

  tracer.navigation('App component rendering', {
    loading,
    userLoggedIn: !!user,
    userEmail: user?.email,
    currentPath: window.location.pathname,
    timestamp: new Date().toISOString()
  });

  // Add timeout for loading state to prevent infinite loading
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⏰ App: Loading timeout reached - this might indicate an auth issue');
        console.log('🔄 App: Current path:', window.location.pathname);

        // If we're on an onboarding page and still loading after 10 seconds, redirect to login
        if (window.location.pathname.includes('/onboarding/')) {
          console.log('🔄 App: Forcing redirect to login due to loading timeout');
          window.location.href = '/login';
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Climate Ecosystem Assistant...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
        {/* Auth callback route - outside of layout to avoid header/footer */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Partner Onboarding - Direct Step Pages */}
        <Route
          path="onboarding/partner/step1"
          element={<SimpleRedirect />}
        />
        <Route
          path="onboarding/partner/step2"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <PartnerStep2 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        <Route
          path="onboarding/partner/step3"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <PartnerStep3 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        <Route
          path="onboarding/partner/step4"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <PartnerStep4 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        {/* Job Seeker Onboarding - Direct Step Pages */}
        <Route
          path="onboarding/job-seeker/step1"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <JobSeekerStep1 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        <Route
          path="onboarding/job-seeker/step2"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <JobSeekerStep2 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        <Route
          path="onboarding/job-seeker/step3"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <JobSeekerStep3 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        <Route
          path="onboarding/job-seeker/step4"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <JobSeekerStep4 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />
        <Route
          path="onboarding/job-seeker/step5"
          element={
            <AuthRedirect>
              <ProtectedRoute isAuthenticated={!!user} allowWithoutProfile={true}>
                <JobSeekerStep5 />
              </ProtectedRoute>
            </AuthRedirect>
          }
        />

        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="register/success" element={<RegisterSuccessPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />

        {/* Job Seeker Dashboard routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute isAuthenticated={!!user} requiredRole="job_seeker">
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome userProfile={undefined} />} />
          <Route path="jobs" element={<JobsPage userProfile={undefined} />} />
          <Route path="training" element={<TrainingPage userProfile={undefined} />} />
          <Route path="resources" element={<ResourcesPage userProfile={undefined} />} />
          <Route path="resume" element={<ResumePage userProfile={undefined} />} />
          <Route path="profile" element={<DashboardProfilePage userProfile={undefined} />} />
          <Route path="settings" element={<SettingsPage userProfile={undefined} />} />
          <Route path="help" element={<HelpPage userProfile={undefined} />} />
          <Route path="search" element={<SearchPage />} />
        </Route>

        {/* Partner Dashboard routes */}
        <Route
          path="partner-dashboard/*"
          element={
            <ProtectedRoute isAuthenticated={!!user} requiredRole="partner">
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard routes */}
        <Route
          path="admin-dashboard/*"
          element={
            <ProtectedRoute isAuthenticated={!!user} requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />



        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;