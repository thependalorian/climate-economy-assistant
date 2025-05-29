import { useContext, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { 
  EnhancedRegistrationData, 
  EnhancedLoginData, 
  EnhancedOTPVerification,
  PasswordResetData,
  EnhancedAuthResult 
} from '../types/auth';
import { 
  registerUser, 
  loginUser, 
  verifyOTP, 
  requestPasswordReset,
  resetPasswordWithOTP,
  setupMFA 
} from '../lib/auth/enhancedAuthService';
import { LogoutRedirect } from '../components/auth/SimpleRedirect';

/**
 * Enhanced useAuth Hook
 * 
 * Production-ready authentication hook with comprehensive features:
 * - Enhanced registration with OTP verification
 * - Secure login with rate limiting
 * - MFA support
 * - Password reset with OTP
 * - Security event logging
 * - Error handling and validation
 * 
 * Follows the 23 rules for secure, scalable authentication.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get client info for security logging
  const getClientInfo = useCallback(() => {
    return {
      ipAddress: '127.0.0.1', // In production, get real IP from headers
      userAgent: navigator.userAgent
    };
  }, []);

  // Clear any existing errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced registration with comprehensive validation
  const registerWithEnhanced = useCallback(async (
    registrationData: EnhancedRegistrationData
  ): Promise<EnhancedAuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { ipAddress, userAgent } = getClientInfo();
      const result = await registerUser(registrationData, ipAddress, userAgent);
      
      if (!result.success) {
        setError(result.error || 'Registration failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getClientInfo]);

  // Enhanced login with security features
  const loginWithEnhanced = useCallback(async (
    loginData: EnhancedLoginData
  ): Promise<EnhancedAuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { ipAddress, userAgent } = getClientInfo();
      const result = await loginUser(loginData, ipAddress, userAgent);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getClientInfo]);

  // Enhanced OTP verification
  const verifyOTPCode = useCallback(async (
    verification: EnhancedOTPVerification
  ): Promise<EnhancedAuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { ipAddress, userAgent } = getClientInfo();
      const result = await verifyOTP(verification, ipAddress, userAgent);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getClientInfo]);

  // Password reset request
  const requestPasswordResetWithOTP = useCallback(async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { ipAddress, userAgent } = getClientInfo();
      const result = await requestPasswordReset(email, ipAddress, userAgent);
      
      if (!result.success) {
        setError(result.error || 'Password reset request failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset request failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getClientInfo]);

  // Complete password reset
  const completePasswordReset = useCallback(async (
    resetData: PasswordResetData
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { ipAddress, userAgent } = getClientInfo();
      const result = await resetPasswordWithOTP(resetData, ipAddress, userAgent);
      
      if (!result.success) {
        setError(result.error || 'Password reset failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getClientInfo]);

  // Setup MFA
  const setupMultiFactorAuth = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await setupMFA(userId);
      
      if (!result.success) {
        setError(result.error || 'MFA setup failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'MFA setup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced logout with cleanup
  const enhancedLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the context's signOut method for Supabase cleanup
      await context.signOut();
      
      // Clear any localStorage data
      const keysToRemove = [
        'pendingConfirmationEmail',
        'pendingUserType',
        'pendingFirstName',
        'pendingLastName',
        'pendingOrganization'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Return a logout redirect component
      return { success: true, component: LogoutRedirect };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  return {
    // Original context methods
    ...context,
    
    // Enhanced authentication methods
    registerWithEnhanced,
    loginWithEnhanced,
    verifyOTPCode,
    requestPasswordResetWithOTP,
    completePasswordReset,
    setupMultiFactorAuth,
    enhancedLogout,
    
    // State management
    isLoading,
    error,
    clearError,
    
    // Utility methods
    getClientInfo
  };
}
