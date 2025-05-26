import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ChatInterface from '../../components/dashboard/ChatInterface';
import SkillsOverview from '../../components/dashboard/SkillsOverview';
import RecommendationPanel from '../../components/dashboard/RecommendationPanel';
import { ArrowRight } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface UserProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  profile_completed?: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch user profile and active conversation on load
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch active conversation
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!convError && convData?.length > 0) {
          setActiveConversation(convData[0]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [user]);

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: user.id,
            title: 'New Conversation'
          }
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setActiveConversation(data[0]);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              Welcome back, {profile?.first_name || 'there'}!
            </h1>
            <p className="mt-1 text-neutral-600">
              Continue your journey to a clean energy career.
            </p>
          </div>

          {/* Chat interface */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 bg-primary-50 border-b border-primary-100">
              <h2 className="text-lg font-medium text-neutral-900">
                Climate Ecosystem Assistant
              </h2>
              <p className="text-sm text-neutral-600">
                Ask questions, explore careers, and get personalized guidance.
              </p>
            </div>

            <div className="h-96">
              {activeConversation ? (
                <ChatInterface
                  conversationId={activeConversation.id}
                  userId={user?.id || ''}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <p className="text-neutral-500 text-center mb-4">
                    Start a conversation with the Climate Ecosystem Assistant to explore clean energy careers.
                  </p>
                  <button
                    onClick={startNewConversation}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Start Conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Skills overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-neutral-900">
                Your Skills Profile
              </h2>
              <button
                onClick={() => navigate('/profile/skills')}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Edit Skills
              </button>
            </div>

            <SkillsOverview userId={user?.id || ''} />
          </div>
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* Recommendations Panel */}
          <div className="bg-white shadow rounded-lg p-6">
            <RecommendationPanel userId={user?.id || ''} />
          </div>

          {/* Quick actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/profile/resume')}
                className="w-full flex items-center justify-between p-3 text-left text-sm rounded-md hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">Upload Resume</span>
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </button>

              <button
                onClick={() => navigate('/training')}
                className="w-full flex items-center justify-between p-3 text-left text-sm rounded-md hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">Explore Training Programs</span>
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </button>

              <button
                onClick={() => navigate('/career-paths')}
                className="w-full flex items-center justify-between p-3 text-left text-sm rounded-md hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">View Career Paths</span>
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
