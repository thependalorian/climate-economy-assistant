/**
 * LangGraph-Based Agent Response Function
 * 
 * This Supabase Edge Function implements the LangGraph framework for the Climate Ecosystem Assistant
 * with advanced memory management, state reducers, streaming, and human-in-the-loop capabilities.
 * 
 * Location: supabase/functions/langgraph-agent-response/index.ts
 */

// @ts-expect-error - Deno import compatibility
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { StateGraph, Annotation, messagesStateReducer, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { interrupt } from '@langchain/langgraph';

// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

interface PartnerRecommendation {
  id: string;
  partner_name: string;
  opportunity_type: 'job' | 'training' | 'networking' | 'resource';
  relevance_score: number;
  reasoning: string;
  action_required: boolean;
  timestamp: Date;
}

interface SkillGapAnalysis {
  userSkills: { skill_name: string; proficiency_level: string; }[];
  requiredSkills: string[];
  skillGaps: string[];
}

// ============================================================================
// LANGGRAPH STATE DEFINITION
// ============================================================================

const ClimateEcosystemState = Annotation.Root({
  // Message history with automatic management
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // User context
  user_id: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),

  // User profile data
  user_profile: Annotation<Record<string, unknown> | null>({
    reducer: (current, update) => update || current,
    default: () => null,
  }),

  // Job seeker profile
  job_seeker_profile: Annotation<Record<string, unknown> | null>({
    reducer: (current, update) => {
      if (!current) return update;
      if (!update) return current;
      return { ...current, ...update };
    },
    default: () => null,
  }),

  // Skills with deduplication
  skills: Annotation<Array<Record<string, unknown>>>({
    reducer: (current, update) => {
      const merged = [...current];
      update.forEach((newSkill: Record<string, unknown>) => {
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

  // Experience records
  experience: Annotation<Array<Record<string, unknown>>>({
    reducer: (current, update) => {
      const merged = [...current, ...update];
      return merged.sort((a, b) => 
        new Date(b.start_date as string).getTime() - new Date(a.start_date as string).getTime()
      );
    },
    default: () => [],
  }),

  // Education records
  education: Annotation<Array<Record<string, unknown>>>({
    reducer: (current, update) => {
      const merged = [...current, ...update];
      return merged.sort((a, b) => {
        const aDate = (a.end_date || a.start_date || '1900-01-01') as string;
        const bDate = (b.end_date || b.start_date || '1900-01-01') as string;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    },
    default: () => [],
  }),

  // Partner recommendations with smart deduplication
  partner_recommendations: Annotation<PartnerRecommendation[]>({
    reducer: (current, update) => {
      const merged = [...current];
      update.forEach(newRec => {
        const existingIndex = merged.findIndex(r => 
          r.partner_name === newRec.partner_name && 
          r.opportunity_type === newRec.opportunity_type
        );
        if (existingIndex >= 0) {
          if (newRec.relevance_score > merged[existingIndex].relevance_score) {
            merged[existingIndex] = newRec;
          }
        } else {
          merged.push(newRec);
        }
      });
      return merged
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 10);
    },
    default: () => [],
  }),

  // Memory state for persistence
  memory_state: Annotation<UserMemoryState | null>({
    reducer: (current, update) => {
      if (!current) return update;
      if (!update) return current;
      
      return {
        ...current,
        ...update,
        preferences: { ...current.preferences, ...update.preferences },
        interaction_history: [
          ...current.interaction_history,
          ...(update.interaction_history || [])
        ].slice(-50),
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
        ].slice(-20),
      };
    },
    default: () => null,
  }),

  // Current agent
  current_agent: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => 'supervisor',
  }),

  // Conversation context
  conversation_context: Annotation<{
    topic: string;
    complexity: 'simple' | 'moderate' | 'complex';
    requires_human_approval: boolean;
    partner_focus: string[];
  }>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      topic: 'general',
      complexity: 'simple',
      requires_human_approval: false,
      partner_focus: [],
    }),
  }),

  // Workflow state
  workflow_state: Annotation<{
    step: string;
    completed_steps: string[];
    next_actions: string[];
    awaiting_input: boolean;
  }>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      step: 'initial',
      completed_steps: [],
      next_actions: [],
      awaiting_input: false,
    }),
  }),
});

type ClimateEcosystemStateType = typeof ClimateEcosystemState.State;

// ============================================================================
// INITIALIZATION
// ============================================================================

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('VITE_SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new ChatOpenAI({
  apiKey: Deno.env.get('VITE_OPENAI_API_KEY'),
  temperature: 0.7,
  modelName: 'gpt-4'
});

// ============================================================================
// MEMORY MANAGER
// ============================================================================

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
    
    // Persist to Supabase for long-term storage
    try {
      await supabase
        .from('user_memory_state')
        .upsert({
          user_id: userId,
          memory_data: updated,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to persist memory to Supabase:', error);
    }

    return updated;
  }

  async getUserMemory(userId: string): Promise<UserMemoryState | null> {
    // Check in-memory first
    const cached = this.memoryStore.get(userId);
    if (cached) return cached;

    // Load from Supabase
    try {
      const { data, error } = await supabase
        .from('user_memory_state')
        .select('memory_data')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      const memoryState = data.memory_data as UserMemoryState;
      this.memoryStore.set(userId, memoryState);
      return memoryState;
    } catch (error) {
      console.error('Failed to load memory from Supabase:', error);
      return null;
    }
  }
}

const memoryManager = new MemoryManagerAgent();

// ============================================================================
// PARTNER ECOSYSTEM GUARDRAILS
// ============================================================================

const ECOSYSTEM_GUARDRAILS = {
  PARTNER_ONLY_POLICY: `
CRITICAL ECOSYSTEM POLICY - MUST FOLLOW:
- ONLY recommend organizations from our verified partner ecosystem
- NEVER mention external job boards, competitors, or non-partner organizations
- All opportunities must be from partner organizations only
- We operate as a closed-loop ecosystem connecting users exclusively to our partners
`,

  PARTNER_ORGANIZATIONS: [
    'Franklin Cummings Tech',
    'TPS Energy', 
    'Urban League of Eastern Massachusetts',
    'Headlamp',
    'African Bridge Network',
    'MassHire Career Centers',
    'Massachusetts Clean Energy Center',
    'Alliance for Climate Transition (ACT)'
  ],
};

// ============================================================================
// LANGGRAPH NODES
// ============================================================================

const memoryManagementNode = async (state: ClimateEcosystemStateType) => {
  const userId = state.user_id;
  if (!userId) return {};

  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage instanceof HumanMessage) {
    const memoryState = await memoryManager.updateUserMemory(
      userId,
      {
        agent: state.current_agent,
        topic: state.conversation_context.topic,
        outcome: 'user_query_received',
      }
    );

    return {
      memory_state: memoryState,
    };
  }

  return {};
};

const supervisorNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const analysisPrompt = `You are Pendo, the Climate Ecosystem Supervisor. Analyze this user query and determine the best approach.

USER QUERY: "${userQuery}"

USER CONTEXT:
- Profile: ${state.user_profile ? 'Complete' : 'Incomplete'}
- Skills: ${state.skills.length} recorded
- Experience: ${state.experience.length} positions
- Previous interactions: ${state.memory_state?.interaction_history.length || 0}

ANALYSIS REQUIRED:
1. Query complexity (simple/moderate/complex)
2. Best specialist agent (career/veterans/international/ej)
3. Whether human approval is needed for recommendations
4. Partner focus areas

Respond in JSON format:
{
  "complexity": "simple|moderate|complex",
  "recommended_agent": "career_specialist|veterans_specialist|international_specialist|ej_specialist",
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
    
    // Fallback routing
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

const careerSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  // Get real-time partner data from Supabase
  const partners = await getPartnerOrganizations();
  const trainingPrograms = await getPartnerPrograms(undefined, 'training');
  const jobOpportunities = await getJobOpportunities();
  
  // Analyze user's skill gaps if user ID is available
  let skillGapAnalysis: SkillGapAnalysis = { userSkills: [], requiredSkills: [], skillGaps: [] };
  if (state.user_id) {
    skillGapAnalysis = await getUserSkillGaps(state.user_id);
  }

  const careerPrompt = `You are Liv, the Clean Energy Career Development Specialist in the Massachusetts Climate Ecosystem.

CORE EXPERTISE: Translating job seeker experiences into clean energy opportunities and identifying upskilling pathways through our partner network.

${ECOSYSTEM_GUARDRAILS.PARTNER_ONLY_POLICY}

CURRENT PARTNER ORGANIZATIONS: ${partners.map(p => p.name).join(', ')}

AVAILABLE TRAINING PROGRAMS: ${trainingPrograms.map(p => `${p.partner_organizations?.name || 'Partner'}: ${p.title}`).join(', ')}

CURRENT JOB OPPORTUNITIES: ${jobOpportunities.slice(0, 5).map(j => `${j.partner_organizations?.name || 'Partner'}: ${j.title}`).join(', ')}

USER SKILL GAPS: ${skillGapAnalysis.skillGaps.join(', ') || 'Analysis pending'}

USER QUERY: "${userQuery}"

USER CONTEXT:
${formatUserContext(state)}

MEMORY CONTEXT:
${formatMemoryContext(state.memory_state)}

TRANSLATION APPROACH: Analyze the user's existing experience and identify transferable skills that apply to clean energy roles. For any skill gaps, recommend specific partner upskilling programs from the real data above.

Provide career guidance following this structure:

## 🔄 Experience Translation Analysis
[Translate existing experience into clean energy context - identify transferable skills, relevant achievements, and applicable knowledge]

## 📊 Skill Gap Assessment
[Identify specific skills needed for target clean energy roles vs. current capabilities - use real skill gap data above]

## 🎓 Partner Upskilling Pathway
[Specific partner programs to bridge skill gaps - use real training programs from above]

### Priority Skills Development:
- [Skill 1]: [Partner Program] at [Partner Organization]
- [Skill 2]: [Partner Program] at [Partner Organization]
- [Skill 3]: [Partner Program] at [Partner Organization]

## 💡 Partner Ecosystem Recommendations

### 🎯 High-Priority Matches (80%+ Match)
[Direct interview opportunities - we'll connect you with partners]

### 📋 Strong Matches (60-79% Match)  
[Apply directly on partner websites]

### 📚 Development Opportunities (40-59% Match)
[Skill development needed - partner training programs available]

## 🌟 Personalized Partner Opportunities

### 🎯 High-Priority Matches (80%+ Match)
[Direct interview opportunities - we'll connect you with partners]

### 📋 Strong Matches (60-79% Match)  
[Apply directly on partner websites]

### 📚 Development Opportunities (40-59% Match)
[Skill development needed - partner training programs available]

**Important**: All opportunities are from our verified partner ecosystem. For 80%+ matches, we'll facilitate direct partner connections for interviews, but you'll still need to complete their application process on their website.

Be specific, actionable, and focus exclusively on our partner ecosystem.`;

  try {
    const response = await openai.invoke([
      new SystemMessage(careerPrompt),
      new HumanMessage(userQuery)
    ]);

    // Generate personalized partner recommendations based on posted opportunities
    const recommendations: PartnerRecommendation[] = await generatePersonalizedPartnerRecommendations(
      state.user_id,
      state.skills,
      state.experience,
      userQuery
    );

    // Update memory
    if (state.user_id) {
      await memoryManager.updateUserMemory(
        state.user_id,
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
    }

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

const veteransSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  // Get real-time partner data with veteran focus
  const partners = await getPartnerOrganizations();
  const veteranFriendlyPartners = partners.filter(p => p.veteran_friendly);
  const trainingPrograms = await getPartnerPrograms(undefined, 'training');
  const jobOpportunities = await getJobOpportunities();
  const veteranJobs = jobOpportunities.filter(j => j.partner_organizations?.veteran_friendly);
  
  // Analyze user's skill gaps if user ID is available
  let skillGapAnalysis: SkillGapAnalysis = { userSkills: [], requiredSkills: [], skillGaps: [] };
  if (state.user_id) {
    skillGapAnalysis = await getUserSkillGaps(state.user_id);
  }

  const veteransPrompt = `You are Marcus, the Veterans Clean Energy Transition Specialist.

CORE EXPERTISE: Translating military experience into clean energy careers and connecting veterans with partner upskilling programs.

${ECOSYSTEM_GUARDRAILS.PARTNER_ONLY_POLICY}

VETERAN-FRIENDLY PARTNERS: ${veteranFriendlyPartners.map(p => p.name).join(', ')}

VETERAN-FOCUSED TRAINING PROGRAMS: ${trainingPrograms.filter(p => p.gi_bill_approved || p.veteran_focused).map(p => `${p.partner_organizations?.name || 'Partner'}: ${p.title}`).join(', ')}

VETERAN JOB OPPORTUNITIES: ${veteranJobs.slice(0, 5).map(j => `${j.partner_organizations?.name || 'Partner'}: ${j.title}`).join(', ')}

USER SKILL GAPS: ${skillGapAnalysis.skillGaps.join(', ') || 'Analysis pending'}

USER QUERY: "${userQuery}"

VETERAN CONTEXT:
${formatUserContext(state)}

MILITARY EXPERIENCE TRANSLATION FOCUS:
1. **Leadership & Project Management** → Clean energy project coordination, team leadership
2. **Technical Systems** → Renewable energy systems, grid management, maintenance
3. **Logistics & Operations** → Supply chain management, energy distribution
4. **Security Clearance** → Government clean energy contracts, defense sector opportunities
5. **Discipline & Reliability** → Safety-critical roles, quality assurance

Provide veteran-specific guidance with:
## 🔄 Military Experience Translation
[Translate military skills to clean energy context]

## 🎓 Veteran Upskilling Pathway  
[Partner programs that accept GI Bill, veteran-friendly training]

## 💡 Partner Opportunities for Veterans
[Veteran hiring initiatives and security clearance opportunities]

Structure your response using only partner resources and emphasize skill translation.`;

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

const internationalSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  // Get real-time partner data with international focus
  const partners = await getPartnerOrganizations();
  const internationalFriendlyPartners = partners.filter(p => p.international_friendly);
  const trainingPrograms = await getPartnerPrograms(undefined, 'training');
  const jobOpportunities = await getJobOpportunities();
  const internationalJobs = jobOpportunities.filter(j => j.partner_organizations?.international_friendly);
  
  // Analyze user's skill gaps if user ID is available
  let skillGapAnalysis: SkillGapAnalysis = { userSkills: [], requiredSkills: [], skillGaps: [] };
  if (state.user_id) {
    skillGapAnalysis = await getUserSkillGaps(state.user_id);
  }

  const internationalPrompt = `You are Jasmine, the International Professionals Clean Energy Specialist.

CORE EXPERTISE: Translating international experience into US clean energy careers and connecting professionals with partner credential recognition and upskilling programs.

${ECOSYSTEM_GUARDRAILS.PARTNER_ONLY_POLICY}

INTERNATIONAL-FRIENDLY PARTNERS: ${internationalFriendlyPartners.map(p => p.name).join(', ')}

CREDENTIAL RECOGNITION PROGRAMS: ${trainingPrograms.filter(p => p.credential_recognition || p.international_focused).map(p => `${p.partner_organizations?.name || 'Partner'}: ${p.title}`).join(', ')}

INTERNATIONAL JOB OPPORTUNITIES: ${internationalJobs.slice(0, 5).map(j => `${j.partner_organizations?.name || 'Partner'}: ${j.title}`).join(', ')}

USER SKILL GAPS: ${skillGapAnalysis.skillGaps.join(', ') || 'Analysis pending'}

USER QUERY: "${userQuery}"

INTERNATIONAL CONTEXT:
${formatUserContext(state)}

INTERNATIONAL EXPERIENCE TRANSLATION FOCUS:
1. **Engineering/Technical Background** → US renewable energy systems, local codes/standards
2. **Project Management** → US clean energy project coordination, regulatory compliance
3. **Research/Academic** → Applied clean energy innovation, industry partnerships
4. **Business/Finance** → Clean energy financing, US market dynamics
5. **Language Skills** → Multicultural team leadership, international business development

Provide international professional guidance with:
## 🔄 International Experience Translation
[Translate international credentials and experience to US clean energy context]

## 🎓 Credential Recognition & Upskilling Pathway
[Partner programs for credential evaluation, bridging courses, US certifications]

## 💡 Partner Opportunities for International Professionals
[Multicultural organizations, international business opportunities]

Structure your response using only partner resources and emphasize credential translation.`;

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

const ejSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  // Get real-time partner data with community focus
  const partners = await getPartnerOrganizations('community_organization');
  const trainingPrograms = await getPartnerPrograms(undefined, 'training');
  const communityPrograms = trainingPrograms.filter(p => p.community_focused || p.environmental_justice);
  const jobOpportunities = await getJobOpportunities();
  const communityJobs = jobOpportunities.filter(j => j.environmental_justice || j.community_impact);
  
  // Analyze user's skill gaps if user ID is available
  let skillGapAnalysis: SkillGapAnalysis = { userSkills: [], requiredSkills: [], skillGaps: [] };
  if (state.user_id) {
    skillGapAnalysis = await getUserSkillGaps(state.user_id);
  }

  const ejPrompt = `You are Miguel, the Environmental Justice Community Specialist.

${ECOSYSTEM_GUARDRAILS.PARTNER_ONLY_POLICY}

COMMUNITY-FOCUSED PARTNERS: ${partners.map(p => p.name).join(', ')}

COMMUNITY TRAINING PROGRAMS: ${communityPrograms.map(p => `${p.partner_organizations?.name || 'Partner'}: ${p.title}`).join(', ')}

ENVIRONMENTAL JUSTICE JOB OPPORTUNITIES: ${communityJobs.slice(0, 5).map(j => `${j.partner_organizations?.name || 'Partner'}: ${j.title}`).join(', ')}

USER SKILL GAPS: ${skillGapAnalysis.skillGaps.join(', ') || 'Analysis pending'}

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

const humanApprovalNode = async (state: ClimateEcosystemStateType) => {
  if (!state.conversation_context.requires_human_approval) {
    return {};
  }

  const highImpactRecommendations = state.partner_recommendations.filter(
    r => r.relevance_score > 0.8 || r.action_required
  );

  if (highImpactRecommendations.length === 0) {
    return {};
  }

  // Interrupt for human approval
  const approvalData = interrupt({
    action: 'approve_partner_recommendations',
    recommendations: highImpactRecommendations,
    user_profile: state.user_profile,
    reasoning: 'High-impact recommendations require human oversight',
    timestamp: new Date().toISOString(),
  });

  return {
    partner_recommendations: approvalData.approved_recommendations || state.partner_recommendations,
    workflow_state: {
      ...state.workflow_state,
      step: 'human_approved',
      completed_steps: [...state.workflow_state.completed_steps, 'human_approval'],
    },
  };
};

// ============================================================================
// ROUTING FUNCTIONS
// ============================================================================

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
    default:
      return 'career_specialist';
  }
};

const shouldRequireApproval = (state: ClimateEcosystemStateType): string => {
  if (state.conversation_context.requires_human_approval) {
    return 'human_approval';
  }
  return 'end';
};

// ============================================================================
// AGENT TOOLS FOR SUPABASE DATA RETRIEVAL
// ============================================================================

async function getPartnerOrganizations(organizationType?: string, specialization?: string) {
  try {
    let query = supabase
      .from('partner_organizations')
      .select('*')
      .eq('active', true);

    if (organizationType) {
      query = query.eq('organization_type', organizationType);
    }

    if (specialization) {
      query = query.contains('specializations', [specialization]);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching partner organizations:', error);
    return [];
  }
}

async function getPartnerPrograms(partnerId?: string, programType?: string, skillsNeeded?: string[]) {
  try {
    let query = supabase
      .from('job_listings')
      .select(`
        *,
        partner_organizations!inner(
          id,
          name,
          organization_type,
          website_url,
          specializations
        )
      `)
      .eq('active', true);

    if (partnerId) {
      query = query.eq('partner_organization_id', partnerId);
    }

    if (programType) {
      query = query.eq('job_type', programType);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Filter by skills if provided
    if (skillsNeeded && skillsNeeded.length > 0) {
      return (data || []).filter(program => {
        const programSkills = (program.skills_taught || []).map((s: string) => s.toLowerCase());
        return skillsNeeded.some(skill => programSkills.includes(skill.toLowerCase()));
      });
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching partner programs:', error);
    return [];
  }
}

async function getJobOpportunities(partnerId?: string) {
  try {
    let query = supabase
      .from('job_listings')
      .select(`
        *,
        partner_organizations!inner(
          id,
          name,
          organization_type,
          website_url,
          veteran_friendly,
          international_friendly
        )
      `)
      .eq('active', true)
      .eq('job_type', 'job');

    if (partnerId) {
      query = query.eq('partner_organization_id', partnerId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching job opportunities:', error);
    return [];
  }
}

async function getUserSkillGaps(userId: string, targetJobId?: string): Promise<SkillGapAnalysis> {
  try {
    // Get user's current skills
    const { data: userSkills, error: skillsError } = await supabase
      .from('skill_records')
      .select('skill_name, proficiency_level')
      .eq('user_id', userId);

    if (skillsError) throw skillsError;

    // Get target job requirements if specified
    if (targetJobId) {
      const { data: jobData, error: jobError } = await supabase
        .from('job_listings')
        .select('required_skills, preferred_skills')
        .eq('id', targetJobId)
        .single();

      if (jobError) throw jobError;

      const userSkillNames = (userSkills || []).map(s => s.skill_name.toLowerCase());
      const requiredSkills = (jobData.required_skills || []).map((s: string) => s.toLowerCase());
      const skillGaps = requiredSkills.filter(skill => !userSkillNames.includes(skill));

      return {
        userSkills: userSkills || [],
        requiredSkills: jobData.required_skills || [],
        skillGaps
      };
    }

    return {
      userSkills: userSkills || [],
      requiredSkills: [],
      skillGaps: []
    };
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    return { userSkills: [], requiredSkills: [], skillGaps: [] };
  }
}

// ============================================================================
// PARTNER RECOMMENDATION ENGINE
// ============================================================================

async function generatePersonalizedPartnerRecommendations(
  userId: string,
  userSkills: unknown[],
  userExperience: unknown[],
  userQuery: string
): Promise<PartnerRecommendation[]> {
  try {
    // Use dynamic data retrieval functions
    const opportunities = await getJobOpportunities();
    const trainingPrograms = await getPartnerPrograms();
    const skillGapAnalysis = await getUserSkillGaps(userId);
    
    // Combine job opportunities and training programs
    const allOpportunities = [
      ...opportunities.map(opp => ({ ...opp, opportunity_type: 'job' })),
      ...trainingPrograms.map(prog => ({ ...prog, opportunity_type: 'training' }))
    ];

    if (!allOpportunities || allOpportunities.length === 0) {
      console.warn('No partner opportunities found');
      return [];
    }

    const recommendations: PartnerRecommendation[] = [];
    const skillNames = (userSkills as { skill_name?: string }[])
      .map(s => s.skill_name?.toLowerCase())
      .filter(Boolean) as string[];

    for (const opp of allOpportunities) {
      const requiredSkills = (opp.required_skills || opp.skills_taught || []).map((s: string) => s.toLowerCase());
      const matchingSkills = requiredSkills.filter(skill => skillNames.includes(skill));
      
      // Enhanced relevance calculation including skill gaps
      const skillMatchRatio = requiredSkills.length > 0 ? matchingSkills.length / requiredSkills.length : 0.5;
      const queryRelevance = userQuery.toLowerCase().includes(opp.title?.toLowerCase() || '') ? 0.2 : 0;
      
      // Bonus for addressing skill gaps
      const skillGapBonus = skillGapAnalysis.skillGaps.some(gap => 
        requiredSkills.includes(gap.toLowerCase())
      ) ? 0.1 : 0;
      
      const relevanceScore = Math.min(skillMatchRatio + queryRelevance + skillGapBonus, 1.0);

      // Only include recommendations with 40%+ relevance
      if (relevanceScore >= 0.4) {
        const actionRequired = relevanceScore >= 0.8; // 80%+ threshold for direct interview
        
        recommendations.push({
          id: `rec_${Date.now()}_${opp.id}`,
          partner_name: opp.partner_organizations?.name || 'Partner Organization',
          opportunity_type: opp.opportunity_type || (opp.job_type === 'training' ? 'training' : 'job'),
          relevance_score: relevanceScore,
          reasoning: actionRequired 
            ? `High match (${Math.round(relevanceScore * 100)}%)! We'll connect you directly with ${opp.partner_organizations?.name || 'this partner'} for an interview. Apply at: ${opp.partner_organizations?.website_url || 'partner website'}`
            : `${Math.round(relevanceScore * 100)}% match. Apply directly at ${opp.partner_organizations?.name || 'this partner'}: ${opp.partner_organizations?.website_url || 'partner website'}`,
          action_required: actionRequired,
          timestamp: new Date(),
        });
      }
    }

    // Sort by relevance score, prioritize high-match opportunities
    return recommendations
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5); // Top 5 recommendations

  } catch (error) {
    console.error('Error generating partner recommendations:', error);
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatUserContext(state: ClimateEcosystemStateType): string {
  let context = '';
  
  if (state.user_profile) {
    context += `Name: ${state.user_profile.first_name} ${state.user_profile.last_name}\n`;
    const location = state.user_profile.location as { city?: string; state?: string } | undefined;
    if (location) {
      context += `Location: ${location.city}, ${location.state}\n`;
    }
  }
  
  if (state.job_seeker_profile) {
    context += `Climate Relevance Score: ${state.job_seeker_profile.climate_relevance_score || 'Not calculated'}\n`;
    if (state.job_seeker_profile.veteran) context += 'Status: Veteran\n';
    if (state.job_seeker_profile.international_professional) context += 'Status: International Professional\n';
    if (state.job_seeker_profile.ej_community_resident) context += 'Status: EJ Community Resident\n';
  }
  
  if (state.skills.length > 0) {
    context += `Skills: ${state.skills.map((s) => s.skill_name).join(', ')}\n`;
  }
  
  if (state.experience.length > 0) {
    context += `Recent Experience: ${state.experience.slice(0, 3).map((e) => `${e.position} at ${e.company}`).join(', ')}\n`;
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

async function fetchUserContext(userId: string) {
  try {
    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch job seeker profile
    const { data: jobSeekerProfile } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch skills
    const { data: skills } = await supabase
      .from('skill_records')
      .select('*')
      .eq('user_id', userId);

    // Fetch experience
    const { data: experience } = await supabase
      .from('experience_records')
      .select('*')
      .eq('user_id', userId);

    // Fetch education
    const { data: education } = await supabase
      .from('education_records')
      .select('*')
      .eq('user_id', userId);

    return {
      user_profile: userProfile,
      job_seeker_profile: jobSeekerProfile,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return {
      user_profile: null,
      job_seeker_profile: null,
      skills: [],
      experience: [],
      education: [],
    };
  }
}

// ============================================================================
// LANGGRAPH CONSTRUCTION
// ============================================================================

function createClimateEcosystemGraph() {
  const graph = new StateGraph(ClimateEcosystemState)
    .addNode('memory_management', memoryManagementNode)
    .addNode('supervisor', supervisorNode)
    .addNode('career_specialist', careerSpecialistNode)
    .addNode('veterans_specialist', veteransSpecialistNode)
    .addNode('international_specialist', internationalSpecialistNode)
    .addNode('ej_specialist', ejSpecialistNode)
    .addNode('human_approval', humanApprovalNode)
    
    .addEdge(START, 'memory_management')
    .addEdge('memory_management', 'supervisor')
    .addConditionalEdges('supervisor', routeToSpecialist, {
      'career_specialist': 'career_specialist',
      'veterans_specialist': 'veterans_specialist',
      'international_specialist': 'international_specialist',
      'ej_specialist': 'ej_specialist',
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

  const checkpointer = new MemorySaver();
  
  return graph.compile({ 
    checkpointer,
    interruptBefore: ['human_approval'],
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, userId, threadId, streamMode = 'values' } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the graph
    const graph = createClimateEcosystemGraph();

    // Fetch user context
    const userContext = await fetchUserContext(userId);

    // Load user memory
    const userMemory = await memoryManager.getUserMemory(userId);

    // Prepare initial state
    const initialState = {
      messages: [new HumanMessage(message)],
      user_id: userId,
      ...userContext,
      memory_state: userMemory,
    };

    // Configure thread
    const config = {
      configurable: { 
        thread_id: threadId || `thread_${userId}_${Date.now()}`,
      },
    };

    // Handle streaming vs non-streaming
    if (streamMode === 'stream') {
      // Streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const streamResult = await graph.stream(initialState, {
              ...config,
              streamMode: ['values', 'updates'],
            });
            
            for await (const chunk of streamResult) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Regular response
      const result = await graph.invoke(initialState, config);
      
      // Extract the final AI message
      const aiMessages = result.messages.filter((msg: BaseMessage) => msg instanceof AIMessage);
      const finalMessage = aiMessages[aiMessages.length - 1];

      return new Response(
        JSON.stringify({
          response: finalMessage?.content || 'I apologize, but I encountered an issue processing your request.',
          agent: result.current_agent,
          recommendations: result.partner_recommendations || [],
          memory_updated: !!result.memory_state,
          workflow_state: result.workflow_state,
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('LangGraph agent error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 