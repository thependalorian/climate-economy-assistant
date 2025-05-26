import { supabase } from '../lib/supabase';
import { generateAllRecommendations } from './recommendationService';

/**
 * This service handles resume processing and extraction of information.
 * It uses LangChain and OpenAI to analyze resumes and extract structured data.
 * In a production environment, this would be handled by a Supabase Edge Function.
 */

interface ResumeProcessingResult {
  success: boolean;
  message: string;
  data?: {
    climate_relevance_score: number;
    skills_extracted: number;
    experience_extracted: number;
    education_extracted: number;
  };
  error?: string;
}

/**
 * Process a resume and extract information from it
 * @param userId The user ID
 * @param resumeUrl The URL of the resume file
 * @returns A promise that resolves to the processing result
 */
export const processResume = async (
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _resumeUrl: string
): Promise<ResumeProcessingResult> => {
  // In a real application, this would download and process the resume file
  // using LangChain, OpenAI, and document loaders

  // For this simulation, we'll just wait a bit and then return simulated data
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Simulate extracted skills
    const skills = [
      { name: 'Solar Panel Installation', category: 'technical', climate_relevance: 9 },
      { name: 'Renewable Energy', category: 'domain', climate_relevance: 10 },
      { name: 'Project Management', category: 'soft', climate_relevance: 7 },
      { name: 'Electrical Engineering', category: 'technical', climate_relevance: 8 },
      { name: 'Energy Efficiency', category: 'domain', climate_relevance: 9 },
      { name: 'Data Analysis', category: 'technical', climate_relevance: 6 },
      { name: 'Communication', category: 'soft', climate_relevance: 5 },
      { name: 'AutoCAD', category: 'technical', climate_relevance: 7 },
      { name: 'Sustainability', category: 'domain', climate_relevance: 10 },
      { name: 'Team Leadership', category: 'soft', climate_relevance: 6 }
    ];

    // Simulate extracted work experience
    const experience = [
      {
        company: 'Green Energy Solutions',
        title: 'Solar Installation Technician',
        start_date: '2020-01',
        end_date: 'Present',
        description: 'Installed residential and commercial solar panel systems. Conducted site assessments and system designs. Managed a team of 3 junior technicians.'
      },
      {
        company: 'EcoTech Industries',
        title: 'Energy Efficiency Specialist',
        start_date: '2018-03',
        end_date: '2019-12',
        description: 'Performed energy audits for commercial buildings. Recommended and implemented energy-saving solutions. Reduced energy consumption by an average of 25% for clients.'
      },
      {
        company: 'BuildRight Construction',
        title: 'Electrical Apprentice',
        start_date: '2016-06',
        end_date: '2018-02',
        description: 'Assisted master electricians with residential and commercial electrical installations. Gained experience with renewable energy systems and energy-efficient lighting.'
      }
    ];

    // Simulate extracted education
    const education = [
      {
        institution: 'State University',
        degree: 'Bachelor of Science',
        field: 'Electrical Engineering',
        year: '2016'
      },
      {
        institution: 'Technical Community College',
        degree: 'Associate of Applied Science',
        field: 'Renewable Energy Technology',
        year: '2014'
      },
      {
        institution: 'Green Energy Institute',
        degree: 'Certificate',
        field: 'Solar PV Installation',
        year: '2018'
      }
    ];

    // Simulate climate relevance score
    const relevance = {
      score: 85,
      explanation: 'The candidate has strong experience in solar installation and energy efficiency, which are directly relevant to clean energy careers. Their educational background in electrical engineering and renewable energy technology provides a solid foundation for work in the climate economy. The technical skills in solar panel installation, renewable energy, and energy efficiency are highly valuable in this sector.'
    };

    // In a real application, we would store this data in Supabase
    // For this simulation, we'll just update the job_seeker_profile

    const { error: profileError } = await supabase
      .from('job_seeker_profiles')
      .update({
        climate_relevance_score: relevance.score,
        climate_relevance_explanation: relevance.explanation,
        resume_processed_at: new Date().toISOString(),
        resume_parsed: true
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Simulate storing skills
    // In a real application, we would delete existing skills and insert new ones

    // Simulate storing work experience
    // In a real application, we would delete existing experience and insert new ones

    // Simulate storing education
    // In a real application, we would delete existing education and insert new ones

    // Simulate generating job matches
    await simulateJobMatches(userId, skills, relevance.score);

    // Generate recommendations based on the processed resume
    try {
      await generateAllRecommendations(userId);
      console.log('Generated recommendations after resume processing');
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
      // Continue even if recommendation generation fails
    }

    return {
      success: true,
      message: 'Resume processed successfully',
      data: {
        climate_relevance_score: relevance.score,
        skills_extracted: skills.length,
        experience_extracted: experience.length,
        education_extracted: education.length
      }
    };
  } catch (error: unknown) {
    console.error('Error processing resume:', error);
    return {
      success: false,
      message: 'Error processing resume',
      error: error.message
    };
  }
};

/**
 * Simulate generating job matches based on resume data
 * @param userId The user ID
 * @param skills The extracted skills
 * @param relevanceScore The climate relevance score
 */
async function simulateJobMatches(
  userId: string,
  skills: Array<{ name: string; category: string; climate_relevance: number }>,
  relevanceScore: number
): Promise<void> {
  try {
    // Simulate job listings
    const jobs = [
      {
        id: '1',
        title: 'Solar Installation Technician',
        company: { organization_name: 'SunPower Solutions', logo_url: '' },
        location: 'Boston, MA',
        job_type: 'Full-time',
        salary_range: '$50,000 - $70,000',
        climate_sector: 'Solar Energy',
        required_skills: ['Solar Panel Installation', 'Electrical Engineering', 'AutoCAD'],
        preferred_skills: ['Project Management', 'Team Leadership']
      },
      {
        id: '2',
        title: 'Energy Efficiency Consultant',
        company: { organization_name: 'GreenBuild Consulting', logo_url: '' },
        location: 'Cambridge, MA',
        job_type: 'Full-time',
        salary_range: '$60,000 - $80,000',
        climate_sector: 'Energy Efficiency',
        required_skills: ['Energy Efficiency', 'Data Analysis', 'Communication'],
        preferred_skills: ['Sustainability', 'Project Management']
      },
      {
        id: '3',
        title: 'Renewable Energy Project Manager',
        company: { organization_name: 'Clean Future Energy', logo_url: '' },
        location: 'Somerville, MA',
        job_type: 'Full-time',
        salary_range: '$70,000 - $90,000',
        climate_sector: 'Renewable Energy',
        required_skills: ['Project Management', 'Renewable Energy', 'Team Leadership'],
        preferred_skills: ['Solar Panel Installation', 'Energy Efficiency']
      }
    ];

    // Calculate match scores
    const matches = [];
    const userSkillNames = skills.map(s => s.name.toLowerCase());

    for (const job of jobs) {
      const requiredSkills = job.required_skills.map(s => s.toLowerCase());
      const preferredSkills = job.preferred_skills?.map(s => s.toLowerCase()) || [];

      // Calculate skill match percentage
      const requiredMatches = requiredSkills.filter(s =>
        userSkillNames.includes(s.toLowerCase())
      );
      const preferredMatches = preferredSkills.filter(s =>
        userSkillNames.includes(s.toLowerCase())
      );

      // Weight required skills more heavily
      const requiredWeight = 0.7;
      const preferredWeight = 0.3;

      let skillScore = 0;
      if (requiredSkills.length > 0) {
        skillScore += (requiredMatches.length / requiredSkills.length) * requiredWeight;
      }

      if (preferredSkills.length > 0) {
        skillScore += (preferredMatches.length / preferredSkills.length) * preferredWeight;
      }

      // Adjust score based on climate relevance
      const relevanceAdjustment = relevanceScore / 100 * 0.2;
      const finalScore = Math.min(skillScore + relevanceAdjustment, 1);

      // Only include matches with score >= 0.6 (60%)
      if (finalScore >= 0.6) {
        matches.push({
          job_seeker_id: userId,
          job_listing_id: job.id,
          match_score: finalScore,
          match_reasons: [
            `Matched ${requiredMatches.length} of ${requiredSkills.length} required skills`,
            `Matched ${preferredMatches.length} of ${preferredSkills.length} preferred skills`,
            `Strong background in ${job.climate_sector}`
          ],
          skill_gaps: requiredSkills
            .filter(s => !userSkillNames.includes(s.toLowerCase()))
            .map(s => s)
        });
      }
    }

    // In a real application, we would store these matches in Supabase
    // For this simulation, we'll just log them
    console.log(`Generated ${matches.length} job matches for user ${userId}`);

    // Optionally, we could store these matches in Supabase for demonstration purposes
    if (matches.length > 0) {
      // First delete existing matches
      await supabase
        .from('job_matches')
        .delete()
        .eq('job_seeker_id', userId);

      // Then insert new matches
      const { error: matchError } = await supabase
        .from('job_matches')
        .insert(matches);

      if (matchError) console.error('Error storing job matches:', matchError);
    }
  } catch (error) {
    console.error('Error generating job matches:', error);
  }
}

export default {
  processResume
};
