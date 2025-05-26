/**
 * Partner Management Service
 * 
 * Specialized management tools for partner organizations:
 * - Partner verification and onboarding
 * - Partnership level management
 * - Job posting and candidate matching
 * - Training program management
 * - Partnership analytics and reporting
 */

import { supabase } from '../supabase';
import { logSecurityEvent } from '../security/userSecurity';
// Import types for future use
// import type { UnifiedPartnerProfile } from '../../types/unified';

export interface PartnerVerificationDocument {
  id: string;
  partnerId: string;
  documentType: 'business_license' | 'tax_id' | 'incorporation_docs' | 'insurance' | 'certifications';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: string;
  notes?: string;
}

export interface PartnershipBenefit {
  id: string;
  partnerId: string;
  benefitType: 'job_posting' | 'candidate_access' | 'training_programs' | 'analytics' | 'priority_support';
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  validUntil?: string;
  createdAt: string;
}

export interface JobPosting {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  requirements: string[];
  location: Record<string, unknown>;
  salaryRange?: { min: number; max: number; currency: string };
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  climateRelevance: number;
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface TrainingProgram {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  duration: string;
  format: 'online' | 'in_person' | 'hybrid';
  skillsOffered: string[];
  prerequisites: string[];
  capacity: number;
  enrolled: number;
  cost?: number;
  certificationOffered: boolean;
  status: 'draft' | 'active' | 'full' | 'completed';
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface PartnerAnalytics {
  totalJobPostings: number;
  activeJobPostings: number;
  totalApplications: number;
  hiredCandidates: number;
  trainingPrograms: number;
  trainedCandidates: number;
  partnershipLevel: string;
  verificationStatus: string;
  profileViews: number;
  lastActivity: string;
  climateImpactScore: number;
}

/**
 * Get comprehensive partner profile with analytics
 */
export async function getPartnerProfile(
  partnerId: string,
  requestingUserId: string
): Promise<{ success: boolean; profile?: Record<string, unknown>; analytics?: PartnerAnalytics; error?: string }> {
  try {
    // Get partner profile with related data
    const { data: profile, error } = await supabase
      .from('partner_profiles')
      .select(`
        *,
        user_profiles(*)
      `)
      .eq('id', partnerId)
      .single();

    if (error || !profile) {
      return { success: false, error: 'Partner profile not found' };
    }

    // Calculate analytics
    const analytics = await calculatePartnerAnalytics(partnerId);

    // Log profile access
    await logSecurityEvent(
      requestingUserId,
      'profile_viewed',
      '127.0.0.1',
      'Partner Management',
      { targetPartnerId: partnerId },
      'low'
    );

    return { success: true, profile, analytics };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Submit partner verification documents
 */
export async function submitVerificationDocument(
  partnerId: string,
  documentType: PartnerVerificationDocument['documentType'],
  documentUrl: string,
  submittedBy: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const document: Omit<PartnerVerificationDocument, 'id'> = {
      partnerId,
      documentType,
      documentUrl,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('partner_verification_documents')
      .insert(document)
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log document submission
    await logSecurityEvent(
      submittedBy,
      'profile_updated',
      '127.0.0.1',
      'Partner Management',
      { 
        action: 'verification_document_submitted',
        partnerId,
        documentType
      },
      'low'
    );

    return { success: true, documentId: data.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Review partner verification document
 */
export async function reviewVerificationDocument(
  documentId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('partner_verification_documents')
      .update({
        status,
        reviewedBy,
        reviewDate: new Date().toISOString(),
        notes
      })
      .eq('id', documentId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if all required documents are approved
    const { data: document } = await supabase
      .from('partner_verification_documents')
      .select('partnerId')
      .eq('id', documentId)
      .single();

    if (document && status === 'approved') {
      await checkPartnerVerificationComplete(document.partnerId);
    }

    // Log document review
    await logSecurityEvent(
      reviewedBy,
      'profile_updated',
      '127.0.0.1',
      'Partner Management',
      { 
        action: 'verification_document_reviewed',
        documentId,
        status,
        notes
      },
      'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Update partnership level and benefits
 */
export async function updatePartnershipLevel(
  partnerId: string,
  newLevel: 'basic' | 'standard' | 'premium' | 'enterprise',
  updatedBy: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update partnership level
    const { error } = await supabase
      .from('partner_profiles')
      .update({
        partnership_level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update partnership benefits based on level
    await updatePartnershipBenefits(partnerId, newLevel);

    // Log partnership level change
    await logSecurityEvent(
      updatedBy,
      'profile_updated',
      '127.0.0.1',
      'Partner Management',
      { 
        action: 'partnership_level_updated',
        partnerId,
        newLevel,
        reason
      },
      'medium'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Create job posting
 */
export async function createJobPosting(
  partnerId: string,
  jobData: Omit<JobPosting, 'id' | 'partnerId' | 'applicationsCount' | 'viewsCount' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const job: Omit<JobPosting, 'id'> = {
      ...jobData,
      partnerId,
      applicationsCount: 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('job_postings')
      .insert(job)
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log job posting creation
    await logSecurityEvent(
      createdBy,
      'profile_updated',
      '127.0.0.1',
      'Partner Management',
      { 
        action: 'job_posting_created',
        partnerId,
        jobId: data.id,
        title: jobData.title
      },
      'low'
    );

    return { success: true, jobId: data.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Create training program
 */
export async function createTrainingProgram(
  partnerId: string,
  programData: Omit<TrainingProgram, 'id' | 'partnerId' | 'enrolled' | 'createdAt'>,
  createdBy: string
): Promise<{ success: boolean; programId?: string; error?: string }> {
  try {
    const program: Omit<TrainingProgram, 'id'> = {
      ...programData,
      partnerId,
      enrolled: 0,
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('training_programs')
      .insert(program)
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log training program creation
    await logSecurityEvent(
      createdBy,
      'profile_updated',
      '127.0.0.1',
      'Partner Management',
      { 
        action: 'training_program_created',
        partnerId,
        programId: data.id,
        title: programData.title
      },
      'low'
    );

    return { success: true, programId: data.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get partners with advanced filtering
 */
export async function getPartners(
  filters: {
    organizationType?: string;
    partnershipLevel?: string;
    verified?: boolean;
    climateRelevanceMin?: number;
    location?: string;
    hasActiveJobs?: boolean;
  } = {},
  page: number = 1,
  limit: number = 50
): Promise<{ success: boolean; partners?: Record<string, unknown>[]; total?: number; error?: string }> {
  try {
    let query = supabase
      .from('partner_profiles')
      .select(`
        *,
        user_profiles(*)
      `);

    // Apply filters
    if (filters.organizationType) {
      query = query.eq('organization_type', filters.organizationType);
    }

    if (filters.partnershipLevel) {
      query = query.eq('partnership_level', filters.partnershipLevel);
    }

    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }

    // Get total count
    const countQuery = supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true });
    
    // Apply same filters for count
    if (filters.organizationType) {
      countQuery.eq('organization_type', filters.organizationType);
    }
    if (filters.partnershipLevel) {
      countQuery.eq('partnership_level', filters.partnershipLevel);
    }
    if (filters.verified !== undefined) {
      countQuery.eq('verified', filters.verified);
    }
    
    const { count } = await countQuery;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: partners, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, partners: partners || [], total: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Helper functions

/**
 * Check if partner verification is complete
 */
async function checkPartnerVerificationComplete(partnerId: string): Promise<void> {
  const requiredDocuments = ['business_license', 'tax_id'];
  
  const { data: documents } = await supabase
    .from('partner_verification_documents')
    .select('documentType, status')
    .eq('partnerId', partnerId)
    .in('documentType', requiredDocuments);

  const approvedDocs = documents?.filter(d => d.status === 'approved') || [];
  
  if (approvedDocs.length >= requiredDocuments.length) {
    // Mark partner as verified
    await supabase
      .from('partner_profiles')
      .update({ verified: true })
      .eq('id', partnerId);
  }
}

/**
 * Update partnership benefits based on level
 */
async function updatePartnershipBenefits(partnerId: string, level: string): Promise<void> {
  const benefitLimits: Record<string, Record<string, number>> = {
    basic: { job_posting: 5, candidate_access: 10 },
    standard: { job_posting: 20, candidate_access: 50, training_programs: 2 },
    premium: { job_posting: 100, candidate_access: 200, training_programs: 10, analytics: 1 },
    enterprise: { job_posting: -1, candidate_access: -1, training_programs: -1, analytics: 1, priority_support: 1 }
  };

  const benefits = benefitLimits[level] || {};

  for (const [benefitType, limit] of Object.entries(benefits)) {
    await supabase
      .from('partnership_benefits')
      .upsert({
        partnerId,
        benefitType,
        isActive: true,
        usageLimit: limit === -1 ? null : limit,
        usageCount: 0,
        createdAt: new Date().toISOString()
      });
  }
}

/**
 * Calculate partner analytics
 */
async function calculatePartnerAnalytics(partnerId: string): Promise<PartnerAnalytics> {
  try {
    // Get partner profile
    const { data: profile } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('id', partnerId)
      .single();

    // Get job postings stats
    const { data: jobPostings } = await supabase
      .from('job_postings')
      .select('status, applicationsCount')
      .eq('partnerId', partnerId);

    const totalJobPostings = jobPostings?.length || 0;
    const activeJobPostings = jobPostings?.filter(j => j.status === 'active').length || 0;
    const totalApplications = jobPostings?.reduce((sum, job) => sum + (job.applicationsCount || 0), 0) || 0;

    // Get training programs stats
    const { data: trainingPrograms } = await supabase
      .from('training_programs')
      .select('enrolled')
      .eq('partnerId', partnerId);

    const totalTrainingPrograms = trainingPrograms?.length || 0;
    const trainedCandidates = trainingPrograms?.reduce((sum, program) => sum + (program.enrolled || 0), 0) || 0;

    // Get activity data
    const { data: activities } = await supabase
      .from('security_events')
      .select('created_at')
      .eq('user_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      totalJobPostings,
      activeJobPostings,
      totalApplications,
      hiredCandidates: 0, // Would track actual hires
      trainingPrograms: totalTrainingPrograms,
      trainedCandidates,
      partnershipLevel: profile?.partnership_level || 'basic',
      verificationStatus: profile?.verified ? 'verified' : 'pending',
      profileViews: 0, // Would track profile views
      lastActivity: activities?.[0]?.created_at || profile?.updated_at || '',
      climateImpactScore: 0 // Would calculate based on climate-focused activities
    };
  } catch (err) {
    console.error('Partner analytics calculation failed:', err);
    return {
      totalJobPostings: 0,
      activeJobPostings: 0,
      totalApplications: 0,
      hiredCandidates: 0,
      trainingPrograms: 0,
      trainedCandidates: 0,
      partnershipLevel: 'basic',
      verificationStatus: 'pending',
      profileViews: 0,
      lastActivity: '',
      climateImpactScore: 0
    };
  }
} 