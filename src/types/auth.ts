/**
 * Enhanced Authentication Types
 * 
 * Provides type-safe enums and interfaces for the authentication system
 */

// User Type Enum
export enum UserType {
  JobSeeker = 'job_seeker',
  Partner = 'partner',
  Admin = 'admin'
}

// OTP Type Enum
export enum OTPType {
  Registration = 'registration',
  PasswordReset = 'password_reset',
  LoginMFA = 'login_mfa'
}

// Organization Type Enum for Partners
export enum OrganizationType {
  Employer = 'employer',
  TrainingProvider = 'training_provider',
  EducationalInstitution = 'educational_institution',
  GovernmentAgency = 'government_agency',
  Nonprofit = 'nonprofit',
  IndustryAssociation = 'industry_association'
}

// Security Event Types
export enum SecurityEventType {
  LoginSuccess = 'login_success',
  LoginFailed = 'login_failed',
  PasswordChanged = 'password_changed',
  PasswordResetRequested = 'password_reset_requested',
  ProfileUpdated = 'profile_updated',
  AccountLocked = 'account_locked',
  AccountUnlocked = 'account_unlocked',
  DataExported = 'data_exported',
  SuspiciousActivity = 'suspicious_activity'
}

// Risk Levels
export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

// Enhanced Registration Data with type safety
export interface EnhancedRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingConsent?: boolean;
}

// Enhanced Login Data
export interface EnhancedLoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Enhanced OTP Verification
export interface EnhancedOTPVerification {
  email: string;
  otp: string;
  type: OTPType;
}

// Enhanced Auth Result with more detailed information
export interface EnhancedAuthResult {
  success: boolean;
  user?: unknown;
  requiresOTP?: boolean;
  requiresMFA?: boolean;
  error?: string;
  rateLimited?: boolean;
  resetTime?: Date;
  attemptsRemaining?: number;
  isLocked?: boolean;
}

// Password Reset Data
export interface PasswordResetData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// MFA Setup Response
export interface MFASetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Security Event Data
export interface SecurityEventData {
  userId: string;
  eventType: SecurityEventType;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
  riskLevel: RiskLevel;
}

// Rate Limit Information
export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

// User Profile Base
export interface BaseUserProfile {
  id: string;
  email: string;
  userType: UserType;
  firstName?: string;
  lastName?: string;
  profileCompleted: boolean;
  suspended: boolean;
  suspensionReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Session Information
export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

// Email Template Types
export type EmailTemplateType = 'registration' | 'password_reset' | 'login_mfa' | 'welcome' | 'account_suspended' | 'security_alert';

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  riskLevel: RiskLevel;
} 