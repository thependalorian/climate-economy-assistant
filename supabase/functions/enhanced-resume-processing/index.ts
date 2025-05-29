/**
 * Enhanced Resume Processing Function
 * 
 * Production-ready Supabase Edge Function for comprehensive resume analysis:
 * - Enhanced authentication and security
 * - Advanced resume parsing with climate focus
 * - Partner ecosystem matching with analytics
 * - Rate limiting and abuse prevention
 * - Error handling and graceful degradation
 * - Vercel deployment compatibility
 * 
 * Location: supabase/functions/enhanced-resume-processing/index.ts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StateGraph, Annotation, START, END } from 'https://esm.sh/@langchain/langgraph@0.2.34';
import { ChatOpenAI } from 'https://esm.sh/@langchain/openai@0.3.11';
import { 
  authMiddleware, 
  createSuccessResponse, 
  createErrorResponse,
  type RequestContext 
} from '../_shared/auth-middleware.ts';

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

interface EnhancedSkill {
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;
  climate_relevance: number;
  transferability_score: number;
  context: string;
  certification_recommended?: string;
  market_demand: 'low' | 'medium' | 'high' | 'critical';
}

interface EnhancedExperience {
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
}

interface PartnerMatch {
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
}

interface ClimateSkillsAnalysis {
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
}

// ============================================================================
// LANGGRAPH STATE DEFINITION
// ============================================================================

const EnhancedResumeProcessingState = Annotation.Root({
  // Core processing data
  user_id: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),

  resume_text: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),

  analysis_stage: Annotation<'parsing' | 'skill_analysis' | 'climate_scoring' | 'partner_matching' | 'final_report' | 'complete'>({
    reducer: (current, update) => update || current,
    default: () => 'parsing',
  }),

  // Enhanced extracted data with comprehensive analysis
  personal_info: Annotation<{
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  }>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),

  skills: Annotation<EnhancedSkill[]>({
    reducer: (current, update) => {
      const merged = [...current];
      update.forEach(newSkill => {
        const existingIndex = merged.findIndex(s => s.skill_name === newSkill.skill_name);
        if (existingIndex >= 0) {
          merged[existingIndex] = newSkill;
        } else {
          merged.push(newSkill);
        }
      });
      return merged.sort((a, b) => b.climate_relevance - a.climate_relevance);
    },
    default: () => [],
  }),

  experience: Annotation<EnhancedExperience[]>({
    reducer: (current, update) => {
      return [...current, ...update].sort((a, b) => b.climate_relevance - a.climate_relevance);
    },
    default: () => [],
  }),

  education: Annotation<Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_date?: string;
    climate_relevance: number;
    certifications: string[];
  }>>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Enhanced climate analysis
  climate_analysis: Annotation<ClimateSkillsAnalysis>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      overall_score: 0,
      category_scores: {
        renewable_energy: 0,
        energy_efficiency: 0,
        sustainability: 0,
        environmental_science: 0,
        green_building: 0,
        climate_policy: 0,
      },
      strengths: [],
      gaps: [],
      recommendations: [],
      career_pathway_suggestions: [],
    }),
  }),

  // Enhanced partner matching with detailed analytics
  partner_matches: Annotation<PartnerMatch[]>({
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
      return merged.sort((a, b) => b.success_probability - a.success_probability);
    },
    default: () => [],
  }),

  // Processing metadata and analytics
  processing_metadata: Annotation<{
    processing_times: Record<string, number>;
    errors: string[];
    quality_score: number;
    completeness_score: number;
    ai_confidence: number;
  }>({
    reducer: (current, update) => ({
      processing_times: { ...current.processing_times, ...update.processing_times || {} },
      errors: [...current.errors, ...update.errors || []],
      quality_score: update.quality_score || current.quality_score,
      completeness_score: update.completeness_score || current.completeness_score,
      ai_confidence: update.ai_confidence || current.ai_confidence,
    }),
    default: () => ({
      processing_times: {},
      errors: [],
      quality_score: 0,
      completeness_score: 0,
      ai_confidence: 0,
    }),
  }),
});

type EnhancedResumeProcessingStateType = typeof EnhancedResumeProcessingState.State;

// ============================================================================
// INITIALIZATION
// ============================================================================

const supabaseUrl = Deno.env.get('DATABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('DATABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new ChatOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  temperature: 0.3,
  modelName: 'gpt-4o',
  timeout: 45000,
  maxRetries: 2,
});

// ============================================================================
// ENHANCED PARTNER ECOSYSTEM CONFIGURATION
// ============================================================================

const ENHANCED_PARTNER_ECOSYSTEM = {
  ORGANIZATIONS: [
    {
      name: 'Franklin Cummings Tech',
      type: 'training_provider',
      specialties: ['renewable_energy', 'hvac', 'building_energy_management', 'solar_installation'],
      programs: ['Solar Installation Certificate', 'Energy Efficiency Specialist', 'HVAC Technician', 'Green Building Technology'],
      skill_requirements: ['electrical_work', 'mechanical_aptitude', 'problem_solving', 'safety_protocols'],
      contact: {
        email: 'admissions@fct.edu',
        phone: '(617) 423-4630',
        website: 'https://fct.edu',
        application_link: 'https://fct.edu/apply'
      },
      timeline: '2-18 months',
      success_factors: ['hands_on_experience', 'technical_aptitude', 'career_commitment'],
      priority_score: 9
    },
    {
      name: 'TPS Energy',
      type: 'employer',
      specialties: ['solar_installation', 'energy_efficiency', 'project_management', 'sales'],
      opportunities: ['Solar Installer', 'Energy Auditor', 'Project Coordinator', 'Sales Representative'],
      skill_requirements: ['technical_skills', 'customer_service', 'project_management', 'sales_experience'],
      contact: {
        email: 'careers@tpsenergy.com',
        website: 'https://tpsenergy.com/careers'
      },
      timeline: 'Immediate - 3 months',
      success_factors: ['relevant_experience', 'communication_skills', 'technical_knowledge'],
      priority_score: 8
    },
    {
      name: 'Urban League of Eastern Massachusetts',
      type: 'workforce_development',
      specialties: ['career_coaching', 'job_placement', 'skills_training', 'professional_development'],
      programs: ['Green Jobs Training', 'Career Readiness', 'Professional Development', 'Financial Literacy'],
      skill_requirements: ['motivation', 'basic_education', 'commitment_to_growth'],
      contact: {
        email: 'programs@ulem.org',
        phone: '(617) 442-4519',
        website: 'https://ulem.org'
      },
      timeline: '1-6 months',
      success_factors: ['motivation', 'consistency', 'openness_to_learning'],
      priority_score: 9
    },
    {
      name: 'Massachusetts Clean Energy Center',
      type: 'government_agency',
      specialties: ['clean_energy_incentives', 'workforce_training', 'industry_connections', 'policy'],
      programs: ['Clean Energy Internship Program', 'Workforce Development Grants', 'Industry Networking'],
      skill_requirements: ['education_background', 'professional_experience', 'massachusetts_residency'],
      contact: {
        email: 'info@masscec.com',
        website: 'https://masscec.com'
      },
      timeline: '3-12 months',
      success_factors: ['education_level', 'massachusetts_connection', 'industry_interest'],
      priority_score: 7
    }
  ],

  CLIMATE_SKILL_MAPPING: {
    'renewable_energy': ['solar', 'wind', 'hydroelectric', 'geothermal', 'biomass', 'clean energy'],
    'energy_efficiency': ['energy audit', 'weatherization', 'hvac', 'insulation', 'smart grid'],
    'sustainability': ['waste management', 'recycling', 'sustainable practices', 'carbon footprint'],
    'environmental_science': ['environmental monitoring', 'air quality', 'water quality', 'ecology'],
    'green_building': ['leed', 'green construction', 'sustainable building', 'energy modeling'],
    'climate_policy': ['environmental policy', 'climate change', 'regulatory compliance', 'sustainability planning']
  }
};

// ============================================================================
// ENHANCED PROCESSING NODES
// ============================================================================

const enhancedResumeParsingNode = async (state: EnhancedResumeProcessingStateType) => {
  const startTime = Date.now();
  
  try {
    const parsingPrompt = `Analyze this resume and extract detailed information. Focus on climate-relevant skills and experience.

RESUME TEXT:
${state.resume_text}

Extract and return JSON with the following structure:
{
  "personal_info": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string"
  },
  "raw_skills": ["array of skills mentioned"],
  "raw_experience": [
    {
      "company": "string",
      "position": "string", 
      "start_date": "string",
      "end_date": "string",
      "description": "string"
    }
  ],
  "raw_education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string", 
      "graduation_date": "string"
    }
  ],
  "quality_indicators": {
    "completeness": "number 0-100",
    "clarity": "number 0-100", 
    "relevance": "number 0-100"
  }
}

Focus on extracting complete, accurate information. If information is unclear, note it in the extraction.`;

    const response = await openai.invoke([{ role: 'user', content: parsingPrompt }]);
    const parsed = JSON.parse(response.content as string);

    const processingTime = Date.now() - startTime;

    return {
      personal_info: parsed.personal_info || {},
      analysis_stage: 'skill_analysis' as const,
      processing_metadata: {
        processing_times: { parsing: processingTime },
        errors: [],
        quality_score: parsed.quality_indicators?.clarity || 0,
        completeness_score: parsed.quality_indicators?.completeness || 0,
        ai_confidence: parsed.quality_indicators?.relevance || 0,
      },
      // Store raw data for next processing stage
      _raw_data: parsed
    };

  } catch (error) {
    console.error('Resume parsing error:', error);
    
    return {
      analysis_stage: 'skill_analysis' as const,
      processing_metadata: {
        processing_times: { parsing: Date.now() - startTime },
        errors: [`Parsing failed: ${error.message}`],
        quality_score: 0,
        completeness_score: 0,
        ai_confidence: 0,
      },
    };
  }
};

const enhancedSkillAnalysisNode = async (state: EnhancedResumeProcessingStateType) => {
  const startTime = Date.now();
  
  try {
    const skillAnalysisPrompt = `Analyze skills from this resume data and enhance them with climate relevance scoring.

CLIMATE SKILL CATEGORIES:
${Object.entries(ENHANCED_PARTNER_ECOSYSTEM.CLIMATE_SKILL_MAPPING)
  .map(([category, keywords]) => `${category}: ${keywords.join(', ')}`)
  .join('\n')}

RESUME DATA:
${JSON.stringify(state._raw_data, null, 2)}

For each skill found, provide detailed analysis in this JSON format:
{
  "enhanced_skills": [
    {
      "skill_name": "string",
      "proficiency_level": "beginner|intermediate|advanced|expert",
      "years_of_experience": "number",
      "climate_relevance": "number 0-100",
      "transferability_score": "number 0-100", 
      "context": "where this skill was demonstrated",
      "certification_recommended": "string or null",
      "market_demand": "low|medium|high|critical"
    }
  ]
}

Provide comprehensive analysis focusing on climate and clean energy relevance.`;

    const response = await openai.invoke([{ role: 'user', content: skillAnalysisPrompt }]);
    const analyzed = JSON.parse(response.content as string);

    const processingTime = Date.now() - startTime;

    return {
      skills: analyzed.enhanced_skills || [],
      analysis_stage: 'climate_scoring' as const,
      processing_metadata: {
        processing_times: { skill_analysis: processingTime },
        errors: [],
        ai_confidence: 85,
      },
    };

  } catch (error) {
    console.error('Skill analysis error:', error);
    
    return {
      analysis_stage: 'climate_scoring' as const,
      processing_metadata: {
        processing_times: { skill_analysis: Date.now() - startTime },
        errors: [`Skill analysis failed: ${error.message}`],
        ai_confidence: 0,
      },
    };
  }
};

const enhancedClmateScoringNode = async (state: EnhancedResumeProcessingStateType) => {
  const startTime = Date.now();
  
  try {
    const climateScoringPrompt = `Provide comprehensive climate skills analysis based on the extracted data.

SKILLS: ${JSON.stringify(state.skills, null, 2)}
EXPERIENCE: ${JSON.stringify(state.experience, null, 2)}
EDUCATION: ${JSON.stringify(state.education, null, 2)}

Provide detailed climate analysis in this JSON format:
{
  "climate_analysis": {
    "overall_score": "number 0-100",
    "category_scores": {
      "renewable_energy": "number 0-100",
      "energy_efficiency": "number 0-100", 
      "sustainability": "number 0-100",
      "environmental_science": "number 0-100",
      "green_building": "number 0-100",
      "climate_policy": "number 0-100"
    },
    "strengths": ["array of key strengths"],
    "gaps": ["array of identified gaps"],
    "recommendations": ["array of specific recommendations"],
    "career_pathway_suggestions": ["array of career paths"]
  }
}`;

    const response = await openai.invoke([{ role: 'user', content: climateScoringPrompt }]);
    const scored = JSON.parse(response.content as string);

    const processingTime = Date.now() - startTime;

    return {
      climate_analysis: scored.climate_analysis,
      analysis_stage: 'partner_matching' as const,
      processing_metadata: {
        processing_times: { climate_scoring: processingTime },
        ai_confidence: 90,
      },
    };

  } catch (error) {
    console.error('Climate scoring error:', error);
    
    return {
      analysis_stage: 'partner_matching' as const,
      processing_metadata: {
        processing_times: { climate_scoring: Date.now() - startTime },
        errors: [`Climate scoring failed: ${error.message}`],
        ai_confidence: 0,
      },
    };
  }
};

const enhancedPartnerMatchingNode = async (state: EnhancedResumeProcessingStateType) => {
  const startTime = Date.now();
  
  try {
    const partnerMatches: PartnerMatch[] = [];

    for (const partner of ENHANCED_PARTNER_ECOSYSTEM.ORGANIZATIONS) {
      const matchAnalysisPrompt = `Analyze compatibility between this resume profile and ${partner.name}.

PARTNER: ${JSON.stringify(partner, null, 2)}

RESUME PROFILE:
- Skills: ${JSON.stringify(state.skills, null, 2)}
- Climate Analysis: ${JSON.stringify(state.climate_analysis, null, 2)}

Provide detailed matching analysis in JSON format:
{
  "relevance_score": "number 0-100",
  "reasoning": "detailed explanation",
  "specific_opportunities": ["array of specific opportunities"],
  "requirements_gap": ["array of missing requirements"],
  "next_steps": ["array of actionable next steps"],
  "success_probability": "number 0-100"
}`;

      try {
        const response = await openai.invoke([{ role: 'user', content: matchAnalysisPrompt }]);
        const matchData = JSON.parse(response.content as string);

        if (matchData.relevance_score > 20) {
          partnerMatches.push({
            partner_name: partner.name,
            match_type: partner.type === 'employer' ? 'direct_hire' : 'training_program',
            relevance_score: matchData.relevance_score,
            reasoning: matchData.reasoning,
            specific_opportunities: matchData.specific_opportunities || [],
            requirements_gap: matchData.requirements_gap || [],
            next_steps: matchData.next_steps || [],
            contact_info: partner.contact,
            timeline: partner.timeline,
            success_probability: matchData.success_probability || 0,
          });
        }
      } catch (partnerError) {
        console.warn(`Partner matching failed for ${partner.name}:`, partnerError);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      partner_matches: partnerMatches,
      analysis_stage: 'complete' as const,
      processing_metadata: {
        processing_times: { partner_matching: processingTime },
        ai_confidence: 85,
      },
    };

  } catch (error) {
    console.error('Partner matching error:', error);
    
    return {
      analysis_stage: 'complete' as const,
      processing_metadata: {
        processing_times: { partner_matching: Date.now() - startTime },
        errors: [`Partner matching failed: ${error.message}`],
        ai_confidence: 0,
      },
    };
  }
};

// ============================================================================
// ANALYTICS AND PERSISTENCE
// ============================================================================

async function saveResumeAnalysisResults(
  context: RequestContext,
  state: EnhancedResumeProcessingStateType
) {
  try {
    const analysisResult = {
      user_id: context.user.id,
      personal_info: state.personal_info,
      skills_count: state.skills.length,
      experience_count: state.experience.length,
      education_count: state.education.length,
      climate_overall_score: state.climate_analysis.overall_score,
      climate_category_scores: state.climate_analysis.category_scores,
      partner_matches_count: state.partner_matches.length,
      top_partner_match: state.partner_matches[0]?.partner_name || null,
      processing_metadata: state.processing_metadata,
      created_at: new Date().toISOString(),
    };

    await supabase
      .from('resume_analysis_results')
      .insert(analysisResult);

    // Save individual partner matches for tracking
    if (state.partner_matches.length > 0) {
      const matches = state.partner_matches.map(match => ({
        user_id: context.user.id,
        partner_name: match.partner_name,
        match_type: match.match_type,
        relevance_score: match.relevance_score,
        success_probability: match.success_probability,
        created_at: new Date().toISOString(),
      }));

      await supabase
        .from('partner_match_results')
        .insert(matches);
    }

  } catch (error) {
    console.error('Failed to save resume analysis results:', error);
  }
}

// ============================================================================
// LANGGRAPH WORKFLOW CREATION
// ============================================================================

function createEnhancedResumeProcessingGraph() {
  const workflow = new StateGraph(EnhancedResumeProcessingState)
    .addNode('parsing', enhancedResumeParsingNode)
    .addNode('skill_analysis', enhancedSkillAnalysisNode)
    .addNode('climate_scoring', enhancedClmateScoringNode)
    .addNode('partner_matching', enhancedPartnerMatchingNode)
    .addEdge(START, 'parsing')
    .addEdge('parsing', 'skill_analysis')
    .addEdge('skill_analysis', 'climate_scoring')
    .addEdge('climate_scoring', 'partner_matching')
    .addEdge('partner_matching', END);

  return workflow.compile();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    // Apply authentication middleware
    const authResult = await authMiddleware(req, {
      requireAuth: true,
      allowedUserTypes: ['job_seeker'],
      requireProfileComplete: false,
      rateLimit: { windowMs: 300000, maxRequests: 5 }, // 5 requests per 5 minutes (resume processing is intensive)
    });

    if (!authResult.success) {
      return authResult.response!;
    }

    const context = authResult.context!;

    // Parse request body
    const processingRequest: ResumeProcessingRequest = await req.json();
    
    if (!processingRequest.resume_text || typeof processingRequest.resume_text !== 'string') {
      return createErrorResponse('Invalid resume text format', 400);
    }

    if (processingRequest.resume_text.length < 100) {
      return createErrorResponse('Resume text too short for meaningful analysis', 400);
    }

    if (processingRequest.resume_text.length > 50000) {
      return createErrorResponse('Resume text too long. Please limit to 50,000 characters', 400);
    }

    // Initialize processing state
    const initialState: Partial<EnhancedResumeProcessingStateType> = {
      user_id: context.user.id,
      resume_text: processingRequest.resume_text,
      analysis_stage: 'parsing',
    };

    // Create and run processing graph
    const processingGraph = createEnhancedResumeProcessingGraph();
    const result = await processingGraph.invoke(initialState);

    const totalProcessingTime = Date.now() - startTime;

    // Save results asynchronously
    saveResumeAnalysisResults(context, result);

    // Format comprehensive response
    const responseData = {
      analysis_id: `analysis_${Date.now()}_${context.user.id}`,
      personal_info: result.personal_info,
      skills: result.skills,
      experience: result.experience,
      education: result.education,
      climate_analysis: result.climate_analysis,
      partner_matches: result.partner_matches,
      summary: {
        skills_identified: result.skills.length,
        climate_overall_score: result.climate_analysis.overall_score,
        top_climate_categories: Object.entries(result.climate_analysis.category_scores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([category, score]) => ({ category, score })),
        partner_matches_found: result.partner_matches.length,
        recommended_next_steps: result.partner_matches
          .slice(0, 3)
          .map(match => ({
            partner: match.partner_name,
            action: match.next_steps[0],
            timeline: match.timeline,
            success_probability: match.success_probability
          })),
      },
      processing_metadata: {
        ...result.processing_metadata,
        total_processing_time_ms: totalProcessingTime,
        analysis_quality: result.processing_metadata.quality_score,
        ai_confidence: result.processing_metadata.ai_confidence,
      },
    };

    return createSuccessResponse(responseData, 200, {
      'X-Processing-Time': totalProcessingTime.toString(),
      'X-Skills-Found': result.skills.length.toString(),
      'X-Partner-Matches': result.partner_matches.length.toString(),
      'X-Climate-Score': result.climate_analysis.overall_score.toString(),
    });

  } catch (error) {
    console.error('Enhanced resume processing error:', error);
    
    return createErrorResponse(
      'Resume processing failed. Please try again with a different format.',
      500,
      {
        'X-Processing-Time': (Date.now() - startTime).toString(),
        'X-Error-Type': 'processing_error',
      }
    );
  }
}); 