/**
 * Climate Ecosystem Assistant Integration Demo
 *
 * This component demonstrates the complete integration architecture:
 * Frontend ↔ Database ↔ AI Agents
 *
 * Shows real-time updates, AI interactions, and seamless data flow
 * across all user types (Job Seekers, Partners, Admins)
 */

import React, { useState } from 'react';
import { useClimateEcosystemIntegration } from '../../lib/hooks/useClimateEcosystemIntegration';
import {
  Upload,
  MessageSquare,
  Briefcase,
  BarChart3,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

export const IntegrationDemo: React.FC = () => {
  const {
    user,
    profile,
    jobMatches,
    messages,
    partnerAnalytics,
    matchesLoading,
    conversationLoading,
    analyticsLoading,
    resumeAnalyzing,
    resumeAnalyzed,
    uploadResume,
    refreshJobMatches,
    sendMessage,
    createJobListing,
    refreshPartnerAnalytics,
    getDashboardRoute,
    isOnboardingComplete,
    getAvailableFeatures
  } = useClimateEcosystemIntegration();

  const [chatMessage, setChatMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle resume upload
  const handleResumeUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadResume(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.error('Resume upload failed:', error);
    }
  };

  // Handle chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      await sendMessage(chatMessage);
      setChatMessage('');
    } catch (error) {
      console.error('Message send failed:', error);
    }
  };

  // Handle job listing creation (demo)
  const handleCreateJobListing = async () => {
    const demoJobData = {
      title: 'Solar Installation Technician',
      description: 'Install and maintain solar panel systems',
      location: 'San Francisco, CA',
      salary_range: '$45,000 - $65,000',
      requirements: ['Solar PV experience', 'Electrical knowledge'],
      type: 'full-time'
    };

    try {
      await createJobListing(demoJobData);
    } catch (error) {
      console.error('Job listing creation failed:', error);
    }
  };

  if (!user || !profile) {
    return (
      <div className="card p-8 text-center">
        <h3 className="font-display font-medium text-xl text-midnight-forest mb-4">
          Integration Demo
        </h3>
        <p className="font-body text-midnight-forest-600">
          Please log in to see the integration demo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-spring-green-100 rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-spring-green-700" />
          </div>
          <div>
            <h2 className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight">
              Integration Architecture Demo
            </h2>
            <p className="font-body text-midnight-forest-600 tracking-act-tight">
              Frontend ↔ Database ↔ AI Agents in action
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-sand-gray-100 rounded-act">
          <div>
            <span className="font-body text-sm font-medium text-midnight-forest">User Type:</span>
            <p className="font-body text-midnight-forest-600 capitalize">{profile.user_type.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="font-body text-sm font-medium text-midnight-forest">Dashboard Route:</span>
            <p className="font-body text-midnight-forest-600">{getDashboardRoute()}</p>
          </div>
          <div>
            <span className="font-body text-sm font-medium text-midnight-forest">Onboarding:</span>
            <p className="font-body text-midnight-forest-600 flex items-center gap-1">
              {isOnboardingComplete() ? (
                <>
                  <CheckCircle className="h-4 w-4 text-spring-green" />
                  Complete
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-sand-gray-400" />
                  Pending
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Available Features */}
      <div className="card p-6">
        <h3 className="font-display font-medium text-lg text-midnight-forest mb-4">
          Available Features
        </h3>
        <div className="flex flex-wrap gap-2">
          {getAvailableFeatures().map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 bg-spring-green-100 text-spring-green-700 rounded-full text-sm font-medium"
            >
              {feature.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Job Seeker Features */}
      {profile.user_type === 'job_seeker' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume Upload & Analysis */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="h-5 w-5 text-spring-green" />
              <h3 className="font-display font-medium text-lg text-midnight-forest">
                Resume Analysis
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="input"
                />
              </div>

              <button
                onClick={handleResumeUpload}
                disabled={!selectedFile || resumeAnalyzing}
                className="btn-primary w-full"
              >
                {resumeAnalyzing ? 'Analyzing with AI...' : 'Upload & Analyze Resume'}
              </button>

              {resumeAnalyzed && (
                <div className="p-3 bg-spring-green-100 rounded-act">
                  <p className="font-body text-sm text-spring-green-700">
                    ✅ Resume analyzed successfully! Job matching triggered.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Job Matches */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-moss-green" />
                <h3 className="font-display font-medium text-lg text-midnight-forest">
                  Job Matches
                </h3>
              </div>
              <button
                onClick={refreshJobMatches}
                disabled={matchesLoading}
                className="btn-outline-sm"
              >
                {matchesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="space-y-3">
              {jobMatches.length === 0 ? (
                <p className="font-body text-sm text-midnight-forest-600">
                  No matches yet. Upload your resume to get started!
                </p>
              ) : (
                jobMatches.slice(0, 3).map((match) => (
                  <div key={match.id} className="p-3 bg-sand-gray-100 rounded-act">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-body font-medium text-midnight-forest">
                        {match.job_title}
                      </h4>
                      <span className="text-sm font-medium text-spring-green">
                        {Math.round(match.match_score * 100)}% match
                      </span>
                    </div>
                    <p className="font-body text-sm text-midnight-forest-600">
                      {match.company_name} • {match.location}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Partner Features */}
      {profile.user_type === 'partner' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Job Listing Creation */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="h-5 w-5 text-moss-green" />
              <h3 className="font-display font-medium text-lg text-midnight-forest">
                Job Listing Management
              </h3>
            </div>

            <div className="space-y-4">
              <p className="font-body text-sm text-midnight-forest-600">
                Create job listings that automatically trigger candidate matching
              </p>

              <button
                onClick={handleCreateJobListing}
                className="btn-primary w-full"
              >
                Create Demo Job Listing
              </button>
            </div>
          </div>

          {/* Partner Analytics */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-seafoam-blue-300" />
                <h3 className="font-display font-medium text-lg text-midnight-forest">
                  Analytics
                </h3>
              </div>
              <button
                onClick={refreshPartnerAnalytics}
                disabled={analyticsLoading}
                className="btn-outline-sm"
              >
                {analyticsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {partnerAnalytics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-sand-gray-100 rounded-act">
                  <p className="font-display font-medium text-lg text-midnight-forest">
                    {partnerAnalytics.totalJobs}
                  </p>
                  <p className="font-body text-sm text-midnight-forest-600">Total Jobs</p>
                </div>
                <div className="text-center p-3 bg-sand-gray-100 rounded-act">
                  <p className="font-display font-medium text-lg text-midnight-forest">
                    {partnerAnalytics.totalApplications}
                  </p>
                  <p className="font-body text-sm text-midnight-forest-600">Applications</p>
                </div>
              </div>
            ) : (
              <p className="font-body text-sm text-midnight-forest-600">
                Click refresh to load analytics data
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Chat Interface (All Users) */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-5 w-5 text-seafoam-blue-300" />
          <h3 className="font-display font-medium text-lg text-midnight-forest">
            AI Assistant Chat
          </h3>
        </div>

        <div className="space-y-4">
          {/* Messages */}
          <div className="h-40 overflow-y-auto border border-sand-gray-200 rounded-act p-3 space-y-2">
            {messages.length === 0 ? (
              <p className="font-body text-sm text-midnight-forest-600">
                Start a conversation with the AI assistant...
              </p>
            ) : (
              messages.slice(-5).map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded-act ${
                    message.message_type === 'user'
                      ? 'bg-spring-green-100 ml-8'
                      : 'bg-sand-gray-100 mr-8'
                  }`}
                >
                  <p className="font-body text-sm text-midnight-forest">
                    {message.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask the AI assistant anything..."
              className="input flex-1"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatMessage.trim() || conversationLoading}
              className="btn-primary"
            >
              {conversationLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-spring-green" />
          <h3 className="font-display font-medium text-lg text-midnight-forest">
            Real-time Integration Status
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-spring-green rounded-full"></div>
            <span className="font-body text-sm text-midnight-forest-600">
              Database Connected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-spring-green rounded-full"></div>
            <span className="font-body text-sm text-midnight-forest-600">
              Real-time Updates Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-spring-green rounded-full"></div>
            <span className="font-body text-sm text-midnight-forest-600">
              AI Agents Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
