/**
 * Climate Ecosystem Assistant Integration Service
 *
 * This service orchestrates the complete integration between:
 * - Frontend (React/Next.js)
 * - Database (Supabase)
 * - AI Agents (LangGraph/OpenAI)
 *
 * Following the architecture specification for seamless data flow
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for integration
interface UserProfile {
  id: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  profile_completed: boolean;
}

interface JobMatch {
  id: string;
  job_seeker_id: string;
  job_listing_id: string;
  match_score: number;
  created_at: string;
}

interface ConversationMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  agent_type: string;
  created_at: string;
}

interface ResumeAnalysisResult {
  skills: string[];
  experience_years: number;
  education: Array<Record<string, unknown>>;
  climate_relevance_score: number;
  extracted_data: Record<string, unknown>;
}

/**
 * Authentication Integration Service
 * Handles user login/registration with profile management
 */
export class AuthIntegrationService {
  static async authenticateUser(email: string, password: string, userType?: string) {
    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Update user type if provided (for multi-type login)
      if (userType && profile.user_type !== userType) {
        await supabase
          .from('user_profiles')
          .update({ user_type: userType })
          .eq('id', authData.user.id);
      }

      // 4. Determine dashboard route
      const dashboardRoute = this.getDashboardRoute(profile);

      return {
        user: authData.user,
        profile,
        dashboardRoute,
        success: true
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error };
    }
  }

  static getDashboardRoute(profile: UserProfile): string {
    switch (profile.user_type) {
      case 'admin': return '/admin-dashboard';
      case 'partner':
        return profile.profile_completed ? '/partner-dashboard' : '/onboarding/partner';
      case 'job_seeker':
      default:
        return profile.profile_completed ? '/dashboard' : '/onboarding/job-seeker';
    }
  }
}

/**
 * Job Seeker Integration Service
 * Handles profile management, resume analysis, and job matching
 */
export class JobSeekerIntegrationService {
  static async uploadAndAnalyzeResume(userId: string, file: File): Promise<ResumeAnalysisResult> {
    try {
      // 1. Upload file to Supabase Storage
      const fileName = `${userId}/resume_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Extract text from PDF (would call backend service)
      const resumeText = await this.extractTextFromPDF(uploadData.path);

      // 3. Send to Resume Analysis Agent (Liv)
      const analysisResult = await this.callResumeAnalysisAgent(resumeText);

      // 4. Store structured data in database
      await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: uploadData.path,
          skills: analysisResult.skills,
          experience_years: analysisResult.experience_years,
          education: analysisResult.education,
          climate_relevance_score: analysisResult.climate_relevance_score,
          resume_analyzed: true
        })
        .eq('id', userId);

      // 5. Trigger job matching
      await this.triggerJobMatching(userId);

      return analysisResult;
    } catch (error) {
      console.error('Resume analysis error:', error);
      throw error;
    }
  }

  static async triggerJobMatching(userId: string): Promise<JobMatch[]> {
    try {
      // 1. Fetch job seeker profile
      const { data: profile } = await supabase
        .from('job_seeker_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Fetch active job listings
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('*')
        .eq('status', 'active');

      // 3. Call Job Matching Agent (Jasmine)
      const matches = await this.callJobMatchingAgent(profile, jobs);

      // 4. Store matches in database
      const { data: storedMatches } = await supabase
        .from('job_matches')
        .upsert(matches.map(match => ({
          job_seeker_id: userId,
          job_listing_id: match.job_id,
          match_score: match.score,
          match_reasons: match.reasons
        })))
        .select();

      return storedMatches || [];
    } catch (error) {
      console.error('Job matching error:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async extractTextFromPDF(_filePath: string): Promise<string> {
    // This would call a backend service for PDF text extraction
    // For now, return placeholder
    return "Sample resume text extracted from PDF";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async callResumeAnalysisAgent(_resumeText: string): Promise<ResumeAnalysisResult> {
    // This would call the Resume Analysis Agent (Liv)
    // For now, return mock data
    return {
      skills: ['Solar PV', 'Project Management', 'Sustainability'],
      experience_years: 5,
      education: [{ degree: 'BS Environmental Science', school: 'University' }],
      climate_relevance_score: 0.85,
      extracted_data: { summary: 'Experienced in renewable energy projects' }
    };
  }

  private static async callJobMatchingAgent(_profile: Record<string, unknown>, jobs: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>> {
    // This would call the Job Matching Agent (Jasmine)
    // For now, return mock matches
    return jobs.slice(0, 3).map((job, index) => ({
      job_id: job.id,
      score: 0.9 - (index * 0.1),
      reasons: ['Skills match', 'Location preference', 'Experience level']
    }));
  }
}

/**
 * Conversation Integration Service
 * Handles chat interactions with AI agents
 */
export class ConversationIntegrationService {
  private static realtimeChannel: RealtimeChannel | null = null;

  static async sendMessage(userId: string, message: string): Promise<ConversationMessage> {
    try {
      // 1. Store user message
      const { data: messageData } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          message,
          message_type: 'user'
        })
        .select()
        .single();

      // 2. Send to Supervisor Agent (Pendo)
      const agentResponse = await this.callSupervisorAgent(userId, message);

      // 3. Store agent response
      const { data: responseData } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          message: agentResponse.response,
          message_type: 'agent',
          agent_type: agentResponse.agent_type,
          conversation_id: messageData.conversation_id
        })
        .select()
        .single();

      return responseData;
    } catch (error) {
      console.error('Conversation error:', error);
      throw error;
    }
  }

  static subscribeToConversation(userId: string, callback: (message: ConversationMessage) => void) {
    this.realtimeChannel = supabase
      .channel(`conversation_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as ConversationMessage);
      })
      .subscribe();

    return () => {
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
        this.realtimeChannel = null;
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async callSupervisorAgent(_userId: string, _message: string): Promise<Record<string, unknown>> {
    // This would call the Supervisor Agent (Pendo) via LangGraph
    // For now, return mock response
    return {
      response: "Thank you for your message! I'm here to help you navigate the climate economy.",
      agent_type: 'supervisor'
    };
  }
}

/**
 * Partner Integration Service
 * Handles partner dashboard functionality
 */
export class PartnerIntegrationService {
  static async createJobListing(partnerId: string, jobData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      // 1. Create job listing
      const { data: jobListing } = await supabase
        .from('job_listings')
        .insert({
          partner_id: partnerId,
          ...jobData,
          status: 'active'
        })
        .select()
        .single();

      // 2. Trigger match recalculation for all job seekers
      await this.triggerGlobalJobMatching();

      return jobListing;
    } catch (error) {
      console.error('Job listing creation error:', error);
      throw error;
    }
  }

  static async getPartnerAnalytics(partnerId: string): Promise<Record<string, unknown>> {
    try {
      // Aggregate data from multiple tables
      const [jobListings, applications, matches] = await Promise.all([
        supabase.from('job_listings').select('*').eq('partner_id', partnerId),
        supabase.from('job_applications').select('*').eq('partner_id', partnerId),
        supabase.from('job_matches').select('*').eq('partner_id', partnerId)
      ]);

      return {
        totalJobs: jobListings.data?.length || 0,
        totalApplications: applications.data?.length || 0,
        totalMatches: matches.data?.length || 0,
        // Additional analytics calculations
      };
    } catch (error) {
      console.error('Partner analytics error:', error);
      throw error;
    }
  }

  private static async triggerGlobalJobMatching(): Promise<void> {
    // This would trigger job matching for all active job seekers
    // Implementation would depend on backend job processing system
    console.log('Triggering global job matching recalculation...');
  }
}

/**
 * Real-time Integration Service
 * Manages real-time subscriptions and updates
 */
export class RealtimeIntegrationService {
  static subscribeToJobMatches(userId: string, callback: (matches: JobMatch[]) => void) {
    return supabase
      .channel(`job_matches_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'job_matches',
        filter: `job_seeker_id=eq.${userId}`
      }, async () => {
        // Fetch updated matches
        const { data } = await supabase
          .from('job_matches')
          .select('*')
          .eq('job_seeker_id', userId)
          .order('match_score', { ascending: false });

        callback(data || []);
      })
      .subscribe();
  }

  static subscribeToPartnerNotifications(partnerId: string, callback: (notification: Record<string, unknown>) => void) {
    return supabase
      .channel(`partner_notifications_${partnerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${partnerId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  }
}

// Export all services
export {
  AuthIntegrationService,
  JobSeekerIntegrationService,
  ConversationIntegrationService,
  PartnerIntegrationService,
  RealtimeIntegrationService
};
