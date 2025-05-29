/**
 * Career Specialist Subgraph
 * 
 * Dedicated subgraph for career guidance with private state management
 * and specialized memory for career-related interactions.
 */

import { StateGraph, Annotation, messagesStateReducer, START, END } from '@langchain/langgraph';
import { BaseMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

// Private state schema for career specialist
export const CareerSpecialistState = Annotation.Root({
  // Shared with parent
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  
  user_id: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),

  // Private to career specialist
  career_context: Annotation<{
    current_role?: string;
    target_role?: string;
    experience_level: 'entry' | 'mid' | 'senior' | 'executive';
    skills_assessment: Record<string, number>;
    career_goals: string[];
    barriers: string[];
    recommended_actions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      timeline: string;
      partner: string;
    }>;
  }>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      experience_level: 'entry',
      skills_assessment: {},
      career_goals: [],
      barriers: [],
      recommended_actions: [],
    }),
  }),

  partner_recommendations: Annotation<Array<{
    partner_name: string;
    opportunity_type: string;
    relevance_score: number;
    reasoning: string;
    next_steps: string[];
  }>>({
    reducer: (current, update) => {
      const merged = [...current];
      update.forEach(newRec => {
        const existingIndex = merged.findIndex(r => 
          r.partner_name === newRec.partner_name
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
        .slice(0, 5); // Keep top 5 for this specialist
    },
    default: () => [],
  }),
});

export type CareerSpecialistStateType = typeof CareerSpecialistState.State;

// Enhanced career analysis node
const careerAnalysisNode = async (state: CareerSpecialistStateType) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  // Analyze user query for career context
  const careerKeywords = {
    entry: ['new', 'starting', 'first job', 'graduate', 'entry level'],
    mid: ['experience', 'years', 'transition', 'change career'],
    senior: ['lead', 'manage', 'senior', 'advanced', 'director'],
    executive: ['executive', 'CEO', 'VP', 'president', 'C-level']
  };

  let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'entry';
  const lowerQuery = userQuery.toLowerCase();
  
  for (const [level, keywords] of Object.entries(careerKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      experienceLevel = level as typeof experienceLevel;
      break;
    }
  }

  // Extract career goals
  const goals: string[] = [];
  if (lowerQuery.includes('want to') || lowerQuery.includes('goal')) {
    // Simple goal extraction - could be enhanced with NLP
    goals.push('Transition to clean energy sector');
  }

  return {
    career_context: {
      experience_level: experienceLevel,
      career_goals: goals,
      barriers: [], // Will be populated by subsequent nodes
      recommended_actions: [],
    }
  };
};

// Partner matching node
const partnerMatchingNode = async () => {
  const recommendations = [
    {
      partner_name: 'Franklin Cummings Tech',
      opportunity_type: 'training',
      relevance_score: 95,
      reasoning: 'Excellent renewable energy training programs for career transitions',
      next_steps: [
        'Schedule info session',
        'Apply for solar installation certificate',
        'Explore financial aid options'
      ]
    },
    {
      partner_name: 'TPS Energy',
      opportunity_type: 'employment',
      relevance_score: 85,
      reasoning: 'Active hiring for solar installers and energy auditors',
      next_steps: [
        'Submit application online',
        'Prepare for technical interview',
        'Complete safety certification'
      ]
    }
  ];

  return { partner_recommendations: recommendations };
};

// Response generation node
const responseGenerationNode = async (state: CareerSpecialistStateType) => {
  const openai = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: 'gpt-4o-mini',
  });

  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery = lastMessage.content as string;

  const prompt = `You are Liv, the Enhanced Career Development Specialist.

CONTEXT:
- Experience Level: ${state.career_context.experience_level}
- Career Goals: ${state.career_context.career_goals.join(', ') || 'Not specified'}
- Top Partners: ${state.partner_recommendations.map(p => p.partner_name).join(', ')}

USER QUERY: "${userQuery}"

Provide personalized career guidance in this structure:

## 🎯 Career Analysis
[Based on experience level: ${state.career_context.experience_level}]

## 💡 Partner Recommendations
${state.partner_recommendations.map(rec => `
### ${rec.partner_name} - ${rec.opportunity_type}
**Relevance**: ${rec.relevance_score}%
**Why**: ${rec.reasoning}
**Next Steps**: ${rec.next_steps.join(', ')}
`).join('\n')}

## 📈 Action Plan
[Specific next steps with timeline]

Remember: Only recommend verified partner organizations.`;

  const response = await openai.invoke([new SystemMessage(prompt)]);
  
  return {
    messages: [new AIMessage(response.content as string)]
  };
};

// Route based on completion status
const shouldComplete = (state: CareerSpecialistStateType): string => {
  // If we have analysis and recommendations, generate response
  if (state.career_context.experience_level && state.partner_recommendations.length > 0) {
    return 'response_generation';
  }
  
  // If we have analysis but no recommendations, do partner matching
  if (state.career_context.experience_level) {
    return 'partner_matching';
  }
  
  // Otherwise, continue with analysis
  return 'career_analysis';
};

// Create the career specialist subgraph
export function createCareerSpecialistSubgraph() {
  const graph = new StateGraph(CareerSpecialistState)
    .addNode('career_analysis', careerAnalysisNode)
    .addNode('partner_matching', partnerMatchingNode)
    .addNode('response_generation', responseGenerationNode)
    
    .addEdge(START, 'career_analysis')
    .addConditionalEdges('career_analysis', shouldComplete, {
      'partner_matching': 'partner_matching',
      'response_generation': 'response_generation',
    })
    .addEdge('partner_matching', 'response_generation')
    .addEdge('response_generation', END);

  return graph.compile();
} 