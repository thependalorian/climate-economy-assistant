import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles feedback collection and survey management
 * for the Climate Ecosystem Assistant platform.
 */

/**
 * Submit feedback from a user
 * @param userId The user ID (optional for anonymous feedback)
 * @param feedbackType The type of feedback
 * @param content The feedback content
 * @param rating Optional rating (1-5)
 * @param sourcePage The page where feedback was submitted
 * @returns A promise that resolves to the created feedback response
 */
export const submitFeedback = async (
  userId: string | null,
  feedbackType: 'general' | 'feature' | 'bug' | 'content' | 'other',
  content: string,
  rating?: number,
  sourcePage?: string
): Promise<models.FeedbackResponseType | null> => {
  try {
    const { data, error } = await supabase
      .from('feedback_responses')
      .insert([
        {
          user_id: userId,
          feedback_type: feedbackType,
          content,
          rating,
          source_page: sourcePage,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return null;
  }
};

/**
 * Get feedback responses with optional filters
 * @param filters Optional filters to apply
 * @param limit Maximum number of responses to return
 * @param offset Number of responses to skip (for pagination)
 * @returns A promise that resolves to an array of feedback responses
 */
export const getFeedbackResponses = async (
  filters: Record<string, unknown> = {},
  limit = 50,
  offset = 0
): Promise<models.FeedbackResponseType[]> => {
  try {
    let query = supabase
      .from('feedback_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.feedbackType) {
      query = query.eq('feedback_type', filters.feedbackType);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.sourcePage) {
      query = query.eq('source_page', filters.sourcePage);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(feedback => ({
      ...feedback,
      created_at: new Date(feedback.created_at)
    }));
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    return [];
  }
};

/**
 * Create a new survey
 * @param title The survey title
 * @param description The survey description
 * @param questions The survey questions
 * @returns A promise that resolves to the created survey
 */
export const createSurvey = async (
  title: string,
  description: string,
  questions: Omit<models.SurveyQuestionType, 'id' | 'survey_id'>[]
): Promise<models.SurveyType | null> => {
  try {
    // Create the survey
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .insert([
        {
          title,
          description,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (surveyError) throw surveyError;

    // Create the questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map((question, index) => ({
        survey_id: surveyData.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        required: question.required,
        order: index + 1
      }));

      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsToInsert)
        .select();

      if (questionsError) throw questionsError;

      return {
        ...surveyData,
        questions: questionsData || [],
        created_at: new Date(surveyData.created_at),
        updated_at: new Date(surveyData.updated_at)
      };
    }

    return {
      ...surveyData,
      questions: [],
      created_at: new Date(surveyData.created_at),
      updated_at: new Date(surveyData.updated_at)
    };
  } catch (error) {
    console.error('Error creating survey:', error);
    return null;
  }
};

/**
 * Get active surveys
 * @returns A promise that resolves to an array of active surveys
 */
export const getActiveSurveys = async (): Promise<models.SurveyType[]> => {
  try {
    const { data: surveysData, error: surveysError } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:survey_questions(*)
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (surveysError) throw surveysError;

    return (surveysData || []).map(survey => ({
      ...survey,
      questions: survey.questions || [],
      created_at: new Date(survey.created_at),
      updated_at: new Date(survey.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching active surveys:', error);
    return [];
  }
};

/**
 * Submit a survey response
 * @param surveyId The survey ID
 * @param userId The user ID (optional for anonymous responses)
 * @param responses The survey responses
 * @returns A promise that resolves to the created survey response
 */
export const submitSurveyResponse = async (
  surveyId: string,
  userId: string | null,
  responses: Record<string, unknown>
): Promise<models.SurveyResponseType | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([
        {
          survey_id: surveyId,
          user_id: userId,
          responses,
          completed: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return null;
  }
};

/**
 * Get survey responses for a specific survey
 * @param surveyId The survey ID
 * @param limit Maximum number of responses to return
 * @param offset Number of responses to skip (for pagination)
 * @returns A promise that resolves to an array of survey responses
 */
export const getSurveyResponses = async (
  surveyId: string,
  limit = 50,
  offset = 0
): Promise<models.SurveyResponseType[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(response => ({
      ...response,
      created_at: new Date(response.created_at)
    }));
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return [];
  }
};

export default {
  submitFeedback,
  getFeedbackResponses,
  createSurvey,
  getActiveSurveys,
  submitSurveyResponse,
  getSurveyResponses
};
