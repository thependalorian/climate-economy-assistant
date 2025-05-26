/**
 * User Data Management Service
 * 
 * Comprehensive GDPR/CCPA compliant user data management including:
 * - Data export and portability
 * - Account deletion with grace period
 * - Consent management
 * - Data retention policies
 * - Privacy controls
 */

import { supabase } from '../supabase';
import { logSecurityEvent } from '../security/userSecurity';
import type { UnifiedUserProfile, UnifiedJobSeekerProfile, UnifiedPartnerProfile } from '../../types/unified';

export interface UserDataExport {
  profile: UnifiedUserProfile;
  jobSeekerProfile?: UnifiedJobSeekerProfile;
  partnerProfile?: UnifiedPartnerProfile;
  securityEvents: Record<string, unknown>[];
  consentHistory: ConsentRecord[];
  exportedAt: string;
  exportFormat: 'json' | 'csv';
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: 'terms_of_service' | 'privacy_policy' | 'marketing' | 'data_processing' | 'cookies';
  granted: boolean;
  granted_at: string;
  withdrawn_at?: string;
  ip_address: string;
  user_agent: string;
  version: string; // Version of the terms/policy
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  autoDelete: boolean;
  requiresUserConsent: boolean;
}

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_deletion_at: string;
  reason?: string;
  status: 'pending' | 'cancelled' | 'completed';
  grace_period_days: number;
}

// Data retention policies
export const DATA_RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    dataType: 'user_profiles',
    retentionPeriodDays: 2555, // 7 years for employment records
    autoDelete: false,
    requiresUserConsent: true
  },
  {
    dataType: 'security_events',
    retentionPeriodDays: 90,
    autoDelete: true,
    requiresUserConsent: false
  },
  {
    dataType: 'audit_logs',
    retentionPeriodDays: 365,
    autoDelete: true,
    requiresUserConsent: false
  },
  {
    dataType: 'marketing_data',
    retentionPeriodDays: 730, // 2 years
    autoDelete: true,
    requiresUserConsent: true
  }
];

/**
 * Export all user data in GDPR-compliant format
 */
export async function exportUserData(
  userId: string,
  format: 'json' | 'csv' = 'json',
  requestingIp: string,
  userAgent: string
): Promise<{ success: boolean; data?: UserDataExport; downloadUrl?: string; error?: string }> {
  try {
    console.log(`🔄 Exporting user data for: ${userId}`);

    // Log the data export request
    await logSecurityEvent(
      userId,
      'data_exported',
      requestingIp,
      userAgent,
      { format, timestamp: new Date().toISOString() },
      'medium'
    );

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    // Fetch additional profile data based on user type
    let jobSeekerProfile: UnifiedJobSeekerProfile | undefined;
    let partnerProfile: UnifiedPartnerProfile | undefined;

    if (profile.user_type === 'job_seeker') {
      const { data } = await supabase
        .from('job_seeker_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      jobSeekerProfile = data || undefined;
    }

    if (profile.user_type === 'partner') {
      const { data } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      partnerProfile = data || undefined;
    }

    // Fetch security events (last 90 days)
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Fetch consent history
    const { data: consentHistory } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    // Compile export data
    const exportData: UserDataExport = {
      profile: profile as UnifiedUserProfile,
      jobSeekerProfile,
      partnerProfile,
      securityEvents: securityEvents || [],
      consentHistory: consentHistory || [],
      exportedAt: new Date().toISOString(),
      exportFormat: format
    };

    // Generate secure download URL
    const exportId = `export_${userId}_${Date.now()}`;
    const downloadUrl = await generateSecureDownloadUrl(exportId, exportData);

    console.log(`✅ User data exported successfully for: ${userId}`);
    return { success: true, data: exportData, downloadUrl };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Failed to export user data: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Request account deletion with grace period
 */
export async function requestAccountDeletion(
  userId: string,
  reason: string,
  requestingIp: string,
  userAgent: string,
  gracePeriodDays: number = 14
): Promise<{ success: boolean; deletionDate?: string; error?: string }> {
  try {
    console.log(`🔄 Processing account deletion request for: ${userId}`);

    // Check if there's already a pending deletion request
    const { data: existingRequest } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return { 
        success: false, 
        error: 'Account deletion already requested',
        deletionDate: existingRequest.scheduled_deletion_at
      };
    }

    const scheduledDeletionAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);

    // Create deletion request
    const { data: deletionRequest, error } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        reason,
        scheduled_deletion_at: scheduledDeletionAt.toISOString(),
        status: 'pending',
        grace_period_days: gracePeriodDays
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the deletion request
    await logSecurityEvent(
      userId,
      'account_deleted',
      requestingIp,
      userAgent,
      { 
        reason, 
        scheduledDeletionAt: scheduledDeletionAt.toISOString(),
        gracePeriodDays,
        requestId: deletionRequest.id
      },
      'high'
    );

    // Send confirmation email (implementation depends on your email service)
    await sendAccountDeletionConfirmation(userId, scheduledDeletionAt);

    console.log(`✅ Account deletion scheduled for: ${scheduledDeletionAt.toISOString()}`);
    return { 
      success: true, 
      deletionDate: scheduledDeletionAt.toISOString() 
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Failed to request account deletion: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancel account deletion request
 */
export async function cancelAccountDeletion(
  userId: string,
  requestingIp: string,
  userAgent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('account_deletion_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the cancellation
    await logSecurityEvent(
      userId,
      'account_unlocked',
      requestingIp,
      userAgent,
      { action: 'deletion_cancelled' },
      'medium'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Record user consent for GDPR compliance
 */
export async function recordUserConsent(
  userId: string,
  consentType: ConsentRecord['consent_type'],
  granted: boolean,
  ipAddress: string,
  userAgent: string,
  version: string = '1.0'
): Promise<{ success: boolean; error?: string }> {
  try {
    const consentRecord: Omit<ConsentRecord, 'id'> = {
      user_id: userId,
      consent_type: consentType,
      granted,
      granted_at: new Date().toISOString(),
      withdrawn_at: granted ? undefined : new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      version
    };

    const { error } = await supabase
      .from('user_consents')
      .insert(consentRecord);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log consent change
    await logSecurityEvent(
      userId,
      granted ? 'profile_updated' : 'profile_updated',
      ipAddress,
      userAgent,
      { consentType, granted, version },
      'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get user's current consent status
 */
export async function getUserConsents(userId: string): Promise<{ success: boolean; consents?: ConsentRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, consents: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Permanently delete user account and all associated data
 */
export async function permanentlyDeleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 Permanently deleting account: ${userId}`);

    // Delete in reverse dependency order
    const tablesToDelete = [
      'security_events',
      'user_consents',
      'account_deletion_requests',
      'password_reset_tokens',
      'job_seeker_profiles',
      'partner_profiles',
      'admin_profiles',
      'user_profiles'
    ];

    for (const table of tablesToDelete) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error && !error.message.includes('does not exist')) {
        console.error(`Failed to delete from ${table}:`, error);
      }
    }

    // Delete from auth.users (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Failed to delete auth user:', authError);
    }

    console.log(`✅ Account permanently deleted: ${userId}`);
    return { success: true };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Failed to permanently delete account: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  settings: {
    profileVisibility?: 'public' | 'private' | 'connections_only';
    dataProcessingConsent?: boolean;
    marketingConsent?: boolean;
    analyticsConsent?: boolean;
  },
  requestingIp: string,
  userAgent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update privacy settings in user profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        privacy_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Record consent changes
    for (const [key, value] of Object.entries(settings)) {
      if (key.includes('Consent')) {
        const consentType = key.replace('Consent', '') as ConsentRecord['consent_type'];
        await recordUserConsent(userId, consentType, value as boolean, requestingIp, userAgent);
      }
    }

    // Log privacy settings update
    await logSecurityEvent(
      userId,
      'profile_updated',
      requestingIp,
      userAgent,
      { privacySettings: settings },
      'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate secure download URL for data export
 */
async function generateSecureDownloadUrl(exportId: string, data: UserDataExport): Promise<string> {
  // In a real implementation, you would:
  // 1. Store the export data in secure storage (S3, etc.)
  // 2. Generate a signed URL with expiration
  // 3. Return the secure URL
  
  // For now, return a placeholder URL with data size for logging
  console.log(`Generating download URL for export ${exportId}, data size: ${JSON.stringify(data).length} bytes`);
  return `/api/data-export/${exportId}?expires=${Date.now() + 24 * 60 * 60 * 1000}`;
}

/**
 * Send account deletion confirmation email
 */
async function sendAccountDeletionConfirmation(userId: string, deletionDate: Date): Promise<void> {
  // Implementation depends on your email service
  // This would send an email with:
  // - Confirmation of deletion request
  // - Scheduled deletion date
  // - Instructions to cancel if needed
  console.log(`📧 Sending deletion confirmation email for user ${userId}, scheduled for ${deletionDate}`);
}

/**
 * Process scheduled account deletions (run as cron job)
 */
export async function processScheduledDeletions(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    const { data: pendingDeletions, error } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_deletion_at', now);

    if (error) {
      console.error('Failed to fetch pending deletions:', error);
      return;
    }

    for (const deletion of pendingDeletions || []) {
      console.log(`🔄 Processing scheduled deletion for user: ${deletion.user_id}`);
      
      const result = await permanentlyDeleteAccount(deletion.user_id);
      
      if (result.success) {
        // Mark deletion as completed
        await supabase
          .from('account_deletion_requests')
          .update({ status: 'completed' })
          .eq('id', deletion.id);
        
        console.log(`✅ Account deleted successfully: ${deletion.user_id}`);
      } else {
        console.error(`❌ Failed to delete account: ${deletion.user_id}`, result.error);
      }
    }
  } catch (err) {
    console.error('Error processing scheduled deletions:', err);
  }
} 