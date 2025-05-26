import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const UserStateDebug: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const testUserState = async () => {
    setTestResults('🔄 Testing user state...\n');

    try {
      // Test 1: Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setTestResults(prev => prev + `❌ Session error: ${sessionError.message}\n`);
      } else {
        setTestResults(prev => prev + `✅ Session: ${sessionData.session ? 'Active' : 'None'}\n`);
        if (sessionData.session) {
          setTestResults(prev => prev + `📧 Email: ${sessionData.session.user.email}\n`);
        }
      }

      // Test 2: Check profile
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setTestResults(prev => prev + `❌ Profile error: ${profileError.message}\n`);
          if (profileError.code === 'PGRST116') {
            setTestResults(prev => prev + `ℹ️ No profile found - user needs to complete onboarding\n`);
          }
        } else {
          setTestResults(prev => prev + `✅ Profile found:\n`);
          setTestResults(prev => prev + `   - User Type: ${profileData.user_type}\n`);
          setTestResults(prev => prev + `   - Profile Completed: ${profileData.profile_completed}\n`);
          setTestResults(prev => prev + `   - Onboarding Completed: ${profileData.onboarding_completed}\n`);
        }
      }

      setTestResults(prev => prev + `\n🎯 Recommendation:\n`);
      if (!user) {
        setTestResults(prev => prev + `   → User should be redirected to login\n`);
      } else if (!profile) {
        setTestResults(prev => prev + `   → User should be redirected to onboarding\n`);
      } else if (!profile.profile_completed) {
        setTestResults(prev => prev + `   → User should complete onboarding\n`);
      } else {
        setTestResults(prev => prev + `   → User should see dashboard\n`);
      }

    } catch (error) {
      setTestResults(prev => prev + `❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  };

  if (!showDebug) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          🔍 Debug User State
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">🔍 User State Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>User:</strong> {user ? user.email : 'None'}
        </div>
        <div>
          <strong>Profile:</strong> {profile ? `${profile.user_type} (${profile.onboarding_completed ? 'Complete' : 'Incomplete'})` : 'None'}
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={testUserState}
          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 w-full"
        >
          🧪 Run Full Test
        </button>
      </div>

      {testResults && (
        <div className="mt-3 bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {testResults}
        </div>
      )}
    </div>
  );
};
