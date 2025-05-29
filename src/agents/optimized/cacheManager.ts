/**
 * Strategic Cache Manager for Agent System
 * 
 * Implements multi-layer caching for performance optimization
 */

import { LRUCache } from 'lru-cache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
}

interface PartnerRecommendation {
  partner_name: string;
  opportunity_type: string;
  relevance_score: number;
  reasoning: string;
  next_steps: string[];
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  user_type: string;
  veteran?: boolean;
  international_professional?: boolean;
  ej_community_resident?: boolean;
  [key: string]: unknown;
}

interface ConversationContext {
  topic?: string;
  complexity?: string;
  urgency?: string;
  routing_reasoning?: string;
  [key: string]: unknown;
}

export class StrategicCacheManager {
  private static instance: StrategicCacheManager;
  
  // Multiple cache layers with proper typing
  private partnerRecommendationsCache: LRUCache<string, CacheEntry<PartnerRecommendation[]>>;
  private userProfileCache: LRUCache<string, CacheEntry<UserProfile>>;
  private conversationContextCache: LRUCache<string, CacheEntry<ConversationContext>>;
  private agentResponseCache: LRUCache<string, CacheEntry<string>>;
  
  private constructor() {
    // Partner recommendations cache - long TTL since data is relatively stable
    this.partnerRecommendationsCache = new LRUCache<string, CacheEntry<PartnerRecommendation[]>>({
      max: 1000,
      ttl: 1000 * 60 * 30, // 30 minutes
    });
    
    // User profile cache - medium TTL
    this.userProfileCache = new LRUCache<string, CacheEntry<UserProfile>>({
      max: 500,
      ttl: 1000 * 60 * 15, // 15 minutes
    });
    
    // Conversation context cache - short TTL for active conversations
    this.conversationContextCache = new LRUCache<string, CacheEntry<ConversationContext>>({
      max: 2000,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
    
    // Agent response cache - very short TTL for similar queries
    this.agentResponseCache = new LRUCache<string, CacheEntry<string>>({
      max: 500,
      ttl: 1000 * 60 * 2, // 2 minutes
    });
  }
  
  public static getInstance(): StrategicCacheManager {
    if (!StrategicCacheManager.instance) {
      StrategicCacheManager.instance = new StrategicCacheManager();
    }
    return StrategicCacheManager.instance;
  }
  
  // Generate cache keys with intelligent hashing
  private generateUserProfileKey(userId: string): string {
    return `user_profile:${userId}`;
  }
  
  private generatePartnerKey(userId: string, agentType: string, queryHash: string): string {
    return `partner_recs:${userId}:${agentType}:${queryHash}`;
  }
  
  private generateContextKey(conversationId: string): string {
    return `context:${conversationId}`;
  }
  
  private generateResponseKey(agentType: string, queryHash: string, userContextHash: string): string {
    return `response:${agentType}:${queryHash}:${userContextHash}`;
  }
  
  // Hash query for similarity matching
  private hashQuery(query: string): string {
    // Simple query normalization and hashing
    const normalized = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .sort()
      .join('');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  // Cache user profile
  public cacheUserProfile(userId: string, profile: UserProfile): void {
    const key = this.generateUserProfileKey(userId);
    const entry: CacheEntry<UserProfile> = {
      data: profile,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    };
    this.userProfileCache.set(key, entry);
  }
  
  // Get cached user profile
  public getCachedUserProfile(userId: string): UserProfile | null {
    const key = this.generateUserProfileKey(userId);
    const entry = this.userProfileCache.get(key);
    
    if (entry) {
      entry.hits++;
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    
    return null;
  }
  
  // Cache partner recommendations with intelligent deduplication
  public cachePartnerRecommendations(
    userId: string, 
    agentType: string, 
    query: string, 
    recommendations: PartnerRecommendation[]
  ): void {
    const queryHash = this.hashQuery(query);
    const key = this.generatePartnerKey(userId, agentType, queryHash);
    
    // Check for similar cached recommendations
    const existingKeys = Array.from(this.partnerRecommendationsCache.keys())
      .filter((k: unknown) => (k as string).includes(`${userId}:${agentType}`));
    
    // Merge with existing recommendations if similar
    let mergedRecommendations = recommendations;
    for (const existingKey of existingKeys) {
      const existing = this.partnerRecommendationsCache.get(existingKey as string);
      if (existing && this.areRecommendationsSimilar(existing.data, recommendations)) {
        mergedRecommendations = this.mergeRecommendations(existing.data, recommendations);
        break;
      }
    }
    
    const entry: CacheEntry<PartnerRecommendation[]> = {
      data: mergedRecommendations,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    };
    
    this.partnerRecommendationsCache.set(key, entry);
  }
  
  // Get cached partner recommendations
  public getCachedPartnerRecommendations(
    userId: string, 
    agentType: string, 
    query: string
  ): PartnerRecommendation[] | null {
    const queryHash = this.hashQuery(query);
    const key = this.generatePartnerKey(userId, agentType, queryHash);
    
    const entry = this.partnerRecommendationsCache.get(key);
    if (entry) {
      entry.hits++;
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    
    // Check for similar queries
    const similarKeys = Array.from(this.partnerRecommendationsCache.keys())
      .filter((k: unknown) => (k as string).includes(`${userId}:${agentType}`));
    
    for (const similarKey of similarKeys) {
      const similarEntry = this.partnerRecommendationsCache.get(similarKey as string);
      if (similarEntry && this.areQueriesSimilar(query, similarKey as string)) {
        similarEntry.hits++;
        similarEntry.lastAccessed = Date.now();
        return similarEntry.data;
      }
    }
    
    return null;
  }
  
  // Cache conversation context
  public cacheConversationContext(conversationId: string, context: ConversationContext): void {
    const key = this.generateContextKey(conversationId);
    const entry: CacheEntry<ConversationContext> = {
      data: context,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    };
    this.conversationContextCache.set(key, entry);
  }
  
  // Get cached conversation context
  public getCachedConversationContext(conversationId: string): ConversationContext | null {
    const key = this.generateContextKey(conversationId);
    const entry = this.conversationContextCache.get(key);
    
    if (entry) {
      entry.hits++;
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    
    return null;
  }
  
  // Intelligent cache warming for popular patterns
  public warmCache(userId: string, userProfile: UserProfile): void {
    // Pre-cache common partner recommendations based on user profile
    const agentTypes = ['career_specialist', 'veterans_specialist', 'international_specialist', 'ej_specialist'];
    
    agentTypes.forEach(agentType => {
      if (this.shouldPreCacheForAgent(agentType, userProfile)) {
        this.preCachePartnerRecommendations(userId, agentType);
      }
    });
  }
  
  // Helper methods
  private areRecommendationsSimilar(rec1: PartnerRecommendation[], rec2: PartnerRecommendation[]): boolean {
    const partners1 = new Set(rec1.map(r => r.partner_name));
    const partners2 = new Set(rec2.map(r => r.partner_name));
    const intersection = new Set([...partners1].filter(x => partners2.has(x)));
    return intersection.size / Math.max(partners1.size, partners2.size) > 0.6;
  }
  
  private mergeRecommendations(existing: PartnerRecommendation[], newRecs: PartnerRecommendation[]): PartnerRecommendation[] {
    const merged = [...existing];
    newRecs.forEach(newRec => {
      const existingIndex = merged.findIndex(r => r.partner_name === newRec.partner_name);
      if (existingIndex >= 0) {
        // Keep the one with higher relevance score
        if (newRec.relevance_score > merged[existingIndex].relevance_score) {
          merged[existingIndex] = newRec;
        }
      } else {
        merged.push(newRec);
      }
    });
    return merged.sort((a, b) => b.relevance_score - a.relevance_score);
  }
  
  private areQueriesSimilar(query1: string, cacheKey: string): boolean {
    const hash1 = this.hashQuery(query1);
    return cacheKey.includes(hash1);
  }
  
  private shouldPreCacheForAgent(agentType: string, userProfile: UserProfile): boolean {
    switch (agentType) {
      case 'veterans_specialist':
        return userProfile.veteran === true;
      case 'international_specialist':
        return userProfile.international_professional === true;
      case 'ej_specialist':
        return userProfile.ej_community_resident === true;
      default:
        return true; // Always pre-cache career specialist
    }
  }
  
  private async preCachePartnerRecommendations(userId: string, agentType: string): Promise<void> {
    // Pre-generate common recommendations based on profile
    const commonQueries = this.getCommonQueriesForAgent(agentType);
    
    // This would call a simplified version of the partner matching logic
    // For now, just cache empty recommendations to avoid the lookup
    commonQueries.forEach(query => {
      const queryHash = this.hashQuery(query);
      const key = this.generatePartnerKey(userId, agentType, queryHash);
      this.partnerRecommendationsCache.set(key, {
        data: [],
        timestamp: Date.now(),
        hits: 0,
        lastAccessed: Date.now()
      });
    });
  }
  
  private getCommonQueriesForAgent(agentType: string): string[] {
    const commonQueries = {
      career_specialist: [
        'I need help finding a job in clean energy',
        'What training programs are available',
        'How do I transition to renewable energy'
      ],
      veterans_specialist: [
        'Veterans job opportunities',
        'Military skills translation',
        'Veterans benefits for training'
      ],
      international_specialist: [
        'Work authorization requirements',
        'International credential recognition',
        'Visa requirements for green jobs'
      ],
      ej_specialist: [
        'Community-based opportunities',
        'Environmental justice careers',
        'Local training programs'
      ]
    };
    
    return commonQueries[agentType as keyof typeof commonQueries] || [];
  }
  
  // Cache statistics
  public getCacheStats() {
    return {
      partnerRecommendations: {
        size: this.partnerRecommendationsCache.size,
        maxSize: this.partnerRecommendationsCache.max
      },
      userProfiles: {
        size: this.userProfileCache.size,
        maxSize: this.userProfileCache.max
      },
      conversationContext: {
        size: this.conversationContextCache.size,
        maxSize: this.conversationContextCache.max
      },
      agentResponses: {
        size: this.agentResponseCache.size,
        maxSize: this.agentResponseCache.max
      }
    };
  }
  
  // Clear all caches
  public clearAllCaches(): void {
    this.partnerRecommendationsCache.clear();
    this.userProfileCache.clear();
    this.conversationContextCache.clear();
    this.agentResponseCache.clear();
  }
}

// Export singleton instance
export const cacheManager = StrategicCacheManager.getInstance(); 