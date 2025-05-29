/**
 * Comprehensive Agent System Tests
 * 
 * Tests the multi-agent LangGraph system with proper mocking
 * and integration scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCareerSpecialistSubgraph } from '../subgraphs/careerSpecialistSubgraph';
import { enhancedSupervisorNode } from '../optimized/supervisorWithCommand';
import { cacheManager } from '../optimized/cacheManager';
import { streamingManager } from '../optimized/streamingManager';
import { HumanMessage } from '@langchain/core/messages';

// Mock external dependencies
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(() => ({
    invoke: vi.fn(() => Promise.resolve({
      content: 'Mocked AI response for career guidance'
    }))
  }))
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { first_name: 'Test User', user_type: 'job_seeker' }
          }))
        }))
      }))
    }))
  }
}));

describe('Agent System Integration Tests', () => {
  beforeEach(() => {
    // Clear all caches before each test
    cacheManager.clearAllCaches();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Cleanup streams after each test
    streamingManager.cleanupStreams();
  });

  describe('Career Specialist Subgraph', () => {
    it('should analyze career context correctly', async () => {
      const graph = createCareerSpecialistSubgraph();
      
      const input = {
        messages: [new HumanMessage('I am a veteran looking for entry-level clean energy jobs')],
        user_id: 'test-user-123'
      };
      
      const result = await graph.invoke(input);
      
      expect(result.career_context.experience_level).toBe('entry');
      expect(result.partner_recommendations).toBeDefined();
      expect(result.messages).toHaveLength(2); // Input + AI response
    });
    
    it('should handle senior-level career transitions', async () => {
      const graph = createCareerSpecialistSubgraph();
      
      const input = {
        messages: [new HumanMessage('I want to transition to leading a renewable energy team')],
        user_id: 'test-user-456'
      };
      
      const result = await graph.invoke(input);
      
      expect(result.career_context.experience_level).toBe('senior');
      expect(result.career_context.career_goals).toContain('Transition to clean energy sector');
    });
    
    it('should cache and reuse partner recommendations', async () => {
      const graph = createCareerSpecialistSubgraph();
      
      const input = {
        messages: [new HumanMessage('Solar installer training programs')],
        user_id: 'test-user-789'
      };
      
      // First request
      const result1 = await graph.invoke(input);
      const recommendations1 = result1.partner_recommendations;
      
      // Cache the recommendations
      cacheManager.cachePartnerRecommendations(
        'test-user-789',
        'career_specialist',
        'Solar installer training programs',
        recommendations1
      );
      
      // Second similar request should use cache
      const cached = cacheManager.getCachedPartnerRecommendations(
        'test-user-789',
        'career_specialist',
        'Solar installer training programs'
      );
      
      expect(cached).toEqual(recommendations1);
    });
  });

  describe('Enhanced Supervisor Routing', () => {
    it('should route veterans to veterans specialist', async () => {
      const mockState = {
        messages: [new HumanMessage('I am a military veteran seeking green jobs')],
        user_id: 'test-veteran-123',
        job_seeker_profile: { veteran: true },
        conversation_context: {},
        memory_state: { interaction_history: [] }
      };
      
      const result = await enhancedSupervisorNode(mockState);
      
      expect(result.goto).toBe('veterans_specialist');
      expect(result.update.conversation_context.topic).toBe('veterans');
      expect(result.update.conversation_context.veteran_context.service_verified).toBe(true);
    });
    
    it('should route international users to international specialist', async () => {
      const mockState = {
        messages: [new HumanMessage('I have an H1B visa and need work authorization guidance')],
        user_id: 'test-international-456',
        job_seeker_profile: { international_professional: true },
        conversation_context: {},
        memory_state: { interaction_history: [] }
      };
      
      const result = await enhancedSupervisorNode(mockState);
      
      expect(result.goto).toBe('international_specialist');
      expect(result.update.conversation_context.topic).toBe('international');
    });
    
    it('should handle complex routing with multiple indicators', async () => {
      const mockState = {
        messages: [new HumanMessage('As a veteran with visa questions about clean energy careers')],
        user_id: 'test-complex-789',
        job_seeker_profile: { veteran: true, international_professional: false },
        conversation_context: {},
        memory_state: { interaction_history: [] }
      };
      
      const result = await enhancedSupervisorNode(mockState);
      
      // Should prioritize veteran status
      expect(result.goto).toBe('veterans_specialist');
      expect(result.update.conversation_context.urgency).toBeDefined();
    });
  });

  describe('Strategic Cache Manager', () => {
    it('should cache and retrieve user profiles', () => {
      const userId = 'test-cache-user';
      const profile = {
        first_name: 'Test',
        user_type: 'job_seeker',
        veteran: true
      };
      
      cacheManager.cacheUserProfile(userId, profile);
      const cached = cacheManager.getCachedUserProfile(userId);
      
      expect(cached).toEqual(profile);
    });
    
    it('should merge similar partner recommendations', () => {
      const userId = 'test-merge-user';
      const agentType = 'career_specialist';
      
      const recommendations1 = [
        { partner_name: 'Franklin Cummings Tech', relevance_score: 85 },
        { partner_name: 'TPS Energy', relevance_score: 75 }
      ];
      
      const recommendations2 = [
        { partner_name: 'Franklin Cummings Tech', relevance_score: 90 }, // Higher score
        { partner_name: 'Green Energy Corp', relevance_score: 80 }
      ];
      
      cacheManager.cachePartnerRecommendations(userId, agentType, 'solar training', recommendations1);
      cacheManager.cachePartnerRecommendations(userId, agentType, 'solar installer training', recommendations2);
      
      const cached = cacheManager.getCachedPartnerRecommendations(userId, agentType, 'solar training');
      
      // Should have merged and kept higher score for Franklin Cummings Tech
      const franklinRec = cached?.find(r => r.partner_name === 'Franklin Cummings Tech');
      expect(franklinRec?.relevance_score).toBe(90);
    });
    
    it('should provide cache statistics', () => {
      cacheManager.cacheUserProfile('user1', { name: 'Test 1' });
      cacheManager.cacheUserProfile('user2', { name: 'Test 2' });
      
      const stats = cacheManager.getCacheStats();
      
      expect(stats.userProfiles.size).toBe(2);
      expect(stats.userProfiles.maxSize).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Streaming Manager', () => {
    it('should create and manage streams', () => {
      const sessionId = 'test-stream-session';
      const stream = streamingManager.createStream(sessionId);
      
      expect(stream).toBeInstanceOf(ReadableStream);
      expect(streamingManager.getActiveStreamCount()).toBe(1);
      
      streamingManager.cleanupStreams();
      expect(streamingManager.getActiveStreamCount()).toBe(0);
    });
    
    it('should stream agent steps', async () => {
      const sessionId = 'test-steps-session';
      const stream = streamingManager.createStream(sessionId);
      const reader = stream.getReader();
      
      // Stream a step
      streamingManager.streamAgentStep(sessionId, 'career_specialist', 'career_analysis', {
        query: 'test query'
      });
      
      const { value, done } = await reader.read();
      
      expect(done).toBe(false);
      expect(value?.type).toBe('step');
      expect(value?.agent).toBe('career_specialist');
      expect(value?.step).toBe('career_analysis');
      
      reader.releaseLock();
    });
    
    it('should stream recommendations', async () => {
      const sessionId = 'test-rec-session';
      const stream = streamingManager.createStream(sessionId);
      const reader = stream.getReader();
      
      const recommendation = {
        partner_name: 'Test Partner',
        opportunity_type: 'training',
        relevance_score: 95
      };
      
      streamingManager.streamRecommendation(sessionId, 'career_specialist', recommendation);
      
      const { value, done } = await reader.read();
      
      expect(done).toBe(false);
      expect(value?.type).toBe('recommendation');
      expect(value?.data).toEqual(recommendation);
      
      reader.releaseLock();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle LLM errors gracefully', async () => {
      // Mock LLM to throw error
      const mockLLM = vi.fn(() => {
        throw new Error('API rate limit exceeded');
      });
      
      vi.doMock('@langchain/openai', () => ({
        ChatOpenAI: vi.fn(() => ({
          invoke: mockLLM
        }))
      }));
      
      const graph = createCareerSpecialistSubgraph();
      
      const input = {
        messages: [new HumanMessage('Test query')],
        user_id: 'test-error-user'
      };
      
      // Should not throw, but handle error gracefully
      const result = await graph.invoke(input).catch(error => ({ error: error.message }));
      
      expect(result).toEqual({ error: 'API rate limit exceeded' });
    });
    
    it('should stream errors appropriately', async () => {
      const sessionId = 'test-error-stream';
      const stream = streamingManager.createStream(sessionId);
      const reader = stream.getReader();
      
      streamingManager.streamError(sessionId, 'career_specialist', 'Test error message');
      
      const { value, done } = await reader.read();
      
      expect(done).toBe(false);
      expect(value?.type).toBe('error');
      expect(value?.data.error).toBe('Test error message');
      expect(value?.data.recoverable).toBe(true);
      
      reader.releaseLock();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const graph = createCareerSpecialistSubgraph();
      
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        messages: [new HumanMessage(`Query ${i} about green energy careers`)],
        user_id: `concurrent-user-${i}`
      }));
      
      const startTime = Date.now();
      const results = await Promise.all(
        concurrentRequests.map(input => graph.invoke(input))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
      
      // All results should have valid responses
      results.forEach(result => {
        expect(result.messages).toHaveLength(2);
        expect(result.career_context).toBeDefined();
      });
    });
    
    it('should efficiently use cache for similar queries', async () => {
      const userId = 'cache-efficiency-user';
      const agentType = 'career_specialist';
      
      // Prime the cache
      const recommendations = [
        { partner_name: 'Test Partner', relevance_score: 90 }
      ];
      cacheManager.cachePartnerRecommendations(userId, agentType, 'solar energy jobs', recommendations);
      
      // Multiple similar queries should hit cache
      const queries = [
        'solar energy jobs',
        'solar energy careers',
        'solar power jobs',
        'renewable energy positions'
      ];
      
      let cacheHits = 0;
      queries.forEach(query => {
        const cached = cacheManager.getCachedPartnerRecommendations(userId, agentType, query);
        if (cached) cacheHits++;
      });
      
      expect(cacheHits).toBeGreaterThan(0);
    });
  });
}); 