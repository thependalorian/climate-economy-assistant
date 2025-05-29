/**
 * Enhanced Agent Service
 * 
 * Client-side service for interacting with enhanced Supabase Edge Functions.
 * Provides production-ready features:
 * - Authentication integration
 * - Error handling and retry logic
 * - Analytics tracking
 * - Request/response validation
 * - Caching for performance
 * 
 * Located in /services/ for business logic services
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AgentRequest {
  message: string;
  conversation_id?: string;
  agent_type?: 'supervisor' | 'career_specialist' | 'veterans_specialist' | 'international_specialist' | 'ej_specialist';
  context?: {
    user_preferences?: Record<string, unknown>;
    previous_interactions?: number;
    urgency_level?: 'low' | 'medium' | 'high';
  };
}

interface AgentResponse {
  conversation_id: string;
  agent_type: string;
  message: string;
  partner_recommendations: PartnerRecommendation[];
  analytics: {
    processing_time_ms: number;
    engagement_score: number;
    recommendations_count: number;
  };
  next_actions: Array<{
    partner: string;
    action: string;
    contact: string;
  }>;
}

interface PartnerRecommendation {
  id: string;
  partner_name: string;
  opportunity_type: 'job' | 'training' | 'networking' | 'resource';
  relevance_score: number;
  reasoning: string;
  action_required: boolean;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  next_steps: string[];
  timestamp: Date;
}

interface ResumeProcessingRequest {
  resume_text: string;
  analysis_depth?: 'basic' | 'comprehensive' | 'expert';
  focus_areas?: ('skills' | 'experience' | 'education' | 'climate_relevance' | 'partner_matching')[];
  user_preferences?: {
    target_roles?: string[];
    geographic_preferences?: string[];
    salary_expectations?: string;
    career_level?: 'entry' | 'mid' | 'senior' | 'executive';
  };
}

interface ResumeAnalysisResponse {
  analysis_id: string;
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  skills: Array<{
    skill_name: string;
    proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    climate_relevance: number;
    transferability_score: number;
    context: string;
    certification_recommended?: string;
    market_demand: 'low' | 'medium' | 'high' | 'critical';
  }>;
  experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string;
    climate_relevance: number;
    transferable_skills: string[];
    achievements: string[];
    industry_alignment: number;
    partner_ecosystem_relevance: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_date?: string;
    climate_relevance: number;
    certifications: string[];
  }>;
  climate_analysis: {
    overall_score: number;
    category_scores: {
      renewable_energy: number;
      energy_efficiency: number;
      sustainability: number;
      environmental_science: number;
      green_building: number;
      climate_policy: number;
    };
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    career_pathway_suggestions: string[];
  };
  partner_matches: Array<{
    partner_name: string;
    match_type: 'direct_hire' | 'training_program' | 'networking' | 'certification';
    relevance_score: number;
    reasoning: string;
    specific_opportunities: string[];
    requirements_gap: string[];
    next_steps: string[];
    contact_info: {
      email?: string;
      phone?: string;
      website?: string;
      application_link?: string;
    };
    timeline: string;
    success_probability: number;
  }>;
  summary: {
    skills_identified: number;
    climate_overall_score: number;
    top_climate_categories: Array<{ category: string; score: number }>;
    partner_matches_found: number;
    recommended_next_steps: Array<{
      partner: string;
      action: string;
      timeline: string;
      success_probability: number;
    }>;
  };
  processing_metadata: {
    total_processing_time_ms: number;
    analysis_quality: number;
    ai_confidence: number;
  };
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const SERVICE_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Start with 1 second
  timeout: 60000, // 60 seconds for long-running operations
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
};

// Simple in-memory cache for responses
const responseCache = new Map<string, { data: unknown; timestamp: number }>();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCacheKey(endpoint: string, request: Record<string, unknown>): string {
  return `${endpoint}_${JSON.stringify(request)}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < SERVICE_CONFIG.cacheTimeout) {
    return cached.data as T;
  }
  responseCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  responseCache.set(key, { data, timestamp: Date.now() });
}

async function makeAuthenticatedRequest<T>(
  functionName: string,
  request: Record<string, unknown>,
  options: {
    useCache?: boolean;
    timeout?: number;
    retries?: number;
  } = {}
): Promise<ServiceResponse<T>> {
  const {
    useCache = false,
    timeout = SERVICE_CONFIG.timeout,
    retries = SERVICE_CONFIG.maxRetries
  } = options;

  // Check cache first
  if (useCache) {
    const cacheKey = getCacheKey(functionName, request);
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }
  }

  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return {
      success: false,
      error: 'Authentication required. Please log in.'
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('X-RateLimit-Reset') || '60');
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
          retryAfter
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      // Cache successful responses
      if (useCache && result.data) {
        const cacheKey = getCacheKey(functionName, request);
        setCache(cacheKey, result.data);
      }

      return { success: true, data: result.data };

    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          success: false,
          error: 'Authentication failed. Please log in again.'
        };
      }

      // Don't retry on validation errors (400)
      if (error.message.includes('400')) {
        return {
          success: false,
          error: error.message
        };
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = SERVICE_CONFIG.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Service temporarily unavailable. Please try again.'
  };
}

// ============================================================================
// ENHANCED AGENT SERVICE CLASS
// ============================================================================

export class EnhancedAgentService {
  private static instance: EnhancedAgentService;
  private conversationHistory: Map<string, AgentRequest[]> = new Map();

  private constructor() {}

  public static getInstance(): EnhancedAgentService {
    if (!EnhancedAgentService.instance) {
      EnhancedAgentService.instance = new EnhancedAgentService();
    }
    return EnhancedAgentService.instance;
  }

  /**
   * Send message to enhanced agent with analytics tracking
   */
  async sendMessage(request: AgentRequest): Promise<ServiceResponse<AgentResponse>> {
    try {
      // Track analytics via console logging (React hooks cannot be used in class components)
      console.log('🔍 EnhancedAgentService: Tracking agent engagement:', {
        urgency: request.context?.urgency_level,
        agent_type: request.agent_type,
        message_length: request.message.length
      });

      // Add to conversation history
      if (request.conversation_id) {
        const history = this.conversationHistory.get(request.conversation_id) || [];
        history.push(request);
        this.conversationHistory.set(request.conversation_id, history);
        
        // Add interaction count to context
        if (!request.context) request.context = {};
        request.context.previous_interactions = history.length;
      }

      const result = await makeAuthenticatedRequest<AgentResponse>(
        'enhanced-agent-response',
        request,
        { useCache: false, timeout: 45000 } // Agent responses shouldn't be cached
      );

      if (result.success && result.data) {
        // Track successful interaction via console logging
        console.log('✅ EnhancedAgentService: Agent response received:', {
          processing_time: result.data.analytics.processing_time_ms,
          recommendations_count: result.data.analytics.recommendations_count,
          engagement_score: result.data.analytics.engagement_score
        });

        // Track partner recommendations
        if (result.data.partner_recommendations.length > 0) {
          console.log('🎯 EnhancedAgentService: Partner recommendations provided:', {
            top_partner: result.data.partner_recommendations[0]?.partner_name,
            total_recommendations: result.data.partner_recommendations.length
          });
        }
      } else {
        // Track errors
        console.error('❌ EnhancedAgentService: Agent request failed:', result.error || 'Agent request failed');
      }

      return result;

    } catch (error) {
      console.error('Agent service error:', error);
      return {
        success: false,
        error: 'Agent service temporarily unavailable'
      };
    }
  }

  /**
   * Process resume with comprehensive analysis
   */
  async processResume(request: ResumeProcessingRequest): Promise<ServiceResponse<ResumeAnalysisResponse>> {
    try {
      // Track analytics via console logging (React hooks cannot be used in class components)
      console.log('🔍 EnhancedAgentService: Tracking resume processing:', {
        analysis_depth: request.analysis_depth,
        focus_areas: request.focus_areas,
        resume_length: request.resume_text.length
      });

      const result = await makeAuthenticatedRequest<ResumeAnalysisResponse>(
        'enhanced-resume-processing',
        request,
        { 
          useCache: true, // Resume analysis can be cached
          timeout: 90000, // 90 seconds for comprehensive analysis
          retries: 2 // Fewer retries for intensive operations
        }
      );

      if (result.success && result.data) {
        // Track successful analysis via console logging
        console.log('✅ EnhancedAgentService: Resume analysis completed:', {
          processing_time: result.data.processing_metadata.total_processing_time_ms,
          skills_found: result.data.summary.skills_identified,
          climate_score: result.data.summary.climate_overall_score,
          partner_matches: result.data.summary.partner_matches_found,
          analysis_quality: result.data.processing_metadata.analysis_quality
        });

        // Track conversion if high-quality matches found
        if (result.data.summary.partner_matches_found > 0) {
          const bestMatch = result.data.partner_matches[0];
          if (bestMatch && bestMatch.success_probability > 70) {
            console.log('🎯 EnhancedAgentService: High-quality partner match found:', {
              top_partner: bestMatch.partner_name,
              match_type: bestMatch.match_type,
              success_probability: bestMatch.success_probability
            });
          }
        }
      } else {
        // Track errors
        console.error('❌ EnhancedAgentService: Resume processing failed:', result.error || 'Resume processing failed');
      }

      return result;

    } catch (error) {
      console.error('Resume processing service error:', error);
      return {
        success: false,
        error: 'Resume processing service temporarily unavailable'
      };
    }
  }

  /**
   * Get conversation history for a specific conversation
   */
  getConversationHistory(conversationId: string): AgentRequest[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(conversationId?: string): void {
    if (conversationId) {
      this.conversationHistory.delete(conversationId);
    } else {
      this.conversationHistory.clear();
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<{
    agent_service: 'healthy' | 'degraded' | 'down';
    resume_service: 'healthy' | 'degraded' | 'down';
    cache_size: number;
  }> {
    // Simple health check by making minimal requests
    const agentHealth = await makeAuthenticatedRequest(
      'enhanced-agent-response',
      { message: 'health check' },
      { timeout: 10000, retries: 1 }
    );

    const resumeHealth = await makeAuthenticatedRequest(
      'enhanced-resume-processing',
      { resume_text: 'health check resume content for testing service availability' },
      { timeout: 15000, retries: 1 }
    );

    return {
      agent_service: agentHealth.success ? 'healthy' : (agentHealth.rateLimited ? 'degraded' : 'down'),
      resume_service: resumeHealth.success ? 'healthy' : (resumeHealth.rateLimited ? 'degraded' : 'down'),
      cache_size: responseCache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    responseCache.clear();
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const enhancedAgentService = EnhancedAgentService.getInstance();

// Export individual methods for convenience
export const {
  sendMessage,
  processResume,
  getConversationHistory,
  clearConversationHistory,
  getServiceHealth,
  clearCache
} = enhancedAgentService; 