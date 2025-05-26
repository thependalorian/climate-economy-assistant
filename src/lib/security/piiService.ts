/**
 * PII Service
 * 
 * Secure service for handling Personally Identifiable Information (PII)
 * with encryption, GDPR compliance, and comprehensive audit trails.
 * 
 * Features:
 * - Automatic PII field detection and encryption
 * - GDPR-compliant data export and deletion
 * - Secure profile updates with PII protection
 * - Audit trails for all PII operations
 * - Integration with existing profile service
 */

import { supabase } from '../supabase';
import { 
  encryptPII, 
  bulkDecryptPII, 
  type PIIField, 
  type EncryptedData 
} from './piiEncryption';
import { logSecurityEvent } from './userSecurity';
// Types imported for future use
// import type { 
//   UnifiedUserProfile, 
//   UnifiedJobSeekerProfile, 
//   UnifiedPartnerProfile 
// } from '../../types/unified';

// PII field mapping for different profile types
const PII_FIELD_MAPPING: Record<string, PIIField> = {
  email: 'email',
  first_name: 'first_name',
  last_name: 'last_name',
  phone_number: 'phone_number',
  address: 'address',
  date_of_birth: 'date_of_birth',
  emergency_contact: 'emergency_contact',
  resume_url: 'resume_content',
  cover_letter: 'cover_letter',
  personal_statement: 'personal_statement',
  tax_id: 'tax_id'
};

export interface PIIProfileData {
  userId: string;
  encryptedFields: Record<string, EncryptedData>;
  plainFields: Record<string, unknown>;
  lastUpdated: string;
  keyVersion: number;
}

export interface PIIUpdateRequest {
  userId: string;
  updates: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

export interface PIIExportData {
  userId: string;
  userType: string;
  exportDate: string;
  personalData: Record<string, string>;
  profileData: Record<string, unknown>;
  activityData: Record<string, unknown>;
  consentData: Record<string, unknown>;
}

/**
 * Determine if a field contains PII that should be encrypted
 */
export function isPIIField(fieldName: string, value: unknown): boolean {
  // Check if field is in our PII mapping
  if (PII_FIELD_MAPPING[fieldName]) {
    return true;
  }

  // Additional heuristics for PII detection
  const piiPatterns = [
    /email/i,
    /phone/i,
    /address/i,
    /ssn/i,
    /social/i,
    /birth/i,
    /emergency/i,
    /contact/i,
    /personal/i,
    /private/i
  ];

  const fieldNameLower = fieldName.toLowerCase();
  if (piiPatterns.some(pattern => pattern.test(fieldNameLower))) {
    return true;
  }

  // Check value patterns (email, phone, SSN, etc.)
  if (typeof value === 'string') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[\d\s\-()]{10,}$/;
    const ssnPattern = /^\d{3}-?\d{2}-?\d{4}$/;

    if (emailPattern.test(value) || phonePattern.test(value) || ssnPattern.test(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Encrypt PII fields in profile data
 */
export async function encryptProfilePII(
  profileData: Record<string, unknown>,
  userId: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Unknown'
): Promise<{ success: boolean; encryptedData?: PIIProfileData; error?: string }> {
  try {
    const encryptedFields: Record<string, EncryptedData> = {};
    const plainFields: Record<string, unknown> = {};

    for (const [fieldName, value] of Object.entries(profileData)) {
      if (value === null || value === undefined) {
        plainFields[fieldName] = value;
        continue;
      }

      if (isPIIField(fieldName, value)) {
        // Encrypt PII field
        const piiField = PII_FIELD_MAPPING[fieldName] || 'personal_statement';
        const result = await encryptPII(
          String(value),
          piiField,
          userId,
          ipAddress,
          userAgent
        );

        if (!result.success || !result.encryptedData) {
          return { success: false, error: `Failed to encrypt field ${fieldName}: ${result.error}` };
        }

        encryptedFields[fieldName] = result.encryptedData;
      } else {
        // Keep non-PII fields as plain text
        plainFields[fieldName] = value;
      }
    }

    const piiProfileData: PIIProfileData = {
      userId,
      encryptedFields,
      plainFields,
      lastUpdated: new Date().toISOString(),
      keyVersion: 1 // This should come from the encryption service
    };

    return { success: true, encryptedData: piiProfileData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Decrypt PII fields in profile data
 */
export async function decryptProfilePII(
  piiProfileData: PIIProfileData,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Unknown'
): Promise<{ success: boolean; profileData?: Record<string, unknown>; error?: string }> {
  try {
    // Decrypt all PII fields
    const decryptResult = await bulkDecryptPII(
      piiProfileData.encryptedFields,
      piiProfileData.userId,
      ipAddress,
      userAgent
    );

    if (!decryptResult.success || !decryptResult.data) {
      return { 
        success: false, 
        error: `Decryption failed: ${Object.values(decryptResult.errors || {}).join(', ')}` 
      };
    }

    // Combine decrypted PII with plain fields
    const profileData = {
      ...piiProfileData.plainFields,
      ...decryptResult.data
    };

    return { success: true, profileData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Securely update user profile with PII encryption
 */
export async function updateProfileWithPII(
  request: PIIUpdateRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, updates, ipAddress, userAgent } = request;

    // Encrypt the profile data
    const encryptResult = await encryptProfilePII(updates, userId, ipAddress, userAgent);
    if (!encryptResult.success || !encryptResult.encryptedData) {
      return { success: false, error: encryptResult.error };
    }

    const { encryptedFields, plainFields } = encryptResult.encryptedData;

    // Update user profile with plain fields
    if (Object.keys(plainFields).length > 0) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          ...plainFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        return { success: false, error: `Profile update failed: ${profileError.message}` };
      }
    }

    // Store encrypted PII fields in separate table
    if (Object.keys(encryptedFields).length > 0) {
      const { error: piiError } = await supabase
        .from('user_pii_data')
        .upsert({
          user_id: userId,
          encrypted_data: encryptedFields,
          key_version: encryptResult.encryptedData.keyVersion,
          updated_at: new Date().toISOString()
        });

      if (piiError) {
        return { success: false, error: `PII storage failed: ${piiError.message}` };
      }
    }

    // Log the profile update
    await logSecurityEvent(
      userId,
      'profile_updated',
      ipAddress,
      userAgent,
      { 
        fields_updated: Object.keys(updates),
        pii_fields: Object.keys(encryptedFields),
        plain_fields: Object.keys(plainFields)
      },
      'low'
    );

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Securely retrieve user profile with PII decryption
 */
export async function getProfileWithPII(
  userId: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Unknown'
): Promise<{ success: boolean; profile?: Record<string, unknown>; error?: string }> {
  try {
    // Get user profile (non-PII data)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { success: false, error: `Profile fetch failed: ${profileError.message}` };
    }

    // Get encrypted PII data
    const { data: piiData, error: piiError } = await supabase
      .from('user_pii_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (piiError && piiError.code !== 'PGRST116') {
      return { success: false, error: `PII fetch failed: ${piiError.message}` };
    }

    let decryptedPII = {};

    // Decrypt PII if it exists
    if (piiData && piiData.encrypted_data) {
      const piiProfileData: PIIProfileData = {
        userId,
        encryptedFields: piiData.encrypted_data,
        plainFields: {},
        lastUpdated: piiData.updated_at,
        keyVersion: piiData.key_version
      };

      const decryptResult = await decryptProfilePII(piiProfileData, ipAddress, userAgent);
      if (decryptResult.success && decryptResult.profileData) {
        decryptedPII = decryptResult.profileData;
      }
    }

    // Combine profile with decrypted PII
    const completeProfile = {
      ...profile,
      ...decryptedPII
    };

    return { success: true, profile: completeProfile };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Profile retrieval failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Export all user data for GDPR compliance
 */
export async function exportUserDataGDPR(
  userId: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Unknown'
): Promise<{ success: boolean; exportData?: PIIExportData; error?: string }> {
  try {
    // Get complete profile with PII
    const profileResult = await getProfileWithPII(userId, ipAddress, userAgent);
    if (!profileResult.success || !profileResult.profile) {
      return { success: false, error: profileResult.error };
    }

    const profile = profileResult.profile;

    // Get user type-specific data
    let typeSpecificData = {};
    if (profile.user_type === 'job_seeker') {
      const { data: jobSeekerData } = await supabase
        .from('job_seeker_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      typeSpecificData = jobSeekerData || {};
    } else if (profile.user_type === 'partner') {
      const { data: partnerData } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      typeSpecificData = partnerData || {};
    }

    // Get consent data
    const { data: consentData } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId);

    // Get activity data (security events)
    const { data: activityData } = await supabase
      .from('security_events')
      .select('event_type, created_at, ip_address, user_agent, details')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Separate PII from non-PII data
    const personalData: Record<string, string> = {};
    const profileData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(profile)) {
      if (isPIIField(key, value)) {
        personalData[key] = String(value);
      } else {
        profileData[key] = value;
      }
    }

    const exportData: PIIExportData = {
      userId,
      userType: String(profile.user_type),
      exportDate: new Date().toISOString(),
      personalData,
      profileData: {
        ...profileData,
        ...typeSpecificData
      },
      activityData: {
        securityEvents: activityData || []
      },
      consentData: {
        consents: consentData || []
      }
    };

    // Log the data export
    await logSecurityEvent(
      userId,
      'data_exported',
      ipAddress,
      userAgent,
      { 
        export_type: 'gdpr_full_export',
        data_types: ['profile', 'activity', 'consents']
      },
      'medium'
    );

    return { success: true, exportData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Data export failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Securely delete all user PII data
 */
export async function deleteUserPII(
  userId: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Unknown'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete encrypted PII data
    const { error: piiError } = await supabase
      .from('user_pii_data')
      .delete()
      .eq('user_id', userId);

    if (piiError) {
      return { success: false, error: `PII deletion failed: ${piiError.message}` };
    }

    // Anonymize user profile (keep non-PII data for analytics)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        email: `deleted_user_${userId}@deleted.local`,
        first_name: '[DELETED]',
        last_name: '[DELETED]',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      return { success: false, error: `Profile anonymization failed: ${profileError.message}` };
    }

    // Log the deletion
    await logSecurityEvent(
      userId,
      'account_deleted',
      ipAddress,
      userAgent,
      { 
        deletion_type: 'pii_deletion',
        anonymized: true
      },
      'high'
    );

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'PII deletion failed';
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate PII data structure
 */
export function validatePIIData(data: unknown): data is PIIProfileData {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.userId === 'string' &&
    typeof obj.encryptedFields === 'object' &&
    typeof obj.plainFields === 'object' &&
    typeof obj.lastUpdated === 'string' &&
    typeof obj.keyVersion === 'number'
  );
} 