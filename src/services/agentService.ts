import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * This service handles interactions with the AI agent system.
 * It uses LangChain, OpenAI, and a multi-agent architecture to generate
 * personalized responses for users.
 */

interface UserProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    zip: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface JobSeekerProfile {
  id?: string;
  highest_education?: string;
  years_of_experience?: string;
  skills?: string[];
  interests?: string[];
  preferred_job_types?: string[];
  preferred_work_environment?: string[];
  willing_to_relocate?: boolean;
  preferred_locations?: string[];
  salary_expectations?: {
    min: string;
    max: string;
    type: string;
  };
  resume_url?: string;
  resume_filename?: string;
  resume_parsed?: boolean;
  climate_relevance_score?: number;
  climate_relevance_explanation?: string;
  veteran?: boolean;
  international_professional?: boolean;
  ej_community_resident?: boolean;
  returning_citizen?: boolean;
}

interface Skill {
  id: string;
  user_id: string;
  name: string;
  proficiency: string;
  category: string;
  climate_relevance?: number;
}

interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  year?: string;
}

interface WorkExperience {
  id: string;
  user_id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
}

interface JobMatch {
  id: string;
  job_seeker_id: string;
  job_listing_id: string;
  match_score: number;
  match_reasons: string[];
  skill_gaps: string[];
  job_listing: {
    id: string;
    title: string;
    description?: string;
    location: string;
    job_type: string;
    required_skills?: string[];
    climate_sector?: string;
    company: {
      id?: string;
      name: string;
    };
  };
}

interface UserData {
  profile: UserProfile;
  jobSeekerProfile: JobSeekerProfile;
  skills: Skill[];
  education: Education[];
  workExperience: WorkExperience[];
  jobMatches: JobMatch[];
}

/**
 * Fetch user data from the database
 * @param userId The user ID
 * @returns A promise that resolves to the user's data
 */
const fetchUserData = async (userId: string): Promise<UserData> => {
  try {
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Fetch job seeker profile
    const { data: jobSeekerData, error: jobSeekerError } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (jobSeekerError && jobSeekerError.code !== 'PGRST116') {
      throw jobSeekerError;
    }

    // Fetch skills
    const { data: skillsData, error: skillsError } = await supabase
      .from('skill_records')
      .select('*')
      .eq('user_id', userId);

    if (skillsError) throw skillsError;

    // Fetch education
    const { data: educationData, error: educationError } = await supabase
      .from('education_records')
      .select('*')
      .eq('user_id', userId);

    if (educationError) throw educationError;

    // Fetch work experience
    const { data: experienceData, error: experienceError } = await supabase
      .from('experience_records')
      .select('*')
      .eq('user_id', userId);

    if (experienceError) throw experienceError;

    // For now, return empty job matches as we don't have this table yet
    const jobMatches: JobMatch[] = [];

    return {
      profile: profileData || {},
      jobSeekerProfile: jobSeekerData || {},
      skills: skillsData || [],
      education: educationData || [],
      workExperience: experienceData || [],
      jobMatches
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Process resume using LangGraph-based Supabase Edge Function
 * @param userId The user ID
 * @param resumeFile The resume file
 * @returns A promise that resolves to the processing result
 */
interface ResumeProcessingResult {
  success: boolean;
  error?: string;
  data?: {
    skills?: string[];
    experience?: string[];
    education?: string[];
    climate_score?: number;
  };
}

export const processResumeWithLangGraph = async (
  userId: string,
  resumeFile: File
): Promise<ResumeProcessingResult> => {
  try {
    // Convert file to base64
    const fileBuffer = await resumeFile.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Call LangGraph resume processing function
    const { data, error } = await supabase.functions.invoke('langgraph-process-resume', {
      body: {
        user_id: userId,
        resume_file: {
          name: resumeFile.name,
          type: resumeFile.type,
          size: resumeFile.size,
          content: base64File
        }
      }
    });

    if (error) {
      console.error('Error processing resume with LangGraph:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in processResumeWithLangGraph:', error);
    throw error;
  }
};

/**
 * Generate a response using LangGraph-based Supabase Edge Function
 * @param conversationId The conversation ID
 * @param userId The user ID
 * @param userMessage The user's message
 * @param streamCallback Optional callback for streaming responses
 * @returns A promise that resolves to the agent response
 */
interface AgentResponseResult {
  success: boolean;
  error?: string;
  response?: string;
  agent_name?: string;
  stream?: string[];
}

export const generateAgentResponseWithLangGraph = async (
  conversationId: string,
  userId: string,
  userMessage: string,
  streamCallback?: (chunk: string) => void
): Promise<AgentResponseResult> => {
  try {
    // Fetch conversation history
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Get more context for LangGraph

    if (messagesError) throw messagesError;

    // Format messages for LangGraph
    const messages = (messagesData || []).map(msg => ({
      role: msg.role,
      content: msg.content,
      agent_name: msg.agent_name
    }));

    // Add the current user message
    messages.push({
      role: 'user',
      content: userMessage,
      agent_name: undefined
    });

    // Call LangGraph agent response function
    const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
      body: {
        user_id: userId,
        conversation_id: conversationId,
        messages: messages,
        user_message: userMessage,
        stream: !!streamCallback
      }
    });

    if (error) {
      console.error('Error generating response with LangGraph:', error);
      throw error;
    }

    // If streaming was requested, handle the stream
    if (streamCallback && data.stream) {
      // Handle streaming response
      for (const chunk of data.stream) {
        streamCallback(chunk);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in generateAgentResponseWithLangGraph:', error);
    throw error;
  }
};

/**
 * Generate a response from the AI agent system using LangGraph
 * @param conversationId The conversation ID
 * @param userId The user ID
 * @param userMessage The user's message
 * @returns A promise that resolves when the response has been added to the conversation
 */
export const simulateAgentResponse = async (
  conversationId: string,
  userId: string,
  userMessage: string
): Promise<void> => {
  try {
    // Use LangGraph-based response generation
    const response = await generateAgentResponseWithLangGraph(
      conversationId,
      userId,
      userMessage
    );

    // The LangGraph function handles inserting the response into the database
    // So we don't need to do it here unless there's an error
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate response');
    }

  } catch (error) {
    console.error('Error generating agent response:', error);

    // Insert a fallback response
    await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'assistant',
          agent_name: 'error_handler',
          content: 'I apologize, but I encountered an error while processing your request. Please try again later.'
        }
      ]);
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateAgentResponseWithLangGraph instead
 */
export const generateResponse = async (message: string, userData: UserData): Promise<string> => {
  console.warn('generateResponse is deprecated. Use generateAgentResponseWithLangGraph instead.');
  
  // Fallback to simple response generation
  const lowerMessage = message.toLowerCase();
  const agentIntro = getAgentIntro(determineAgentType(message, userData), userData);

  if (lowerMessage.includes('resume') || lowerMessage.includes('skill')) {
    return `${agentIntro} I can help you analyze your resume and identify how your skills translate to clean energy careers. Would you like to upload your resume for analysis?`;
  } else if (lowerMessage.includes('veteran') || lowerMessage.includes('military')) {
    return `${agentIntro} I specialize in helping veterans translate their military experience to civilian clean energy careers. The skills you developed in the military are highly valued in the clean energy sector.`;
  } else if (lowerMessage.includes('international') || lowerMessage.includes('visa')) {
    return `${agentIntro} I specialize in helping international professionals navigate the U.S. clean energy job market, including credential recognition and visa considerations.`;
  } else if (lowerMessage.includes('community') || lowerMessage.includes('justice')) {
    return `${agentIntro} I focus on connecting residents of environmental justice communities with clean energy opportunities that benefit their communities.`;
  } else {
    const name = userData.profile.first_name || 'there';
    return `Hello ${name}! I'm your Climate Ecosystem Assistant powered by advanced AI. I can help you explore clean energy careers, analyze your resume, and provide personalized guidance. What would you like to know about today?`;
  }
};

/**
 * Determine agent type based on message content and user data
 */
const determineAgentType = (message: string, userData: UserData): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('resume') || lowerMessage.includes('career') || lowerMessage.includes('job')) {
    return 'career_specialist';
  } else if (lowerMessage.includes('veteran') || lowerMessage.includes('military') || userData.jobSeekerProfile.veteran) {
    return 'veterans_specialist';
  } else if (lowerMessage.includes('international') || lowerMessage.includes('visa') || userData.jobSeekerProfile.international_professional) {
    return 'international_specialist';
  } else if (lowerMessage.includes('community') || lowerMessage.includes('justice') || userData.jobSeekerProfile.ej_community_resident) {
    return 'ej_specialist';
  } else {
    return 'supervisor';
  }
};

/**
 * Get an introduction for a specific agent type
 */
const getAgentIntro = (agentType: string, userData: UserData): string => {
  const name = userData.profile.first_name || '';

  switch (agentType) {
    case 'career_specialist':
      return `[Liv - Career Specialist] ${name ? `Hi ${name}, ` : ''}`;
    case 'veterans_specialist':
      return `[Marcus - Veterans Specialist] ${name ? `Hi ${name}, ` : ''}`;
    case 'international_specialist':
      return `[Jasmine - International Specialist] ${name ? `Hi ${name}, ` : ''}`;
    case 'ej_specialist':
      return `[Miguel - Environmental Justice Specialist] ${name ? `Hi ${name}, ` : ''}`;
    default:
      return `[Pendo - Climate Assistant] ${name ? `Hi ${name}, ` : ''}`;
  }
};

export default {
  simulateAgentResponse,
  generateAgentResponseWithLangGraph,
  processResumeWithLangGraph,
  fetchUserData
};
