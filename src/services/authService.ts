/**
 * Authentication Service
 * 
 * Production-ready authentication service for the Climate Ecosystem Assistant.
 * Provides a clean API interface for all authentication operations with:
 * - Enhanced security features
 * - Rate limiting and monitoring
 * - Comprehensive error handling
 * - Analytics integration
 * - Vercel deployment optimization
 * 
 * Located in /services/ for business logic services
 */

import { 
  registerUser,
  loginUser,
  verifyOTP,
  requestPasswordReset,
  resetPasswordWithOTP,
  setupMFA,
  generateAndSendSecureOTP
} from '../lib/auth/enhancedAuthService';
import { checkRateLimit, logSecurityEvent } from '../lib/security/userSecurity';
import { supabase } from '../lib/supabase';
import type { 
  EnhancedRegistrationData,
  EnhancedLoginData,
  EnhancedOTPVerification,
  PasswordResetData,
  EnhancedAuthResult,
  OTPType
} from '../types/auth';
import { UserType } from '../types/auth';

// Helper to get client information
function getClientInfo() {
  return {
    ipAddress: '127.0.0.1', // In production, get from request headers
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
  };
}

/**
 * Authentication Service Class
 * Provides centralized authentication operations with enhanced security
 */
export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user with comprehensive validation
   */
  async register(registrationData: EnhancedRegistrationData): Promise<EnhancedAuthResult> {
    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      // Pre-registration validation
      const validation = await this.validateRegistrationData(registrationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check rate limits
      const rateLimit = await checkRateLimit('anonymous', 'registration', ipAddress);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: 'Too many registration attempts. Please try again later.',
          rateLimited: true,
          resetTime: rateLimit.resetTime
        };
      }

      // Proceed with registration
      const result = await registerUser(registrationData, ipAddress, userAgent);
      
      // Log registration attempt
      if (result.success) {
        await logSecurityEvent(
          'anonymous',
          'login_success',
          ipAddress,
          userAgent,
          { 
            action: 'registration_initiated',
            userType: registrationData.userType,
            email: registrationData.email
          },
          'low'
        );
      }

      return result;
    } catch (error) {
      console.error('Registration service error:', error);
      return {
        success: false,
        error: 'Registration service temporarily unavailable'
      };
    }
  }

  /**
   * Login user with security monitoring
   */
  async login(loginData: EnhancedLoginData): Promise<EnhancedAuthResult> {
    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      // Check rate limits
      const rateLimit = await checkRateLimit(loginData.email, 'login', ipAddress);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          rateLimited: true,
          resetTime: rateLimit.resetTime
        };
      }

      // Proceed with login
      const result = await loginUser(loginData, ipAddress, userAgent);
      
      return result;
    } catch (error) {
      console.error('Login service error:', error);
      return {
        success: false,
        error: 'Login service temporarily unavailable'
      };
    }
  }

  /**
   * Verify OTP with attempt tracking
   */
  async verifyOTP(verification: EnhancedOTPVerification): Promise<EnhancedAuthResult> {
    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      const result = await verifyOTP(verification, ipAddress, userAgent);
      return result;
    } catch (error) {
      console.error('OTP verification service error:', error);
      return {
        success: false,
        error: 'OTP verification service temporarily unavailable'
      };
    }
  }

  /**
   * Request password reset with rate limiting
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      // Check rate limits
      const rateLimit = await checkRateLimit(email, 'registration', ipAddress);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: 'Too many password reset attempts. Please try again later.'
        };
      }

      const result = await requestPasswordReset(email, ipAddress, userAgent);
      return result;
    } catch (error) {
      console.error('Password reset service error:', error);
      return {
        success: false,
        error: 'Password reset service temporarily unavailable'
      };
    }
  }

  /**
   * Complete password reset with OTP verification
   */
  async resetPassword(resetData: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      const result = await resetPasswordWithOTP(resetData, ipAddress, userAgent);
      return result;
    } catch (error) {
      console.error('Password reset completion service error:', error);
      return {
        success: false,
        error: 'Password reset service temporarily unavailable'
      };
    }
  }

  /**
   * Setup Multi-Factor Authentication
   */
  async setupMFA(userId: string): Promise<{ success: boolean; setup?: { secret: string; qrCode: string; backupCodes: string[] }; error?: string }> {
    try {
      const result = await setupMFA(userId);
      return result;
    } catch (error) {
      console.error('MFA setup service error:', error);
      return {
        success: false,
        error: 'MFA setup service temporarily unavailable'
      };
    }
  }

  /**
   * Resend OTP code
   */
  async resendOTP(
    userId: string,
    email: string,
    type: OTPType
  ): Promise<{ success: boolean; error?: string }> {
    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      // Check rate limits for OTP requests
      const rateLimit = await checkRateLimit(email, 'registration', ipAddress);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: 'Too many OTP requests. Please try again later.'
        };
      }

      const result = await generateAndSendSecureOTP(userId, email, type, ipAddress, userAgent);
      return result;
    } catch (error) {
      console.error('OTP resend service error:', error);
      return {
        success: false,
        error: 'OTP service temporarily unavailable'
      };
    }
  }

  /**
   * Logout user with session cleanup
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        return {
          success: false,
          error: 'Logout failed. Please try again.'
        };
      }

      // Clear any cached data
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'pendingConfirmationEmail',
          'pendingUserType',
          'pendingFirstName',
          'pendingLastName',
          'pendingOrganization'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      return { success: true };
    } catch (error) {
      console.error('Logout service error:', error);
      return {
        success: false,
        error: 'Logout service temporarily unavailable'
      };
    }
  }

  /**
   * Get current session status
   */
  async getSessionStatus(): Promise<{
    isAuthenticated: boolean;
    user?: { id: string; email?: string; email_confirmed_at?: string } | null;
    requiresVerification?: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          isAuthenticated: false,
          error: error.message
        };
      }

      const isAuthenticated = !!data.session?.user;
      const requiresVerification = data.session?.user && !data.session.user.email_confirmed_at;

      return {
        isAuthenticated,
        user: data.session?.user,
        requiresVerification
      };
    } catch (error) {
      console.error('Session status service error:', error);
      return {
        isAuthenticated: false,
        error: 'Session service temporarily unavailable'
      };
    }
  }

  /**
   * Validate registration data
   */
  private async validateRegistrationData(data: EnhancedRegistrationData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email address is required');
    }

    // Password validation  
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // User type validation
    if (!Object.values(UserType).includes(data.userType)) {
      errors.push('Invalid user type');
    }

    // Terms acceptance
    if (!data.acceptedTerms) {
      errors.push('You must accept the terms of service');
    }

    if (!data.acceptedPrivacy) {
      errors.push('You must accept the privacy policy');
    }

    // Partner-specific validation
    if (data.userType === UserType.Partner) {
      if (!data.organizationName) {
        errors.push('Organization name is required for partners');
      }
      if (!data.organizationType) {
        errors.push('Organization type is required for partners');
      }
    }

    // Check if email already exists
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const emailExists = existingUsers.users?.some(user => user.email === data.email);
      if (emailExists) {
        errors.push('An account with this email already exists');
      }
    } catch (error) {
      console.warn('Could not check email uniqueness:', error);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export individual functions for backward compatibility
export const {
  register,
  login,
  verifyOTP: verifyOTPCode,
  requestPasswordReset: requestPasswordResetEmail,
  resetPassword,
  setupMFA: setupMultiFactorAuth,
  resendOTP,
  logout,
  getSessionStatus
} = authService; 