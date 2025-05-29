/**
 * Enhanced Supervisor with Command-based Routing
 * 
 * Uses LangGraph Command for combined state updates and routing decisions
 */

import { Command } from '@langchain/langgraph';
import { ClimateEcosystemStateType } from '../langGraphSystem';

interface QueryAnalysis {
  scores: Record<string, number>;
  profileContext: {
    is_veteran: boolean;
    is_international: boolean;
    is_ej_resident: boolean;
    interaction_count: number;
  };
  originalQuery: string;
}

interface RoutingDecision {
  agent: string;
  confidence: number;
  reasoning: string;
  urgency: 'low' | 'medium' | 'high';
  context_updates: Record<string, unknown>;
}

// Enhanced supervisor with Command-based routing
export const enhancedSupervisorNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;
  
  // Advanced query analysis
  const analysis = analyzeUserQuery(userQuery, state);
  
  // Determine routing with context updates
  const decision = determineRouting(analysis);
  
  // Use Command to combine state update and routing
  return new Command({
    // Update conversation context
    update: {
      conversation_context: {
        ...state.conversation_context,
        topic: decision.agent.replace('_specialist', ''),
        complexity: decision.confidence < 0.7 ? 'complex' : 'moderate',
        urgency: decision.urgency,
        routing_reasoning: decision.reasoning,
        ...decision.context_updates
      },
      current_agent: decision.agent,
      // Update memory with routing decision
      memory_state: {
        ...state.memory_state,
        interaction_history: [
          ...(state.memory_state?.interaction_history || []),
          {
            timestamp: new Date(),
            agent: 'supervisor',
            topic: 'routing_decision',
            outcome: `Routed to ${decision.agent} with ${decision.confidence}% confidence`
          }
        ]
      }
    },
    // Dynamic routing
    goto: decision.agent
  });
};

function analyzeUserQuery(query: string, state: ClimateEcosystemStateType): QueryAnalysis {
  const lowerQuery = query.toLowerCase();
  
  // Extract key indicators
  const indicators = {
    veteran: ['veteran', 'military', 'service member', 'vets', 'army', 'navy', 'air force', 'marines'],
    international: ['visa', 'green card', 'international', 'h1b', 'work permit', 'immigration'],
    ej_community: ['community', 'justice', 'environmental justice', 'underserved', 'equity'],
    career: ['job', 'career', 'work', 'employment', 'position', 'role'],
    urgent: ['urgent', 'asap', 'immediately', 'help', 'crisis'],
    complex: ['complicated', 'complex', 'multiple', 'several issues']
  };
  
  const scores = Object.entries(indicators).reduce((acc, [category, keywords]) => {
    acc[category] = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
    return acc;
  }, {} as Record<string, number>);
  
  // Consider user profile context
  const profileContext = {
    is_veteran: state.job_seeker_profile?.veteran || false,
    is_international: state.job_seeker_profile?.international_professional || false,
    is_ej_resident: state.job_seeker_profile?.ej_community_resident || false,
    interaction_count: state.memory_state?.interaction_history?.length || 0
  };
  
  return { scores, profileContext, originalQuery: query };
}

function determineRouting(analysis: QueryAnalysis): RoutingDecision {
  const { scores, profileContext } = analysis;
  
  // Calculate agent scores with profile weighting
  const agentScores = {
    veterans_specialist: scores.veteran * 3 + (profileContext.is_veteran ? 10 : 0),
    international_specialist: scores.international * 3 + (profileContext.is_international ? 10 : 0),
    ej_specialist: scores.ej_community * 3 + (profileContext.is_ej_resident ? 10 : 0),
    career_specialist: scores.career * 2 + 1 // Base score for career specialist
  };
  
  // Determine best agent
  const bestAgent = Object.entries(agentScores).reduce((best, [agent, score]) => 
    score > best.score ? { agent, score } : best, 
    { agent: 'career_specialist', score: 0 }
  );
  
  // Calculate confidence
  const totalScore = Object.values(agentScores).reduce((sum, score) => sum + score, 0);
  const confidence = totalScore > 0 ? bestAgent.score / totalScore : 0.5;
  
  // Determine urgency
  const urgency = scores.urgent > 0 ? 'high' : 
                 scores.complex > 0 ? 'medium' : 'low';
  
  // Generate reasoning
  const reasoning = `Selected ${bestAgent.agent} based on: ${
    Object.entries(scores).filter(([, score]) => (score as number) > 0).map(([key, score]) => `${key}(${score})`).join(', ')
  }. Profile context: ${Object.entries(profileContext).filter(([, value]) => value).map(([key]) => key).join(', ')}`;
  
  // Context updates based on routing
  const context_updates: Record<string, unknown> = {};
  
  if (bestAgent.agent === 'veterans_specialist') {
    context_updates.veteran_context = {
      service_verified: profileContext.is_veteran,
      needs_verification: !profileContext.is_veteran && scores.veteran > 0
    };
  } else if (bestAgent.agent === 'international_specialist') {
    context_updates.immigration_context = {
      status_known: profileContext.is_international,
      needs_status_clarification: !profileContext.is_international && scores.international > 0
    };
  }
  
  return {
    agent: bestAgent.agent,
    confidence,
    reasoning,
    urgency,
    context_updates
  };
}

// Enhanced routing function that uses ends parameter
export const createEnhancedSupervisorNode = () => {
  return {
    node: enhancedSupervisorNode,
    ends: ['career_specialist', 'veterans_specialist', 'international_specialist', 'ej_specialist']
  };
}; 