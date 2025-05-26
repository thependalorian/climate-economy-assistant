import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const CreateProfile: React.FC = () => {
  const { user, profile, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const createProfile = async (userType: 'job_seeker' | 'partner' | 'admin') => {
    if (!user) {
      setMessage('❌ No user logged in');
      return;
    }

    setLoading(true);
    setMessage('🔄 Creating profile...');

    try {
      // Create user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          user_type: userType,
          profile_completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        setMessage(`❌ Error: ${error.message}`);
      } else {
        console.log('Profile created:', data);
        setMessage(`✅ Profile created as ${userType}!`);

        // Refresh the auth context to pick up the new profile
        await refreshSession();

        // Hide form after success
        setTimeout(() => setShowForm(false), 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage(`❌ Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user already has a profile
  if (profile) {
    return null;
  }

  // Don't show if no user
  if (!user) {
    return null;
  }

  if (!showForm) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700"
        >
          🔧 Create Missing Profile
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">🔧 Create User Profile</h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>User:</strong> {user.email}<br/>
            <strong>Issue:</strong> No profile found in database<br/>
            <strong>Solution:</strong> Create profile with correct user type
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => createProfile('partner')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            🏢 Create as Partner
          </button>

          <button
            onClick={() => createProfile('job_seeker')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            👤 Create as Job Seeker
          </button>

          <button
            onClick={() => createProfile('admin')}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            👑 Create as Admin
          </button>
        </div>

        <button
          onClick={() => setShowForm(false)}
          disabled={loading}
          className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
