/**
 * Climate Ecosystem Assistant Integration Hook
 *
 * This hook provides a complete interface to the integrated system:
 * Frontend ↔ Database ↔ AI Agents
 *
 * Implements the full architecture specification with real-time updates,
 * AI agent interactions, and seamless data flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  AuthIntegrationService,
  JobSeekerIntegrationService,
  ConversationIntegrationService,
  PartnerIntegrationService,
  RealtimeIntegrationService
} from '../integration-service';

interface JobMatch {
  id: string;
  job_listing_id: string;
  match_score: number;
  job_title: string;
  company_name: string;
  location: string;
  match_reasons: string[];
}

interface ConversationMessage {
  id: string;
  message: string;
  message_type: 'user' | 'agent';
  agent_type?: string;
  created_at: string;
}

interface PartnerAnalytics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalMatches: number;
  monthlyApplications: { month: string; count: number }[];
}

export function useClimateEcosystemIntegration() {
  const { user, profile } = useAuth();

  // Job Seeker State
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Conversation State
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);

  // Partner State
  const [partnerAnalytics, setPartnerAnalytics] = useState<PartnerAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Resume Analysis State
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [resumeAnalyzed, setResumeAnalyzed] = useState(false);

  /**
   * Job Seeker Functions
   */

  // Upload and analyze resume with AI
  const uploadResume = useCallback(async (file: File) => {
    if (!user) return;

    setResumeAnalyzing(true);
    try {
      const result = await JobSeekerIntegrationService.uploadAndAnalyzeResume(user.id, file);
      setResumeAnalyzed(true);

      // Trigger job matching after resume analysis
      await refreshJobMatches();

      return result;
    } catch (error) {
      console.error('Resume upload error:', error);
      throw error;
    } finally {
      setResumeAnalyzing(false);
    }
  }, [user, refreshJobMatches]);

  // Refresh job matches
  const refreshJobMatches = useCallback(async () => {
    if (!user || profile?.user_type !== 'job_seeker') return;

    setMatchesLoading(true);
    try {
      const matches = await JobSeekerIntegrationService.triggerJobMatching(user.id);
      setJobMatches(matches);
    } catch (error) {
      console.error('Job matches refresh error:', error);
    } finally {
      setMatchesLoading(false);
    }
  }, [user, profile]);

  /**
   * Conversation Functions
   */

  // Send message to AI agents
  const sendMessage = useCallback(async (message: string) => {
    if (!user) return;

    setConversationLoading(true);
    try {
      // Add user message immediately for optimistic UI
      const userMessage: ConversationMessage = {
        id: `temp_${Date.now()}`,
        message,
        message_type: 'user',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to AI agents
      const response = await ConversationIntegrationService.sendMessage(user.id, message);

      // Replace temp message with actual response
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, id: response.id } : msg
      ));

      return response;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    } finally {
      setConversationLoading(false);
    }
  }, [user]);

  /**
   * Partner Functions
   */

  // Refresh partner analytics
  const refreshPartnerAnalytics = useCallback(async () => {
    if (!user || profile?.user_type !== 'partner') return;

    setAnalyticsLoading(true);
    try {
      const analytics = await PartnerIntegrationService.getPartnerAnalytics(user.id);
      setPartnerAnalytics(analytics);
    } catch (error) {
      console.error('Partner analytics refresh error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user, profile]);

  // Create job listing
  const createJobListing = useCallback(async (jobData: Record<string, unknown>) => {
    if (!user || profile?.user_type !== 'partner') return;

    try {
      const jobListing = await PartnerIntegrationService.createJobListing(user.id, jobData);

      // Refresh analytics after creating job
      await refreshPartnerAnalytics();

      return jobListing;
    } catch (error) {
      console.error('Job listing creation error:', error);
      throw error;
    }
  }, [user, profile, refreshPartnerAnalytics]);

  /**
   * Real-time Subscriptions
   */

  // Set up real-time subscriptions based on user type
  useEffect(() => {
    if (!user || !profile) return;

    const subscriptions: (() => void)[] = [];

    // Job Seeker: Subscribe to job matches
    if (profile.user_type === 'job_seeker') {
      const unsubscribeMatches = RealtimeIntegrationService.subscribeToJobMatches(
        user.id,
        (matches) => {
          setJobMatches(matches);
        }
      );
      subscriptions.push(() => unsubscribeMatches.unsubscribe());
    }

    // Partner: Subscribe to notifications
    if (profile.user_type === 'partner') {
      const unsubscribeNotifications = RealtimeIntegrationService.subscribeToPartnerNotifications(
        user.id,
        (notification) => {
          // Handle partner notifications
          console.log('Partner notification:', notification);
        }
      );
      subscriptions.push(() => unsubscribeNotifications.unsubscribe());
    }

    // All users: Subscribe to conversation updates
    const unsubscribeConversation = ConversationIntegrationService.subscribeToConversation(
      user.id,
      (message) => {
        setMessages(prev => [...prev, message]);
      }
    );
    subscriptions.push(unsubscribeConversation);

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [user, profile]);

  /**
   * Initial Data Loading
   */

  // Load initial data based on user type
  useEffect(() => {
    if (!user || !profile) return;

    // Load job seeker data
    if (profile.user_type === 'job_seeker') {
      refreshJobMatches();
    }

    // Load partner data
    if (profile.user_type === 'partner') {
      refreshPartnerAnalytics();
    }
  }, [user, profile, refreshJobMatches, refreshPartnerAnalytics]);

  /**
   * Utility Functions
   */

  // Get user's dashboard route
  const getDashboardRoute = useCallback(() => {
    if (!profile) return '/';
    return AuthIntegrationService.getDashboardRoute(profile);
  }, [profile]);

  // Check if user has completed onboarding
  const isOnboardingComplete = useCallback(() => {
    return profile?.profile_completed || false;
  }, [profile]);

  // Get user's role-specific features
  const getAvailableFeatures = useCallback(() => {
    if (!profile) return [];

    const baseFeatures = ['profile', 'settings', 'help'];

    switch (profile.user_type) {
      case 'job_seeker':
        return [...baseFeatures, 'job_matches', 'training', 'resume', 'chat'];
      case 'partner':
        return [...baseFeatures, 'jobs', 'candidates', 'programs', 'analytics'];
      case 'admin':
        return [...baseFeatures, 'user_management', 'partner_verification', 'system_analytics'];
      default:
        return baseFeatures;
    }
  }, [profile]);

  return {
    // State
    user,
    profile,
    jobMatches,
    messages,
    partnerAnalytics,

    // Loading states
    matchesLoading,
    conversationLoading,
    analyticsLoading,
    resumeAnalyzing,
    resumeAnalyzed,

    // Job Seeker functions
    uploadResume,
    refreshJobMatches,

    // Conversation functions
    sendMessage,

    // Partner functions
    createJobListing,
    refreshPartnerAnalytics,

    // Utility functions
    getDashboardRoute,
    isOnboardingComplete,
    getAvailableFeatures
  };
}

// Export types for use in components
export type {
  JobMatch,
  ConversationMessage,
  PartnerAnalytics
};
