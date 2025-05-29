import React, { useEffect } from 'react';

interface SimpleRedirectProps {
  to?: string;
  delay?: number;
  useReplace?: boolean;
  message?: string;
}

/**
 * SimpleRedirect Component
 * 
 * A utility component for immediate redirects with clean UX.
 * Ideal for fail-fast redirects, logout flows, or unauthorized access.
 * 
 * Features:
 * - Dynamic redirect paths via props
 * - SSR safety
 * - Optional delay before redirect
 * - History management (replace vs push)
 * - Loading feedback with spinner
 * 
 * Located in /components/auth/ for authentication flow components
 */
export const SimpleRedirect: React.FC<SimpleRedirectProps> = ({ 
  to = '/login',
  delay = 0,
  useReplace = false,
  message = 'Redirecting...'
}) => {
  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      console.warn('⚠️ SimpleRedirect: Cannot redirect in SSR context');
      return;
    }

    console.log(`🔄 SimpleRedirect: Redirecting to ${to} ${delay > 0 ? `after ${delay}ms` : 'immediately'}`);
    
    const performRedirect = () => {
      if (useReplace) {
        window.location.replace(to);
      } else {
        window.location.href = to;
      }
    };

    if (delay > 0) {
      const timeout = setTimeout(performRedirect, delay);
      return () => clearTimeout(timeout);
    } else {
      performRedirect();
    }
  }, [to, delay, useReplace]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
        {delay > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Redirecting in {Math.ceil(delay / 1000)} second{delay !== 1000 ? 's' : ''}...
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Pre-configured redirect components for common use cases
 */

// Immediate login redirect (current behavior)
export const RedirectToLogin: React.FC = () => (
  <SimpleRedirect to="/login" message="Redirecting to login..." />
);

// Logout redirect with message
export const LogoutRedirect: React.FC = () => (
  <SimpleRedirect 
    to="/login" 
    useReplace={true} 
    message="Logging you out..." 
  />
);

// Unauthorized access redirect with delay
export const UnauthorizedRedirect: React.FC = () => (
  <SimpleRedirect 
    to="/login" 
    delay={2000}
    useReplace={true}
    message="Access denied. You will be redirected to login." 
  />
);

// Dashboard redirect for successful auth
export const DashboardRedirect: React.FC = () => (
  <SimpleRedirect 
    to="/dashboard" 
    message="Taking you to your dashboard..." 
  />
);

/**
 * Usage Examples:
 * 
 * // Basic redirect to login
 * <SimpleRedirect />
 * 
 * // Custom path with delay
 * <SimpleRedirect to="/dashboard" delay={1500} message="Welcome back!" />
 * 
 * // Logout flow (replace history)
 * <SimpleRedirect to="/login" useReplace={true} message="Signing you out..." />
 * 
 * // Using pre-configured components
 * <LogoutRedirect />
 * <UnauthorizedRedirect />
 */
