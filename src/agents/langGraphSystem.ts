/**
 * LangGraph-Based Climate Ecosystem Assistant
 * 
 * This file implements a sophisticated multi-agent system using LangGraph framework
 * with advanced memory management, state reducers, and human-in-the-loop capabilities.
 * 
 * Location: src/agents/langGraphSystem.ts
 */

import { StateGraph, Annotation, messagesStateReducer, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { interrupt } from '@langchain/langgraph';
import { 
  UnifiedUserProfile as UserProfileType, 
  UnifiedJobSeekerProfile as JobSeekerProfileType,
  SkillRecord as SkillRecordType,
  ExperienceRecord as ExperienceRecordType,
  EducationRecord as EducationRecordType 
} from '../types/unified';
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

// ============================================================================
// STATE MANAGEMENT WITH ADVANCED REDUCERS
// ============================================================================

/**
 * User Memory State for persistent context across conversations
 */
interface UserMemoryState {
  user_id: string;
  preferences: Record<string, string | number | boolean>;
  interaction_history: Array<{
    timestamp: Date;
    agent: string;
    topic: string;
    outcome: string;
  }>;
  career_progress: {
    goals: string[];
    completed_actions: string[];
    next_steps: string[];
  };
  partner_interactions: Array<{
    partner_name: string;
    interaction_type: 'application' | 'inquiry' | 'training' | 'networking';
    timestamp: Date;
    status: 'pending' | 'completed' | 'follow_up_needed';
  }>;
}

/**
 * Partner Recommendation State with deduplication
 */
interface PartnerRecommendation {
  id: string;
  partner_name: string;
  opportunity_type: 'job' | 'training' | 'networking' | 'resource';
  relevance_score: number;
  reasoning: string;
  action_required: boolean;
  timestamp: Date;
}

/**
 * Advanced State Annotation with Custom Reducers
 */
export const ClimateEcosystemState = Annotation.Root({
  // Message history with automatic management
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // User context with merge reducer
  user_profile: Annotation<UserProfileType | null>({
    reducer: (current: UserProfileType | null, update: UserProfileType | null) => update || current,
    default: () => null,
  }),

  // Job seeker profile with intelligent merging
  job_seeker_profile: Annotation<JobSeekerProfileType | null>({
    reducer: (current: JobSeekerProfileType | null, update: JobSeekerProfileType | null) => {
      if (!current) return update;
      if (!update) return current;
      return { ...current, ...update };
    },
    default: () => null,
  }),

  // Skills with deduplication and updates
  skills: Annotation<SkillRecordType[]>({
    reducer: (current: SkillRecordType[], update: SkillRecordType[]) => {
      const merged = [...current];
      update.forEach((newSkill: SkillRecordType) => {
        const existingIndex = merged.findIndex(s => s.skill_name === newSkill.skill_name);
        if (existingIndex >= 0) {
          merged[existingIndex] = { ...merged[existingIndex], ...newSkill };
        } else {
          merged.push(newSkill);
        }
      });
      return merged;
    },
    default: () => [],
  }),

  // Experience with chronological ordering
  experience: Annotation<ExperienceRecordType[]>({
    reducer: (current: ExperienceRecordType[], update: ExperienceRecordType[]) => {
      const merged = [...current, ...update];
      return merged.sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    },
    default: () => [],
  }),

  // Education with chronological ordering
  education: Annotation<EducationRecordType[]>({
    reducer: (current: EducationRecordType[], update: EducationRecordType[]) => {
      const merged = [...current, ...update];
      return merged.sort((a, b) => {
        const aDate = a.end_date || a.start_date || '1900-01-01';
        const bDate = b.end_date || b.start_date || '1900-01-01';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    },
    default: () => [],
  }),

  // Partner recommendations with smart deduplication
  partner_recommendations: Annotation<PartnerRecommendation[]>({
    reducer: (current: PartnerRecommendation[], update: PartnerRecommendation[]) => {
      const merged = [...current];
      update.forEach((newRec: PartnerRecommendation) => {
        const existingIndex = merged.findIndex(r => 
          r.partner_name === newRec.partner_name && 
          r.opportunity_type === newRec.opportunity_type
        );
        if (existingIndex >= 0) {
          // Update existing recommendation if new one has higher relevance
          if (newRec.relevance_score > merged[existingIndex].relevance_score) {
            merged[existingIndex] = newRec;
          }
        } else {
          merged.push(newRec);
        }
      });
      // Sort by relevance score and keep top 10
      return merged
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 10);
    },
    default: () => [],
  }),

  // Memory state for long-term persistence
  memory_state: Annotation<UserMemoryState | null>({
    reducer: (current: UserMemoryState | null, update: UserMemoryState | null) => {
      if (!current) return update;
      if (!update) return current;
      
      return {
        ...current,
        ...update,
        preferences: { ...current.preferences, ...update.preferences },
        interaction_history: [
          ...current.interaction_history,
          ...(update.interaction_history || [])
        ].slice(-50), // Keep last 50 interactions
        career_progress: {
          ...current.career_progress,
          ...update.career_progress,
          goals: [...new Set([
            ...current.career_progress.goals,
            ...(update.career_progress?.goals || [])
          ])],
          completed_actions: [...new Set([
            ...current.career_progress.completed_actions,
            ...(update.career_progress?.completed_actions || [])
          ])],
        },
        partner_interactions: [
          ...current.partner_interactions,
          ...(update.partner_interactions || [])
        ].slice(-20), // Keep last 20 partner interactions
      };
    },
    default: () => null,
  }),

  // Current agent handling the conversation
  current_agent: Annotation<string>({
    reducer: (current: string, update: string) => update || current,
    default: () => 'supervisor',
  }),

  // Conversation context and metadata
  conversation_context: Annotation<{
    topic: string;
    complexity: 'simple' | 'moderate' | 'complex';
    requires_human_approval: boolean;
    partner_focus: string[];
  }>({
    reducer: (current: {
      topic: string;
      complexity: 'simple' | 'moderate' | 'complex';
      requires_human_approval: boolean;
      partner_focus: string[];
    }, update: Partial<{
      topic: string;
      complexity: 'simple' | 'moderate' | 'complex';
      requires_human_approval: boolean;
      partner_focus: string[];
    }>) => ({ ...current, ...update }),
    default: () => ({
      topic: 'general',
      complexity: 'simple',
      requires_human_approval: false,
      partner_focus: [],
    }),
  }),

  // Workflow state for multi-step processes
  workflow_state: Annotation<{
    step: string;
    completed_steps: string[];
    next_actions: string[];
    awaiting_input: boolean;
  }>({
    reducer: (current: {
      step: string;
      completed_steps: string[];
      next_actions: string[];
      awaiting_input: boolean;
    }, update: Partial<{
      step: string;
      completed_steps: string[];
      next_actions: string[];
      awaiting_input: boolean;
    }>) => ({ ...current, ...update }),
    default: () => ({
      step: 'initial',
      completed_steps: [],
      next_actions: [],
      awaiting_input: false,
    }),
  }),
});

export type ClimateEcosystemStateType = typeof ClimateEcosystemState.State;

// ============================================================================
// MEMORY MANAGER AGENT
// ============================================================================

/**
 * Memory Manager Agent - Handles persistent memory and context management
 */
class MemoryManagerAgent {
  private memoryStore: Map<string, UserMemoryState> = new Map();

  async updateUserMemory(
    userId: string, 
    interaction: {
      agent: string;
      topic: string;
      outcome: string;
    },
    preferences?: Record<string, string | number | boolean>,
    careerProgress?: Partial<UserMemoryState['career_progress']>
  ): Promise<UserMemoryState> {
    const existing = this.memoryStore.get(userId) || {
      user_id: userId,
      preferences: {},
      interaction_history: [],
      career_progress: {
        goals: [],
        completed_actions: [],
        next_steps: [],
      },
      partner_interactions: [],
    };

    const updated: UserMemoryState = {
      ...existing,
      preferences: { ...existing.preferences, ...preferences },
      interaction_history: [
        ...existing.interaction_history,
        { ...interaction, timestamp: new Date() }
      ].slice(-50),
      career_progress: {
        ...existing.career_progress,
        ...careerProgress,
      },
    };

    this.memoryStore.set(userId, updated);
    return updated;
  }

  async getUserMemory(userId: string): Promise<UserMemoryState | null> {
    return this.memoryStore.get(userId) || null;
  }

  async addPartnerInteraction(
    userId: string,
    interaction: Omit<UserMemoryState['partner_interactions'][0], 'timestamp'>
  ): Promise<void> {
    const existing = this.memoryStore.get(userId);
    if (existing) {
      existing.partner_interactions.push({
        ...interaction,
        timestamp: new Date(),
      });
      this.memoryStore.set(userId, existing);
    }
  }
}

// Global memory manager instance
const memoryManager = new MemoryManagerAgent();

// ============================================================================
// LANGGRAPH NODES
// ============================================================================

/**
 * Memory Management Node - Updates and retrieves user memory
 */
const memoryManagementNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userId = state.user_profile?.id || 'anonymous';
  const userQuery = lastMessage.content as string;

  // Check if we need weekly updates (every 7 days or on specific request)
  const userMemory = await memoryManager.getUserMemory(userId);
  const lastUpdate = userMemory?.interaction_history.find(
    interaction => interaction.topic.includes('weekly update')
  );
  const needsWeeklyUpdate = !lastUpdate || 
    (new Date().getTime() - new Date(lastUpdate.timestamp).getTime()) > 7 * 24 * 60 * 60 * 1000;
  
  let weeklyUpdateInfo = '';
  if (needsWeeklyUpdate || userQuery.toLowerCase().includes('latest') || userQuery.toLowerCase().includes('recent')) {
    weeklyUpdateInfo = await getWeeklyMassachusettsClimateUpdate();
  }

  // Update memory with current interaction
  if (lastMessage instanceof HumanMessage) {
    const memoryState = await memoryManager.updateUserMemory(
      userId,
      {
        agent: state.current_agent,
        topic: weeklyUpdateInfo ? `weekly update: ${state.conversation_context.topic}` : state.conversation_context.topic,
        outcome: 'user_query_received',
      }
    );

    const memoryResponse = weeklyUpdateInfo 
      ? `🧠 Memory updated with latest Massachusetts climate economy updates.\n\n${weeklyUpdateInfo}`
      : '🧠 Memory updated successfully.';

    return {
      memory_state: memoryState,
      messages: [new AIMessage(memoryResponse)],
    };
  }

  return {};
};

/**
 * Supervisor Node - Analyzes queries and routes to appropriate specialists
 */
const supervisorNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const openai = new ChatOpenAI({
    temperature: 0.3,
    modelName: 'gpt-4',
  });

  const analysisPrompt = `You are Pendo, the Climate Ecosystem Supervisor. Analyze this user query and determine the best approach.

USER QUERY: "${userQuery}"

USER CONTEXT:
- Profile: ${state.user_profile ? 'Complete' : 'Incomplete'}
- Skills: ${state.skills.length} recorded
- Experience: ${state.experience.length} positions
- Previous interactions: ${state.memory_state?.interaction_history.length || 0}

ANALYSIS REQUIRED:
1. Query complexity (simple/moderate/complex)
2. Best specialist agent (career/veterans/international/ej/memory)
3. Whether human approval is needed for recommendations
4. Partner focus areas

Respond in JSON format:
{
  "complexity": "simple|moderate|complex",
  "recommended_agent": "career_specialist|veterans_specialist|international_specialist|ej_specialist|memory_manager",
  "requires_human_approval": boolean,
  "partner_focus": ["partner1", "partner2"],
  "reasoning": "explanation of routing decision"
}`;

  try {
    const response = await openai.invoke([
      new SystemMessage(analysisPrompt),
      new HumanMessage(userQuery)
    ]);

    const analysis = JSON.parse(response.content as string);

    return {
      current_agent: analysis.recommended_agent,
      conversation_context: {
        topic: analysis.recommended_agent.replace('_specialist', ''),
        complexity: analysis.complexity,
        requires_human_approval: analysis.requires_human_approval,
        partner_focus: analysis.partner_focus,
      },
      messages: [
        new AIMessage(`I'll connect you with our ${analysis.recommended_agent.replace('_', ' ')} specialist. ${analysis.reasoning}`)
      ],
    };
  } catch (error) {
    console.error('Supervisor analysis failed:', error);
    
    // Fallback routing logic
    const lowerQuery = userQuery.toLowerCase();
    let recommendedAgent = 'career_specialist';
    
    if (lowerQuery.includes('veteran') || lowerQuery.includes('military')) {
      recommendedAgent = 'veterans_specialist';
    } else if (lowerQuery.includes('international') || lowerQuery.includes('visa')) {
      recommendedAgent = 'international_specialist';
    } else if (lowerQuery.includes('community') || lowerQuery.includes('justice')) {
      recommendedAgent = 'ej_specialist';
    }

    return {
      current_agent: recommendedAgent,
      conversation_context: {
        topic: recommendedAgent.replace('_specialist', ''),
        complexity: 'moderate',
        requires_human_approval: false,
        partner_focus: [],
      },
    };
  }
};

/**
 * Career Specialist Node - Handles career guidance and development
 */
const careerSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const openai = new ChatOpenAI({
    temperature: 0.7,
    modelName: 'gpt-4',
  });

  // Check if additional skills translation research is needed
  let additionalSkillsInfo = '';
  const needsSkillsTranslation = userQuery.toLowerCase().includes('experience') || 
                                userQuery.toLowerCase().includes('skills') || 
                                userQuery.toLowerCase().includes('background') ||
                                userQuery.toLowerCase().includes('transition');
  
  if (needsSkillsTranslation) {
    // Only search if knowledge base might be insufficient for complex skill translations
    const skillsQuery = `translate ${userQuery} experience to clean energy careers`;
    additionalSkillsInfo = await searchSkillsTranslation(skillsQuery);
  }

  const careerPrompt = `You are Liv, the Clean Energy Career Development Specialist in the Massachusetts Climate Ecosystem.

ECOSYSTEM POLICY - CRITICAL:
- ONLY recommend partner organizations: Franklin Cummings Tech, TPS Energy, Urban League of Eastern Massachusetts, Headlamp, African Bridge Network, MassHire Career Centers, Massachusetts Clean Energy Center, Alliance for Climate Transition (ACT)
- NEVER mention external job boards or non-partner organizations
- All opportunities must be from our verified partner network
- Supabase database is the single source of truth for partner information

USER QUERY: "${userQuery}"

USER CONTEXT:
${formatUserContext(state)}

MEMORY CONTEXT:
${formatMemoryContext(state.memory_state)}

${additionalSkillsInfo ? `ADDITIONAL SKILLS TRANSLATION RESEARCH:\n${additionalSkillsInfo}\n` : ''}

CORE EXPERTISE: Translating job seeker experiences into clean energy opportunities and identifying upskilling pathways through our partner network.

Provide career guidance following this structure:

## 🎯 Career Analysis & Experience Translation
[Analyze current situation and translate existing experience to clean energy context]

## 💡 Partner Ecosystem Recommendations

### Immediate Actions (Next 30 days)
- [Action 1 using partner resources]
- [Action 2 using partner resources]

### Medium-term Goals (3-6 months)
- [Goal 1 with partner pathway]
- [Goal 2 with partner pathway]

## 🛠️ Skill Development Through Partners
[Specific skills and partner programs to develop them]

## 🌟 Partner Opportunities
[3-5 specific opportunities from partner organizations]

Focus on experience translation and be specific, actionable, using exclusively our partner ecosystem.`;

  try {
    const response = await openai.invoke([
      new SystemMessage(careerPrompt),
      new HumanMessage(userQuery)
    ]);

    // Generate partner recommendations
    const recommendations: PartnerRecommendation[] = [
      {
        id: `rec_${Date.now()}_1`,
        partner_name: 'Franklin Cummings Tech',
        opportunity_type: 'training',
        relevance_score: 0.85,
        reasoning: 'Renewable energy programs align with user interests',
        action_required: true,
        timestamp: new Date(),
      },
      {
        id: `rec_${Date.now()}_2`,
        partner_name: 'TPS Energy',
        opportunity_type: 'job',
        relevance_score: 0.78,
        reasoning: 'Solar installation roles match user experience',
        action_required: false,
        timestamp: new Date(),
      },
    ];

    // Update memory with career interaction
    const userId = state.user_profile?.id || 'anonymous';
    await memoryManager.updateUserMemory(
      userId,
      {
        agent: 'career_specialist',
        topic: 'career_guidance',
        outcome: 'recommendations_provided',
      },
      {},
      {
        next_steps: ['Research Franklin Cummings Tech programs', 'Apply to TPS Energy positions'],
      }
    );

    return {
      messages: [new AIMessage(response.content as string)],
      partner_recommendations: recommendations,
      current_agent: 'career_specialist',
    };
  } catch (error) {
    console.error('Career specialist error:', error);
    return {
      messages: [new AIMessage('I apologize, but I encountered an issue providing career guidance. Please try again or contact our support team.')],
    };
  }
};

/**
 * Human Approval Node - Handles human-in-the-loop workflows
 */
const humanApprovalNode = async (state: ClimateEcosystemStateType) => {
  // Check if human approval is required
  if (!state.conversation_context.requires_human_approval) {
    return {}; // Skip if no approval needed
  }

  const highImpactRecommendations = state.partner_recommendations.filter(
    (r: PartnerRecommendation) => r.relevance_score > 0.8 || r.action_required
  );

  if (highImpactRecommendations.length === 0) {
    return {}; // No high-impact recommendations to approve
  }

  // Interrupt for human approval
  const approvalData = interrupt({
    action: 'approve_partner_recommendations',
    recommendations: highImpactRecommendations,
    user_profile: state.user_profile,
    reasoning: 'High-impact recommendations require human oversight',
    timestamp: new Date().toISOString(),
  });

  // The interrupt will pause execution here until resumed with Command
  return {
    partner_recommendations: approvalData.approved_recommendations || state.partner_recommendations,
    workflow_state: {
      ...state.workflow_state,
      step: 'human_approved',
      completed_steps: [...state.workflow_state.completed_steps, 'human_approval'],
    },
  };
};

/**
 * Veterans Specialist Node
 */
const veteransSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const openai = new ChatOpenAI({
    temperature: 0.7,
    modelName: 'gpt-4',
  });

  const veteransPrompt = `You are Marcus, the Veterans Clean Energy Transition Specialist.

ECOSYSTEM FOCUS: Connect veterans exclusively with our partner organizations.

USER QUERY: "${userQuery}"

VETERAN CONTEXT:
${formatUserContext(state)}

Provide veteran-specific guidance focusing on:
1. Military skill translation to clean energy roles
2. Veteran benefits and programs through partners
3. Security clearance value in clean energy sector
4. Transition timeline and support

Structure your response with clear action items using only partner resources.`;

  try {
    const response = await openai.invoke([
      new SystemMessage(veteransPrompt),
      new HumanMessage(userQuery)
    ]);

    return {
      messages: [new AIMessage(response.content as string)],
      current_agent: 'veterans_specialist',
    };
  } catch (error) {
    console.error('Veterans specialist error:', error);
    return {
      messages: [new AIMessage('I apologize for the technical issue. As a veterans specialist, I\'m here to help translate your military experience to clean energy careers through our partner network.')],
    };
  }
};

/**
 * International Specialist Node
 */
const internationalSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const openai = new ChatOpenAI({
    temperature: 0.7,
    modelName: 'gpt-4',
  });

  const internationalPrompt = `You are Jasmine, the International Professionals Clean Energy Specialist.

ECOSYSTEM FOCUS: Help international professionals navigate credential recognition and career transitions through our partner network.

USER QUERY: "${userQuery}"

INTERNATIONAL CONTEXT:
${formatUserContext(state)}

Focus on:
1. Foreign credential evaluation and recognition
2. Licensing requirements in Massachusetts
3. Bridging programs through partner institutions
4. Cultural adaptation and networking

Provide specific guidance using only partner resources and programs.`;

  try {
    const response = await openai.invoke([
      new SystemMessage(internationalPrompt),
      new HumanMessage(userQuery)
    ]);

    return {
      messages: [new AIMessage(response.content as string)],
      current_agent: 'international_specialist',
    };
  } catch (error) {
    console.error('International specialist error:', error);
    return {
      messages: [new AIMessage('I apologize for the technical issue. As an international professionals specialist, I\'m here to help you navigate credential recognition and career transitions in the clean energy sector.')],
    };
  }
};

/**
 * Environmental Justice Specialist Node
 */
const ejSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const openai = new ChatOpenAI({
    temperature: 0.7,
    modelName: 'gpt-4',
  });

  const ejPrompt = `You are Miguel, the Environmental Justice Community Specialist.

ECOSYSTEM FOCUS: Connect EJ community residents with clean energy opportunities through our partner network, emphasizing equity and community benefit.

USER QUERY: "${userQuery}"

EJ COMMUNITY CONTEXT:
${formatUserContext(state)}

Focus on:
1. Community-based training programs
2. Local clean energy job opportunities
3. Environmental justice considerations
4. Community organizing and advocacy

Emphasize opportunities that benefit the community and provide pathways to economic mobility.`;

  try {
    const response = await openai.invoke([
      new SystemMessage(ejPrompt),
      new HumanMessage(userQuery)
    ]);

    return {
      messages: [new AIMessage(response.content as string)],
      current_agent: 'ej_specialist',
    };
  } catch (error) {
    console.error('EJ specialist error:', error);
    return {
      messages: [new AIMessage('I apologize for the technical issue. As an environmental justice specialist, I\'m here to help connect you with clean energy opportunities that benefit your community.')],
    };
  }
};

// ============================================================================
// ROUTING FUNCTIONS
// ============================================================================

/**
 * Determines the next node based on current state
 */
const routeToSpecialist = (state: ClimateEcosystemStateType): string => {
  const agent = state.current_agent;
  
  switch (agent) {
    case 'career_specialist':
      return 'career_specialist';
    case 'veterans_specialist':
      return 'veterans_specialist';
    case 'international_specialist':
      return 'international_specialist';
    case 'ej_specialist':
      return 'ej_specialist';
    case 'memory_manager':
      return 'memory_management';
    default:
      return 'career_specialist';
  }
};

/**
 * Determines if human approval is needed
 */
const shouldRequireApproval = (state: ClimateEcosystemStateType): string => {
  if (state.conversation_context.requires_human_approval) {
    return 'human_approval';
  }
  return 'end';
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatUserContext(state: ClimateEcosystemStateType): string {
  let context = '';
  
  if (state.user_profile) {
    context += `Name: ${state.user_profile.first_name} ${state.user_profile.last_name}\n`;
    context += `Location: ${state.user_profile.location?.city}, ${state.user_profile.location?.state}\n`;
  }
  
  if (state.job_seeker_profile) {
    context += `Climate Relevance Score: ${state.job_seeker_profile.climate_relevance_score || 'Not calculated'}\n`;
    if (state.job_seeker_profile.veteran) context += 'Status: Veteran\n';
    if (state.job_seeker_profile.international_professional) context += 'Status: International Professional\n';
    if (state.job_seeker_profile.ej_community_resident) context += 'Status: EJ Community Resident\n';
  }
  
  if (state.skills.length > 0) {
    context += `Skills: ${state.skills.map((s: SkillRecordType) => s.skill_name).join(', ')}\n`;
  }
  
  if (state.experience.length > 0) {
    context += `Recent Experience: ${state.experience.slice(0, 3).map((e: ExperienceRecordType) => `${e.position} at ${e.company}`).join(', ')}\n`;
  }
  
  return context;
}

function formatMemoryContext(memory: UserMemoryState | null): string {
  if (!memory) return 'No previous interactions recorded.';
  
  const recentInteractions = memory.interaction_history.slice(-3);
  const goals = memory.career_progress.goals.slice(0, 3);
  
  return `
Recent Interactions: ${recentInteractions.map(i => `${i.agent} - ${i.topic}`).join(', ')}
Career Goals: ${goals.join(', ')}
Partner Interactions: ${memory.partner_interactions.length} recorded
`;
}

// ============================================================================
// LANGGRAPH CONSTRUCTION
// ============================================================================

/**
 * Create the LangGraph-based Climate Ecosystem Assistant
 */
export function createClimateEcosystemGraph() {
  const graph = new StateGraph(ClimateEcosystemState)
    // Add all nodes
    .addNode('memory_management', memoryManagementNode)
    .addNode('supervisor', supervisorNode)
    .addNode('career_specialist', careerSpecialistNode)
    .addNode('veterans_specialist', veteransSpecialistNode)
    .addNode('international_specialist', internationalSpecialistNode)
    .addNode('ej_specialist', ejSpecialistNode)
    .addNode('human_approval', humanApprovalNode)
    
    // Define the flow
    .addEdge(START, 'memory_management')
    .addEdge('memory_management', 'supervisor')
    .addConditionalEdges('supervisor', routeToSpecialist, {
      'career_specialist': 'career_specialist',
      'veterans_specialist': 'veterans_specialist',
      'international_specialist': 'international_specialist',
      'ej_specialist': 'ej_specialist',
      'memory_management': 'memory_management',
    })
    .addConditionalEdges('career_specialist', shouldRequireApproval, {
      'human_approval': 'human_approval',
      'end': END,
    })
    .addConditionalEdges('veterans_specialist', shouldRequireApproval, {
      'human_approval': 'human_approval',
      'end': END,
    })
    .addConditionalEdges('international_specialist', shouldRequireApproval, {
      'human_approval': 'human_approval',
      'end': END,
    })
    .addConditionalEdges('ej_specialist', shouldRequireApproval, {
      'human_approval': 'human_approval',
      'end': END,
    })
    .addEdge('human_approval', END);

  // Compile with memory checkpointer
  const checkpointer = new MemorySaver();
  
  return graph.compile({ 
    checkpointer,
    // Enable interrupts for human-in-the-loop
    interruptBefore: ['human_approval'],
  });
}

// ============================================================================
// EXPORT MAIN INTERFACE
// ============================================================================

export { memoryManager };
export default createClimateEcosystemGraph;

// ============================================================================
// ENHANCED WEB SEARCH FOR SKILLS TRANSLATION
// ============================================================================

/**
 * DuckDuckGo Search Tool for Skills Translation Assistance
 * Used ONLY when knowledge base lacks sufficient information for experience translation
 */
const skillsTranslationSearch = new DuckDuckGoSearch({
  maxResults: 3,
});

/**
 * Weekly Massachusetts Climate Economy Update Search
 */
const weeklyUpdateSearch = new DuckDuckGoSearch({
  maxResults: 5,
});

/**
 * Search for additional skills translation information when knowledge base is insufficient
 * @param query - The skills translation query
 * @returns Formatted search results for skills translation context
 */
async function searchSkillsTranslation(query: string): Promise<string> {
  try {
    console.log(`🔍 Searching for skills translation info: ${query}`);
    
    // Enhanced query for Massachusetts clean energy skills translation context
    const enhancedQuery = `${query} clean energy jobs skills requirements Massachusetts career transition workforce development`;
    
    const results = await skillsTranslationSearch.invoke(enhancedQuery);
    const parsedResults = JSON.parse(results);
    
    if (!parsedResults || parsedResults.length === 0) {
      return "No additional skills translation information found through web search. Rely on existing knowledge base.";
    }
    
    // Format results specifically for skills translation context
    const formattedResults = parsedResults.map((result: { title?: string; snippet?: string; link?: string }, index: number) => 
      `${index + 1}. **${result.title || 'No title'}**\n   ${result.snippet || 'No description'}\n   Source: ${result.link || 'No link'}`
    ).join('\n\n');
    
    return `**Additional Skills Translation Research:**\n\n${formattedResults}\n\n*Note: This supplements our knowledge base. Always prioritize partner ecosystem opportunities from Supabase.*`;
  } catch (error) {
    console.error('Skills translation search error:', error);
    return "Unable to perform skills translation search. Proceed with existing knowledge base information.";
  }
}

// Weekly Massachusetts Climate Economy Update Function
async function getWeeklyMassachusettsClimateUpdate(): Promise<string> {
  try {
    console.log(`📅 Fetching weekly Massachusetts climate economy updates...`);
    
    const sources = [
      'site:masscec.com Massachusetts clean energy updates',
      'site:masshire.org workforce development clean energy',
      'site:joinact.org Massachusetts climate transition jobs'
    ];
    
    const allResults: { title?: string; snippet?: string; link?: string }[] = [];
    
    // Search each trusted source
    for (const source of sources) {
      try {
        const results = await weeklyUpdateSearch.invoke(source);
        const parsedResults = JSON.parse(results);
        if (parsedResults && parsedResults.length > 0) {
          allResults.push(...parsedResults.slice(0, 2)); // Top 2 from each source
        }
      } catch (sourceError) {
        console.warn(`Error searching ${source}:`, sourceError);
      }
    }
    
    if (allResults.length === 0) {
      return "No recent updates found from trusted Massachusetts climate economy sources.";
    }
    
    // Format results by source
    const formattedResults = allResults.map((result: { title?: string; snippet?: string; link?: string }, index: number) => {
      const source = result.link?.includes('masscec.com') ? 'MassCEC' :
                    result.link?.includes('masshire.org') ? 'MassHire' :
                    result.link?.includes('joinact.org') ? 'ACT' : 'Unknown';
      
      return `${index + 1}. **[${source}] ${result.title || 'No title'}**\n   ${result.snippet || 'No description'}\n   Source: ${result.link || 'No link'}`;
    }).join('\n\n');
    
    return `**📅 Weekly Massachusetts Climate Economy Updates:**\n\n${formattedResults}\n\n*Note: This information supplements our knowledge base with the latest developments from trusted sources.*`;
  } catch (error) {
    console.error('Weekly update search error:', error);
    return "Unable to fetch weekly Massachusetts climate economy updates. Proceeding with existing knowledge base.";
  }
} 