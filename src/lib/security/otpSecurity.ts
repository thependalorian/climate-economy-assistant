/**
 * Enhanced OTP Security Service
 * 
 * Provides secure OTP generation, hashing, and verification
 * with attempt limiting and proper cleanup.
 */

import bcrypt from 'bcryptjs';
import { supabase } from '../supabase';

export enum OTPType {
  Registration = 'registration',
  PasswordReset = 'password_reset',
  LoginMFA = 'login_mfa'
}

export interface OTPRecord {
  id: string;
  user_id: string;
  email: string;
  code_hash: string;
  type: OTPType;
  expires_at: string;
  used: boolean;
  attempts: number;
  max_attempts: number;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
  isLocked?: boolean;
}

/**
 * Generate a secure OTP code
 */
export function generateSecureOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  // Use crypto.getRandomValues for better randomness
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    otp += digits[array[i] % digits.length];
  }
  
  return otp;
}

/**
 * Hash OTP code using bcrypt
 */
export async function hashOTP(otp: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(otp, saltRounds);
}

/**
 * Verify OTP code against hash
 */
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(otp, hash);
}

/**
 * Store OTP in database with enhanced security
 */
export async function storeSecureOTP(
  userId: string,
  email: string,
  otp: string,
  type: OTPType,
  ipAddress?: string,
  userAgent?: string,
  expirationMinutes: number = 10
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hash the OTP before storing
    const codeHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Invalidate any existing unused OTPs of the same type for this user
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('type', type)
      .eq('used', false);

    // Insert new OTP record
    const { error } = await supabase
      .from('otp_codes')
      .insert({
        user_id: userId,
        email,
        code_hash: codeHash,
        type,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        used: false,
        attempts: 0,
        max_attempts: 3
      });

    if (error) {
      console.error('Failed to store OTP:', error);
      return { success: false, error: 'Failed to generate verification code' };
    }

    return { success: true };
  } catch (err) {
    console.error('OTP storage failed:', err);
    return { success: false, error: 'Failed to store verification code' };
  }
}

/**
 * Verify OTP with enhanced security and attempt limiting
 */
export async function verifySecureOTP(
  email: string,
  otp: string,
  type: OTPType
): Promise<OTPVerificationResult> {
  try {
    // Get the most recent unused OTP for this email and type
    const { data: otpRecord, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('type', type)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return { 
        success: false, 
        error: 'Invalid or expired verification code' 
      };
    }

    // Check if too many attempts have been made
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return { 
        success: false, 
        error: 'Too many verification attempts. Please request a new code.',
        isLocked: true 
      };
    }

    // Verify the OTP
    const isValid = await verifyOTPHash(otp, otpRecord.code_hash);

    if (!isValid) {
      // Increment attempt count
      const newAttempts = otpRecord.attempts + 1;
      await supabase
        .from('otp_codes')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      const attemptsRemaining = otpRecord.max_attempts - newAttempts;
      return { 
        success: false, 
        error: `Invalid verification code. ${attemptsRemaining} attempts remaining.`,
        attemptsRemaining 
      };
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    return { success: true };

  } catch (err) {
    console.error('OTP verification failed:', err);
    return { 
      success: false, 
      error: 'Verification failed. Please try again.' 
    };
  }
}

/**
 * Cleanup expired and used OTPs
 */
export async function cleanupExpiredOTPs(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    // Delete OTPs that are either:
    // 1. Expired and unused
    // 2. Used and older than 24 hours (for audit trail)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('otp_codes')
      .delete()
      .or(`and(expires_at.lt.${new Date().toISOString()},used.eq.false),and(used.eq.true,created_at.lt.${oneDayAgo})`)
      .select('id');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, deletedCount: data?.length || 0 };
  } catch (err) {
    console.error('OTP cleanup failed:', err);
    return { success: false, error: 'Cleanup failed' };
  }
}

/**
 * Get OTP statistics for monitoring
 */
export async function getOTPStats(timeRangeHours: number = 24): Promise<{
  total: number;
  byType: Record<string, number>;
  successRate: number;
  averageAttempts: number;
}> {
  try {
    const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
    
    const { data: otps } = await supabase
      .from('otp_codes')
      .select('type, used, attempts')
      .gte('created_at', since);

    const total = otps?.length || 0;
    const byType: Record<string, number> = {};
    let successfulOTPs = 0;
    let totalAttempts = 0;

    otps?.forEach(otp => {
      byType[otp.type] = (byType[otp.type] || 0) + 1;
      if (otp.used) successfulOTPs++;
      totalAttempts += otp.attempts;
    });

    return {
      total,
      byType,
      successRate: total > 0 ? (successfulOTPs / total) * 100 : 0,
      averageAttempts: total > 0 ? totalAttempts / total : 0
    };
  } catch (err) {
    console.error('Failed to get OTP stats:', err);
    return {
      total: 0,
      byType: {},
      successRate: 0,
      averageAttempts: 0
    };
  }
} 