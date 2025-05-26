import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-sand-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card act-bracket p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight leading-act-tight mb-4">
            Access Denied
          </h1>
          
          <p className="font-body text-midnight-forest-600 tracking-act-tight leading-act-normal mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/"
              className="btn-primary w-full inline-flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="btn-outline w-full inline-flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
