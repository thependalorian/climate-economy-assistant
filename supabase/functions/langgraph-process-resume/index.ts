/**
 * LangGraph-Enhanced Resume Processing Function
 * 
 * This function uses LangGraph framework for sophisticated resume analysis
 * with memory integration, state management, and partner-focused recommendations.
 * 
 * Location: supabase/functions/langgraph-process-resume/index.ts
 */

// @ts-expect-error - Deno import compatibility
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StateGraph, Annotation, START, END } from 'https://esm.sh/@langchain/langgraph@0.2.34';
import { ChatOpenAI } from 'https://esm.sh/@langchain/openai@0.3.11';
import { MemorySaver } from 'https://esm.sh/@langchain/langgraph@0.2.34';

// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ResumeAnalysisState {
  user_id: string;
  resume_text: string;
  analysis_stage: 'initial' | 'parsing' | 'skill_extraction' | 'climate_scoring' | 'partner_matching' | 'complete';
  extracted_data: {
    personal_info: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    skills: Array<{
      skill_name: string;
      proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      years_of_experience?: number;
      climate_relevance: number;
      context: string;
    }>;
    experience: Array<{
      company: string;
      position: string;
      start_date: string;
      end_date?: string;
      description: string;
      climate_relevance: number;
      transferable_skills: string[];
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field_of_study: string;
      graduation_date?: string;
      climate_relevance: number;
    }>;
  };
  climate_analysis: {
    overall_score: number;
    reasoning: string;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };
  partner_matches: Array<{
    partner_name: string;
    match_type: 'job' | 'training' | 'networking';
    relevance_score: number;
    reasoning: string;
    specific_opportunities: string[];
  }>;
  processing_errors: string[];
  retry_count: number;
}

// ============================================================================
// LANGGRAPH STATE DEFINITION
// ============================================================================

const ResumeProcessingState = Annotation.Root({
  // Core state
  user_id: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),

  resume_text: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),

  analysis_stage: Annotation<ResumeAnalysisState['analysis_stage']>({
    reducer: (current, update) => update || current,
    default: () => 'initial',
  }),

  // Extracted data with intelligent merging
  extracted_data: Annotation<ResumeAnalysisState['extracted_data']>({
    reducer: (current, update) => {
      if (!current) return update;
      if (!update) return current;
      
      return {
        personal_info: { ...current.personal_info, ...update.personal_info },
        skills: [...current.skills, ...update.skills],
        experience: [...current.experience, ...update.experience],
        education: [...current.education, ...update.education],
      };
    },
    default: () => ({
      personal_info: {},
      skills: [],
      experience: [],
      education: [],
    }),
  }),

  // Climate analysis
  climate_analysis: Annotation<ResumeAnalysisState['climate_analysis']>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      overall_score: 0,
      reasoning: '',
      strengths: [],
      gaps: [],
      recommendations: [],
    }),
  }),

  // Partner matches with deduplication
  partner_matches: Annotation<ResumeAnalysisState['partner_matches']>({
    reducer: (current, update) => {
      const merged = [...current];
      update.forEach(newMatch => {
        const existingIndex = merged.findIndex(m => 
          m.partner_name === newMatch.partner_name && m.match_type === newMatch.match_type
        );
        if (existingIndex >= 0) {
          if (newMatch.relevance_score > merged[existingIndex].relevance_score) {
            merged[existingIndex] = newMatch;
          }
        } else {
          merged.push(newMatch);
        }
      });
      return merged.sort((a, b) => b.relevance_score - a.relevance_score);
    },
    default: () => [],
  }),

  // Error tracking
  processing_errors: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  retry_count: Annotation<number>({
    reducer: (current, update) => update || current,
    default: () => 0,
  }),
});

type ResumeProcessingStateType = typeof ResumeProcessingState.State;

// ============================================================================
// INITIALIZATION
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new ChatOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  temperature: 0.3,
  modelName: 'gpt-4'
});

// ============================================================================
// PARTNER ECOSYSTEM CONFIGURATION
// ============================================================================

const PARTNER_ECOSYSTEM = {
  ORGANIZATIONS: [
    {
      name: 'Franklin Cummings Tech',
      type: 'training_provider',
      specialties: ['renewable_energy', 'hvac', 'building_energy_management'],
      programs: ['Solar Installation Certificate', 'Energy Efficiency Specialist', 'HVAC Technician'],
    },
    {
      name: 'TPS Energy',
      type: 'employer',
      specialties: ['solar_installation', 'energy_efficiency', 'project_management'],
      opportunities: ['Solar Installer', 'Energy Auditor', 'Project Coordinator'],
    },
    {
      name: 'Urban League of Eastern Massachusetts',
      type: 'community_partner',
      specialties: ['workforce_development', 'career_counseling', 'job_placement'],
      services: ['Career Coaching', 'Job Placement', 'Skills Assessment'],
    },
    {
      name: 'MassHire Career Centers',
      type: 'government_partner',
      specialties: ['job_training', 'career_services', 'unemployment_support'],
      services: ['Career Counseling', 'Job Search Assistance', 'Training Programs'],
    },
    {
      name: 'Massachusetts Clean Energy Center',
      type: 'government_partner',
      specialties: ['clean_energy_development', 'workforce_training', 'industry_support'],
      programs: ['Clean Energy Internships', 'Workforce Development Grants'],
    },
  ],

  SKILL_MAPPINGS: {
    'electrical': ['solar_installation', 'wind_energy', 'energy_storage'],
    'construction': ['green_building', 'energy_efficiency', 'weatherization'],
    'engineering': ['renewable_energy_systems', 'energy_modeling', 'project_design'],
    'project_management': ['clean_energy_projects', 'sustainability_initiatives'],
    'sales': ['clean_energy_sales', 'energy_consulting'],
    'maintenance': ['renewable_energy_maintenance', 'energy_systems_operation'],
  },
};

// ============================================================================
// LANGGRAPH NODES
// ============================================================================

/**
 * Resume Parsing Node - Extracts structured data from resume text
 */
const resumeParsingNode = async (state: ResumeProcessingStateType) => {
  const parsingPrompt = `You are an expert resume parser specializing in clean energy careers. Extract structured information from this resume.

RESUME TEXT:
${state.resume_text}

Extract the following information in JSON format:
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string", 
    "location": "string"
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "start_date": "YYYY-MM-DD or YYYY-MM or YYYY",
      "end_date": "YYYY-MM-DD or YYYY-MM or YYYY or null",
      "description": "string",
      "key_achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "graduation_date": "YYYY-MM-DD or YYYY-MM or YYYY or null"
    }
  ],
  "skills": [
    {
      "skill_name": "string",
      "context": "where this skill was mentioned or used"
    }
  ]
}

Be thorough and accurate. If information is unclear or missing, use null values.`;

  try {
    const response = await openai.invoke([{ role: 'user', content: parsingPrompt }]);
    const extractedData = JSON.parse(response.content as string);

    return {
      analysis_stage: 'skill_extraction' as const,
      extracted_data: {
        personal_info: extractedData.personal_info || {},
        skills: extractedData.skills || [],
        experience: extractedData.experience || [],
        education: extractedData.education || [],
      },
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    return {
      processing_errors: [`Resume parsing failed: ${error.message}`],
      retry_count: state.retry_count + 1,
    };
  }
};

/**
 * Skill Analysis Node - Analyzes skills for climate relevance and proficiency
 */
const skillAnalysisNode = async (state: ResumeProcessingStateType) => {
  const skillPrompt = `You are a clean energy workforce specialist. Analyze these skills for climate relevance and assign proficiency levels.

SKILLS TO ANALYZE:
${JSON.stringify(state.extracted_data.skills, null, 2)}

EXPERIENCE CONTEXT:
${JSON.stringify(state.extracted_data.experience, null, 2)}

For each skill, provide:
{
  "analyzed_skills": [
    {
      "skill_name": "string",
      "proficiency_level": "beginner|intermediate|advanced|expert",
      "years_of_experience": number,
      "climate_relevance": number (1-10 scale),
      "context": "how this skill applies to clean energy",
      "transferable_to": ["list of clean energy applications"]
    }
  ]
}

Climate relevance scoring:
- 1-3: Not directly relevant but transferable
- 4-6: Somewhat relevant to clean energy
- 7-8: Highly relevant to clean energy
- 9-10: Core clean energy skill

Consider both direct clean energy experience and transferable skills from other industries.`;

  try {
    const response = await openai.invoke([{ role: 'user', content: skillPrompt }]);
    const analysis = JSON.parse(response.content as string);

    return {
      analysis_stage: 'climate_scoring' as const,
      extracted_data: {
        ...state.extracted_data,
        skills: analysis.analyzed_skills || [],
      },
    };
  } catch (error) {
    console.error('Skill analysis error:', error);
    return {
      processing_errors: [`Skill analysis failed: ${error.message}`],
      retry_count: state.retry_count + 1,
    };
  }
};

/**
 * Climate Scoring Node - Calculates overall climate relevance score
 */
const climateScoringNode = async (state: ResumeProcessingStateType) => {
  const scoringPrompt = `You are a climate career assessment specialist. Calculate an overall climate relevance score for this candidate.

CANDIDATE DATA:
Skills: ${JSON.stringify(state.extracted_data.skills, null, 2)}
Experience: ${JSON.stringify(state.extracted_data.experience, null, 2)}
Education: ${JSON.stringify(state.extracted_data.education, null, 2)}

Provide analysis in this format:
{
  "overall_score": number (0-100),
  "reasoning": "detailed explanation of the score",
  "strengths": ["list of climate-relevant strengths"],
  "gaps": ["list of areas for improvement"],
  "recommendations": ["specific recommendations for career development"],
  "experience_analysis": [
    {
      "company": "string",
      "position": "string", 
      "climate_relevance": number (1-10),
      "transferable_skills": ["skills that transfer to clean energy"]
    }
  ],
  "education_analysis": [
    {
      "degree": "string",
      "field_of_study": "string",
      "climate_relevance": number (1-10)
    }
  ]
}

Scoring criteria:
- Direct clean energy experience: High weight
- Transferable technical skills: Medium-high weight
- Relevant education: Medium weight
- Soft skills and leadership: Medium weight
- Industry knowledge: Medium weight`;

  try {
    const response = await openai.invoke([{ role: 'user', content: scoringPrompt }]);
    const analysis = JSON.parse(response.content as string);

    // Update experience and education with climate relevance scores
    const updatedExperience = state.extracted_data.experience.map((exp, index) => ({
      ...exp,
      climate_relevance: analysis.experience_analysis?.[index]?.climate_relevance || 1,
      transferable_skills: analysis.experience_analysis?.[index]?.transferable_skills || [],
    }));

    const updatedEducation = state.extracted_data.education.map((edu, index) => ({
      ...edu,
      climate_relevance: analysis.education_analysis?.[index]?.climate_relevance || 1,
    }));

    return {
      analysis_stage: 'partner_matching' as const,
      climate_analysis: {
        overall_score: analysis.overall_score || 0,
        reasoning: analysis.reasoning || '',
        strengths: analysis.strengths || [],
        gaps: analysis.gaps || [],
        recommendations: analysis.recommendations || [],
      },
      extracted_data: {
        ...state.extracted_data,
        experience: updatedExperience,
        education: updatedEducation,
      },
    };
  } catch (error) {
    console.error('Climate scoring error:', error);
    return {
      processing_errors: [`Climate scoring failed: ${error.message}`],
      retry_count: state.retry_count + 1,
    };
  }
};

/**
 * Partner Matching Node - Matches candidate with partner organizations
 */
const partnerMatchingNode = async (state: ResumeProcessingStateType) => {
  const matchingPrompt = `You are a partner ecosystem specialist. Match this candidate with our partner organizations based on their profile.

CANDIDATE PROFILE:
Climate Score: ${state.climate_analysis.overall_score}
Skills: ${JSON.stringify(state.extracted_data.skills, null, 2)}
Experience: ${JSON.stringify(state.extracted_data.experience, null, 2)}
Education: ${JSON.stringify(state.extracted_data.education, null, 2)}

PARTNER ECOSYSTEM:
${JSON.stringify(PARTNER_ECOSYSTEM.ORGANIZATIONS, null, 2)}

Provide matches in this format:
{
  "partner_matches": [
    {
      "partner_name": "string",
      "match_type": "job|training|networking",
      "relevance_score": number (0-100),
      "reasoning": "why this is a good match",
      "specific_opportunities": ["list of specific programs/jobs/services"],
      "next_steps": ["recommended actions for the candidate"],
      "timeline": "immediate|short_term|medium_term|long_term"
    }
  ]
}

Matching criteria:
- Skills alignment with partner specialties
- Experience level and partner opportunity levels
- Geographic considerations (Massachusetts focus)
- Career development stage
- Training needs vs. job readiness

Only recommend partners from our verified ecosystem. Focus on actionable opportunities.`;

  try {
    const response = await openai.invoke([{ role: 'user', content: matchingPrompt }]);
    const matches = JSON.parse(response.content as string);

    return {
      analysis_stage: 'complete' as const,
      partner_matches: matches.partner_matches || [],
    };
  } catch (error) {
    console.error('Partner matching error:', error);
    return {
      processing_errors: [`Partner matching failed: ${error.message}`],
      retry_count: state.retry_count + 1,
    };
  }
};

/**
 * Data Persistence Node - Saves analysis results to database
 */
const dataPersistenceNode = async (state: ResumeProcessingStateType) => {
  try {
    // Update job seeker profile with climate score
    await supabase
      .from('job_seeker_profiles')
      .update({
        climate_relevance_score: state.climate_analysis.overall_score,
        climate_relevance_explanation: state.climate_analysis.reasoning,
        resume_processed_at: new Date().toISOString(),
        resume_parsed: true,
      })
      .eq('id', state.user_id);

    // Insert skill records
    if (state.extracted_data.skills.length > 0) {
      const skillRecords = state.extracted_data.skills.map(skill => ({
        user_id: state.user_id,
        skill_name: skill.skill_name,
        proficiency_level: skill.proficiency_level,
        years_of_experience: skill.years_of_experience,
        climate_relevance: skill.climate_relevance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from('skill_records')
        .upsert(skillRecords, { onConflict: 'user_id,skill_name' });
    }

    // Insert experience records
    if (state.extracted_data.experience.length > 0) {
      const experienceRecords = state.extracted_data.experience.map(exp => ({
        user_id: state.user_id,
        company: exp.company,
        position: exp.position,
        description: exp.description,
        start_date: exp.start_date,
        end_date: exp.end_date,
        is_current: !exp.end_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from('experience_records')
        .upsert(experienceRecords, { onConflict: 'user_id,company,position' });
    }

    // Insert education records
    if (state.extracted_data.education.length > 0) {
      const educationRecords = state.extracted_data.education.map(edu => ({
        user_id: state.user_id,
        institution: edu.institution,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        end_date: edu.graduation_date,
        is_current: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from('education_records')
        .upsert(educationRecords, { onConflict: 'user_id,institution,degree' });
    }

    // Store complete analysis results
    await supabase
      .from('resume_analysis_results')
      .upsert({
        user_id: state.user_id,
        analysis_data: {
          climate_analysis: state.climate_analysis,
          partner_matches: state.partner_matches,
          extracted_data: state.extracted_data,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return {
      analysis_stage: 'complete' as const,
    };
  } catch (error) {
    console.error('Data persistence error:', error);
    return {
      processing_errors: [`Data persistence failed: ${error.message}`],
    };
  }
};

/**
 * Error Recovery Node - Handles retries and fallbacks
 */
const errorRecoveryNode = async (state: ResumeProcessingStateType) => {
  if (state.retry_count >= 3) {
    // Maximum retries reached, provide basic analysis
    return {
      analysis_stage: 'complete' as const,
      climate_analysis: {
        overall_score: 25, // Conservative default
        reasoning: 'Unable to complete full analysis due to processing errors. Manual review recommended.',
        strengths: ['Resume uploaded successfully'],
        gaps: ['Detailed analysis unavailable'],
        recommendations: ['Contact support for manual resume review'],
      },
      partner_matches: [
        {
          partner_name: 'MassHire Career Centers',
          match_type: 'networking' as const,
          relevance_score: 70,
          reasoning: 'General career services available for all job seekers',
          specific_opportunities: ['Career Counseling', 'Job Search Assistance'],
        },
      ],
    };
  }

  // Retry the failed stage
  return {
    retry_count: state.retry_count + 1,
  };
};

// ============================================================================
// ROUTING FUNCTIONS
// ============================================================================

const routeByStage = (state: ResumeProcessingStateType): string => {
  if (state.processing_errors.length > 0 && state.retry_count < 3) {
    return 'error_recovery';
  }

  switch (state.analysis_stage) {
    case 'initial':
      return 'resume_parsing';
    case 'parsing':
      return 'skill_analysis';
    case 'skill_extraction':
      return 'climate_scoring';
    case 'climate_scoring':
      return 'partner_matching';
    case 'partner_matching':
      return 'data_persistence';
    case 'complete':
      return 'end';
    default:
      return 'resume_parsing';
  }
};

const shouldRetry = (state: ResumeProcessingStateType): string => {
  if (state.processing_errors.length > 0 && state.retry_count < 3) {
    return 'error_recovery';
  }
  return 'end';
};

// ============================================================================
// LANGGRAPH CONSTRUCTION
// ============================================================================

function createResumeProcessingGraph() {
  const graph = new StateGraph(ResumeProcessingState)
    .addNode('resume_parsing', resumeParsingNode)
    .addNode('skill_analysis', skillAnalysisNode)
    .addNode('climate_scoring', climateScoringNode)
    .addNode('partner_matching', partnerMatchingNode)
    .addNode('data_persistence', dataPersistenceNode)
    .addNode('error_recovery', errorRecoveryNode)
    
    .addEdge(START, 'resume_parsing')
    .addConditionalEdges('resume_parsing', routeByStage, {
      'skill_analysis': 'skill_analysis',
      'error_recovery': 'error_recovery',
    })
    .addConditionalEdges('skill_analysis', routeByStage, {
      'climate_scoring': 'climate_scoring',
      'error_recovery': 'error_recovery',
    })
    .addConditionalEdges('climate_scoring', routeByStage, {
      'partner_matching': 'partner_matching',
      'error_recovery': 'error_recovery',
    })
    .addConditionalEdges('partner_matching', routeByStage, {
      'data_persistence': 'data_persistence',
      'error_recovery': 'error_recovery',
    })
    .addConditionalEdges('data_persistence', shouldRetry, {
      'error_recovery': 'error_recovery',
      'end': END,
    })
    .addConditionalEdges('error_recovery', routeByStage, {
      'resume_parsing': 'resume_parsing',
      'skill_analysis': 'skill_analysis',
      'climate_scoring': 'climate_scoring',
      'partner_matching': 'partner_matching',
      'data_persistence': 'data_persistence',
      'end': END,
    });

  const checkpointer = new MemorySaver();
  
  return graph.compile({ checkpointer });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { userId, resumeText, resumeUrl } = await req.json();

    if (!userId || (!resumeText && !resumeUrl)) {
      return new Response(
        JSON.stringify({ error: 'userId and either resumeText or resumeUrl are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If resumeUrl is provided, fetch the text (implementation depends on storage)
    let finalResumeText = resumeText;
    if (resumeUrl && !resumeText) {
      // TODO: Implement resume text extraction from URL
      // This would typically involve PDF parsing or text extraction
      finalResumeText = 'Resume text extraction from URL not implemented yet';
    }

    // Create the graph
    const graph = createResumeProcessingGraph();

    // Prepare initial state
    const initialState = {
      user_id: userId,
      resume_text: finalResumeText,
      analysis_stage: 'initial' as const,
    };

    // Configure processing
    const config = {
      configurable: { 
        thread_id: `resume_${userId}_${Date.now()}`,
      },
    };

    // Process the resume
    const result = await graph.invoke(initialState, config);

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        analysis_stage: result.analysis_stage,
        climate_analysis: result.climate_analysis,
        partner_matches: result.partner_matches,
        extracted_data: {
          skills_count: result.extracted_data.skills.length,
          experience_count: result.extracted_data.experience.length,
          education_count: result.extracted_data.education.length,
        },
        processing_errors: result.processing_errors,
        retry_count: result.retry_count,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Resume processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Resume processing failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 