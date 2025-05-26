import React, { useEffect } from 'react';

/**
 * A simple component that immediately redirects to login
 * This bypasses all authentication checks and complex logic
 */
export const SimpleRedirect: React.FC = () => {
  useEffect(() => {
    console.log('🔄 SimpleRedirect: Redirecting to login immediately');
    
    // Use window.location for immediate redirect
    window.location.href = '/login';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
};
