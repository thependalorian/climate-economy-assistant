/**
 * User Security Service
 * 
 * Comprehensive security implementation for user management including:
 * - Password policies and validation
 * - Rate limiting and brute force protection
 * - Audit logging and security events
 * - Data encryption and PII protection
 * - Account security features
 */

import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Security configuration
export const SECURITY_CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
    MAX_CONSECUTIVE_CHARS: 3,
    PREVENT_COMMON_PASSWORDS: true,
  },
  RATE_LIMITING: {
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW_MINUTES: 15,
    PASSWORD_RESET_ATTEMPTS: 3,
    PASSWORD_RESET_WINDOW_HOURS: 1,
    REGISTRATION_ATTEMPTS: 3,
    REGISTRATION_WINDOW_HOURS: 24,
  },
  SESSION: {
    MAX_CONCURRENT_SESSIONS: 3,
    SESSION_TIMEOUT_HOURS: 24,
    REFRESH_TOKEN_DAYS: 30,
    REQUIRE_MFA_FOR_SENSITIVE: true,
  },
  AUDIT: {
    LOG_ALL_AUTH_EVENTS: true,
    LOG_PROFILE_CHANGES: true,
    LOG_DATA_ACCESS: true,
    RETENTION_DAYS: 90,
  }
};

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', '123456', 'password123', 'admin', 'qwerty',
  'letmein', 'welcome', 'monkey', '1234567890', 'password1'
];

// Security event types for audit logging
export type SecurityEventType = 
  | 'login_success' | 'login_failed' | 'logout'
  | 'password_changed' | 'password_reset_requested' | 'password_reset_completed'
  | 'profile_updated' | 'profile_viewed' | 'data_exported'
  | 'account_locked' | 'account_unlocked' | 'account_deleted'
  | 'mfa_enabled' | 'mfa_disabled' | 'suspicious_activity';

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: SecurityEventType;
  ip_address: string;
  user_agent: string;
  details: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}

/**
 * Validates password strength and security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters long`);
  } else {
    score += 20;
  }

  // Character requirements
  if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 15;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 15;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 15;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 15;
  }

  // Check for consecutive characters
  let consecutiveCount = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      consecutiveCount++;
      if (consecutiveCount > SECURITY_CONFIG.PASSWORD.MAX_CONSECUTIVE_CHARS) {
        errors.push(`Password cannot have more than ${SECURITY_CONFIG.PASSWORD.MAX_CONSECUTIVE_CHARS} consecutive identical characters`);
        break;
      }
    } else {
      consecutiveCount = 1;
    }
  }

  // Check against common passwords
  if (SECURITY_CONFIG.PASSWORD.PREVENT_COMMON_PASSWORDS) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
      errors.push('Password contains common words or patterns');
      score -= 20;
    }
  }

  // Additional complexity scoring
  if (password.length >= 16) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
  if (password.length >= 20) score += 10;

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 40) strength = 'weak';
  else if (score < 60) strength = 'fair';
  else if (score < 80) strength = 'good';
  else strength = 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(100, score))
  };
}

/**
 * Securely hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate OTP code
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Check rate limiting for various actions
 */
export async function checkRateLimit(
  userId: string,
  action: 'login' | 'password_reset' | 'registration',
  ipAddress: string
): Promise<RateLimitResult> {
  try {
    const config = SECURITY_CONFIG.RATE_LIMITING;
    let maxAttempts: number;
    let windowMinutes: number;

    switch (action) {
      case 'login':
        maxAttempts = config.LOGIN_ATTEMPTS;
        windowMinutes = config.LOGIN_WINDOW_MINUTES;
        break;
      case 'password_reset':
        maxAttempts = config.PASSWORD_RESET_ATTEMPTS;
        windowMinutes = config.PASSWORD_RESET_WINDOW_HOURS * 60;
        break;
      case 'registration':
        maxAttempts = config.REGISTRATION_ATTEMPTS;
        windowMinutes = config.REGISTRATION_WINDOW_HOURS * 60;
        break;
    }

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    // Check attempts in the time window (by user and IP for additional security)
    const { data: attempts, error } = await supabase
      .from('security_events')
      .select('created_at')
      .eq('user_id', userId)
      .eq('event_type', `${action}_failed`)
      .eq('ip_address', ipAddress)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, remaining: maxAttempts, resetTime: new Date(), blocked: false };
    }

    const attemptCount = attempts?.length || 0;
    const remaining = Math.max(0, maxAttempts - attemptCount);
    const blocked = attemptCount >= maxAttempts;
    const resetTime = new Date(Date.now() + windowMinutes * 60 * 1000);

    return {
      allowed: !blocked,
      remaining,
      resetTime,
      blocked
    };
  } catch (err) {
    console.error('Rate limit check error:', err);
    return { allowed: true, remaining: 0, resetTime: new Date(), blocked: false };
  }
}

/**
 * Log security event for audit trail
 */
export async function logSecurityEvent(
  userId: string,
  eventType: SecurityEventType,
  ipAddress: string,
  userAgent: string,
  details: Record<string, unknown> = {},
  riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<void> {
  try {
    const event: Omit<SecurityEvent, 'id' | 'created_at'> = {
      user_id: userId,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent,
      details,
      risk_level: riskLevel
    };

    const { error } = await supabase
      .from('security_events')
      .insert(event);

    if (error) {
      console.error('Failed to log security event:', error);
    }

    // Alert on high-risk events
    if (riskLevel === 'high' || riskLevel === 'critical') {
      await alertSecurityTeam(event);
    }
  } catch (err) {
    console.error('Security event logging error:', err);
  }
}

/**
 * Alert security team for high-risk events
 */
async function alertSecurityTeam(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
  // Implementation would depend on your alerting system
  // Could be email, Slack, PagerDuty, etc.
  console.warn('HIGH RISK SECURITY EVENT:', event);
}

/**
 * Encrypt sensitive PII data
 */
export function encryptPII(data: string, key?: string): string {
  const encryptionKey = key || process.env.PII_ENCRYPTION_KEY || 'default-key-change-in-production';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive PII data
 */
export function decryptPII(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.PII_ENCRYPTION_KEY || 'default-key-change-in-production';
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format and check for disposable email domains
 */
export function validateEmail(email: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Check for disposable email domains (basic list)
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    errors.push('Disposable email addresses are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate secure password reset token
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = generateSecureToken(64);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store token in database
  const { error } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      used: false
    });

  if (error) {
    throw new Error('Failed to generate password reset token');
  }

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  if (data.used || new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  return { valid: true, userId: data.user_id };
} 