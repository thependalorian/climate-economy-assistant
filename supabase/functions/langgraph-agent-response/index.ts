// @ts-nocheck
/**
 * LangGraph-Based Agent Response Function
 * 
 * This Supabase Edge Function implements the LangGraph framework for the Climate Ecosystem Assistant
 * with advanced memory management, state reducers, streaming, and human-in-the-loop capabilities.
 * 
 * Location: supabase/functions/langgraph-agent-response/index.ts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { StateGraph, Annotation, messagesStateReducer, START, END } from 'https://esm.sh/@langchain/langgraph@0.2.34';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from 'https://esm.sh/@langchain/core@0.3.15/messages';
import { ChatOpenAI } from 'https://esm.sh/@langchain/openai@0.3.11';

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PartnerRecommendation {
  id: string;
  partner_name: string;
  opportunity_type: 'job' | 'training' | 'networking' | 'resource';
  relevance_score: number;
  reasoning: string;
  action_required: boolean;
  timestamp: Date;
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

  // Current agent
  current_agent: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => 'supervisor',
  }),

  // Partner recommendations
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
});

type ClimateEcosystemStateType = typeof ClimateEcosystemState.State;

// ============================================================================
// INITIALIZATION
// ============================================================================

// Note: Supabase configuration available if needed for future analytics
// const supabaseUrl = Deno.env.get('DATABASE_URL') || '';
// const supabaseServiceKey = Deno.env.get('DATABASE_SERVICE_ROLE_KEY') || '';

const openai = new ChatOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  temperature: 0.7,
  modelName: 'gpt-4o-mini',
  timeout: 30000,
  maxRetries: 2,
});

// ============================================================================
// PARTNER ECOSYSTEM GUARDRAILS
// ============================================================================

const ECOSYSTEM_GUARDRAILS = {
  PARTNER_ONLY_POLICY: `
CRITICAL ECOSYSTEM POLICY - MUST FOLLOW:
- ONLY recommend organizations from our verified partner ecosystem
- NEVER mention external job boards, competitors, or non-partner organizations
- All opportunities must be from partner organizations only
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

const supervisorNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  // Simple routing logic based on keywords
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
};

const careerSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const careerPrompt = `You are Liv, the Clean Energy Career Development Specialist.

ECOSYSTEM POLICY - CRITICAL:
- ONLY recommend partner organizations: Franklin Cummings Tech, TPS Energy, Urban League of Eastern Massachusetts, Headlamp, African Bridge Network, MassHire Career Centers, Massachusetts Clean Energy Center, Alliance for Climate Transition (ACT)
- NEVER mention external job boards or non-partner organizations

USER QUERY: "${userQuery}"

Provide career guidance following this structure:

## 🎯 Career Analysis & Experience Translation
[Analyze current situation and translate existing experience to clean energy context]

## 💡 Partner Ecosystem Recommendations

### Immediate Actions (Next 30 days)
- Contact Franklin Cummings Tech for renewable energy training programs
- Apply to TPS Energy for solar installation opportunities

### Medium-term Goals (3-6 months)
- Complete certification through Massachusetts Clean Energy Center
- Network with Urban League of Eastern Massachusetts

## 🛠️ Skill Development Through Partners
[Specific skills and partner programs to develop them]

## 🌟 Partner Opportunities
[3-5 specific opportunities from partner organizations]

Focus on experience translation and be specific, actionable, using exclusively our partner ecosystem.`;

  try {
    console.log('🤖 Calling OpenAI for career specialist...');
    
    const response = await openai.invoke([
      new SystemMessage(careerPrompt),
      new HumanMessage(userQuery)
    ]);

    console.log('✅ OpenAI response received successfully');

    // Generate simple partner recommendations
    const recommendations: PartnerRecommendation[] = [];
    
    const queryLower = userQuery.toLowerCase();
    
    if (queryLower.includes('training') || queryLower.includes('education')) {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        partner_name: 'Franklin Cummings Tech',
        opportunity_type: 'training',
        relevance_score: 0.85,
        reasoning: 'Offers comprehensive renewable energy training programs',
        action_required: true,
        timestamp: new Date(),
      });
    }
    
    if (queryLower.includes('job') || queryLower.includes('work')) {
      recommendations.push({
        id: `rec_${Date.now()}_2`,
        partner_name: 'TPS Energy',
        opportunity_type: 'job',
        relevance_score: 0.78,
        reasoning: 'Solar installation and clean energy job opportunities',
        action_required: false,
        timestamp: new Date(),
      });
    }

    return {
      messages: [new AIMessage(response.content as string)],
      partner_recommendations: recommendations,
      current_agent: 'career_specialist',
    };
  } catch (error) {
    console.error('❌ Career specialist error:', error);
    
    return {
      messages: [new AIMessage('I apologize, but I encountered an issue providing career guidance. As a career specialist, I can help you explore clean energy opportunities through our partner network including Franklin Cummings Tech, TPS Energy, and Urban League of Eastern Massachusetts.')],
      current_agent: 'career_specialist',
    };
  }
};

const veteransSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const veteransPrompt = `You are Marcus, the Veterans Clean Energy Transition Specialist.

ECOSYSTEM POLICY - CRITICAL:
- ONLY recommend partner organizations: Franklin Cummings Tech, TPS Energy, Urban League of Eastern Massachusetts, Headlamp, African Bridge Network, MassHire Career Centers, Massachusetts Clean Energy Center, Alliance for Climate Transition (ACT)

USER QUERY: "${userQuery}"

MILITARY EXPERIENCE TRANSLATION FOCUS:
1. **Leadership & Project Management** → Clean energy project coordination
2. **Technical Systems** → Renewable energy systems, maintenance
3. **Logistics & Operations** → Supply chain management, energy distribution
4. **Security Clearance** → Government clean energy contracts
5. **Discipline & Reliability** → Safety-critical roles

Provide veteran-specific guidance with:
## 🔄 Military Experience Translation
## 🎓 Veteran Upskilling Pathway  
## 💡 Partner Opportunities for Veterans

Structure your response using only partner resources.`;

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
    console.error('❌ Veterans specialist error:', error);
    
    return {
      messages: [new AIMessage('I apologize for the technical issue. As a veterans specialist, I\'m here to help translate your military experience to clean energy careers through our partner network.')],
    };
  }
};

const internationalSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const internationalPrompt = `You are Jasmine, the International Professionals Clean Energy Specialist.

${ECOSYSTEM_GUARDRAILS.PARTNER_ONLY_POLICY}

USER QUERY: "${userQuery}"

INTERNATIONAL EXPERIENCE TRANSLATION FOCUS:
1. **Engineering/Technical Background** → US renewable energy systems
2. **Project Management** → US clean energy project coordination
3. **Research/Academic** → Applied clean energy innovation
4. **Business/Finance** → Clean energy financing, US market dynamics
5. **Language Skills** → Multicultural team leadership

Provide international professional guidance with:
## 🔄 International Experience Translation
## 🎓 Credential Recognition & Upskilling Pathway
## 💡 Partner Opportunities for International Professionals

Structure your response using only partner resources.`;

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
    console.error('❌ International specialist error:', error);
    
    return {
      messages: [new AIMessage('I apologize for the technical issue. As an international professionals specialist, I\'m here to help you navigate credential recognition and career transitions in the clean energy sector.')],
    };
  }
};

const ejSpecialistNode = async (state: ClimateEcosystemStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const ejPrompt = `You are Miguel, the Environmental Justice Community Specialist.

${ECOSYSTEM_GUARDRAILS.PARTNER_ONLY_POLICY}

USER QUERY: "${userQuery}"

Focus on:
1. Community-based training programs
2. Local clean energy job opportunities
3. Environmental justice considerations
4. Community organizing and advocacy

Emphasize opportunities that benefit the community and provide pathways to economic mobility through our partner network.`;

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
    console.error('❌ EJ specialist error:', error);
    
    return {
      messages: [new AIMessage('I apologize for the technical issue. As an environmental justice specialist, I\'m here to help connect you with clean energy opportunities that benefit your community.')],
    };
  }
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

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  console.log('🚀 LangGraph Agent Request Started');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      }
    });
  }

  try {
    const requestBody = await req.json();
    const { message, userId } = requestBody;
    // Note: threadId available in requestBody if needed for conversation tracking
    
    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Input validation passed');
    console.log('👤 User ID:', userId);
    console.log('💬 Message:', message);

    // Create initial state
    const initialState: ClimateEcosystemStateType = {
      messages: [new HumanMessage(message)],
      user_id: userId || '',
      current_agent: 'supervisor',
      partner_recommendations: [],
      conversation_context: {
        topic: 'general',
        complexity: 'simple',
        requires_human_approval: false,
        partner_focus: []
      }
    };

    console.log('✅ Initial state created');

    // Build and compile graph
    const graphBuilder = new StateGraph(ClimateEcosystemState)
      .addNode('supervisor', supervisorNode)
      .addNode('career_specialist', careerSpecialistNode)
      .addNode('veterans_specialist', veteransSpecialistNode)
      .addNode('international_specialist', internationalSpecialistNode)
      .addNode('ej_specialist', ejSpecialistNode)
      .addEdge(START, 'supervisor')
      .addConditionalEdges('supervisor', routeToSpecialist, {
        'career_specialist': 'career_specialist',
        'veterans_specialist': 'veterans_specialist',
        'international_specialist': 'international_specialist',
        'ej_specialist': 'ej_specialist',
      })
      .addEdge('career_specialist', END)
      .addEdge('veterans_specialist', END)
      .addEdge('international_specialist', END)
      .addEdge('ej_specialist', END);

    const compiledGraph = graphBuilder.compile();
    console.log('✅ Graph compiled successfully');

    // Execute graph
    console.log('🎯 Starting graph execution');
    const result = await compiledGraph.invoke(initialState);
    console.log('✅ Graph execution completed');

    // Format response
    const lastMessage = result.messages[result.messages.length - 1];
    const responseContent = lastMessage?.content || 'I apologize, but I was unable to generate a proper response.';

    console.log('📤 Sending successful response');

    return new Response(
      JSON.stringify({
        success: true,
        response: responseContent,
        agent: result.current_agent,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('🚨 Error in main handler:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        }
      }
    );
  }
}); 