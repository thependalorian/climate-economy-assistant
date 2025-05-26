import React, { useState } from 'react';

interface AuthBypassProps {
  onBypass: (userType: 'job_seeker' | 'partner' | 'admin') => void;
}

export const AuthBypass: React.FC<AuthBypassProps> = ({ onBypass }) => {
  const [showBypass, setShowBypass] = useState(false);

  if (!showBypass) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowBypass(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
        >
          🔧 Debug Bypass
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">🔧 Auth Debug Bypass</h3>
        <p className="text-sm text-gray-600 mb-4">
          This bypasses authentication for testing dashboard layouts.
        </p>
        
        <div className="space-y-2">
          <button
            onClick={() => onBypass('job_seeker')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            👤 Test as Job Seeker
          </button>
          
          <button
            onClick={() => onBypass('partner')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            🏢 Test as Partner
          </button>
          
          <button
            onClick={() => onBypass('admin')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
          >
            👑 Test as Admin
          </button>
        </div>
        
        <button
          onClick={() => setShowBypass(false)}
          className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
