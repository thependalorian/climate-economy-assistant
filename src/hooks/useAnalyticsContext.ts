import { useContext, useCallback } from 'react';
import { AnalyticsContext } from '../contexts/AnalyticsContext';
import { useAuth } from './useAuth';
import type { UserType } from '../types/auth';

/**
 * Enhanced useAnalyticsContext Hook
 * 
 * Provides analytics functionality with authentication integration:
 * - User journey tracking
 * - Authentication event analytics
 * - Conversion funnel monitoring
 * - Security event tracking
 * - Profile completion analytics
 * 
 * Located in /hooks/ for analytics context management
 */
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }

  const { user, profile } = useAuth();

  // Track authentication events
  const trackAuthEvent = useCallback((
    eventName: string,
    properties?: Record<string, unknown>
  ) => {
    if (!context.track) return;

    const authProperties = {
      ...properties,
      user_id: user?.id,
      user_email: user?.email,
      user_type: profile?.user_type,
      profile_completed: profile?.profile_completed,
      timestamp: new Date().toISOString()
    };

    context.track(eventName, authProperties);
  }, [context, user, profile]);

  // Track registration funnel
  const trackRegistrationStep = useCallback((
    step: 'started' | 'email_entered' | 'password_created' | 'user_type_selected' | 'terms_accepted' | 'verification_sent' | 'email_verified' | 'profile_created',
    userType?: UserType,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('registration_step', {
      step,
      user_type: userType,
      funnel_stage: 'registration',
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track login funnel
  const trackLoginStep = useCallback((
    step: 'started' | 'credentials_entered' | 'mfa_required' | 'mfa_completed' | 'success' | 'failed',
    reason?: string,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('login_step', {
      step,
      failure_reason: reason,
      funnel_stage: 'login',
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track OTP verification
  const trackOTPEvent = useCallback((
    action: 'sent' | 'resent' | 'verified' | 'failed' | 'expired',
    otpType: 'registration' | 'login_mfa' | 'password_reset',
    attempt?: number,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('otp_verification', {
      action,
      otp_type: otpType,
      attempt_number: attempt,
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track password reset funnel
  const trackPasswordResetStep = useCallback((
    step: 'requested' | 'email_sent' | 'otp_verified' | 'password_updated' | 'completed',
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('password_reset_step', {
      step,
      funnel_stage: 'password_reset',
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track onboarding progress
  const trackOnboardingStep = useCallback((
    step: string,
    stepNumber: number,
    isCompleted: boolean = false,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('onboarding_step', {
      step,
      step_number: stepNumber,
      is_completed: isCompleted,
      funnel_stage: 'onboarding',
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track profile completion
  const trackProfileEvent = useCallback((
    action: 'updated' | 'completed' | 'skills_added' | 'education_added' | 'experience_added',
    section?: string,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('profile_action', {
      action,
      section,
      profile_completion_status: profile?.profile_completed ? 'complete' : 'incomplete',
      ...additionalData
    });
  }, [trackAuthEvent, profile]);

  // Track security events
  const trackSecurityEvent = useCallback((
    eventType: 'suspicious_activity' | 'rate_limit_hit' | 'mfa_setup' | 'password_changed' | 'session_timeout',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('security_event', {
      security_event_type: eventType,
      severity,
      requires_attention: severity === 'high' || severity === 'critical',
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track user engagement
  const trackEngagementEvent = useCallback((
    action: 'page_view' | 'feature_used' | 'search_performed' | 'document_viewed' | 'recommendation_clicked',
    feature?: string,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('user_engagement', {
      action,
      feature,
      session_duration: additionalData?.sessionDuration,
      ...additionalData
    });
  }, [trackAuthEvent]);

  // Track conversion events
  const trackConversionEvent = useCallback((
    conversionType: 'registration_completed' | 'profile_completed' | 'first_login' | 'feature_adoption' | 'onboarding_completed',
    value?: number,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      is_new_user: !profile?.profile_completed,
      days_since_registration: additionalData?.daysSinceRegistration,
      ...additionalData
    });
  }, [trackAuthEvent, profile]);

  // Track error events
  const trackErrorEvent = useCallback((
    errorType: 'auth_error' | 'validation_error' | 'network_error' | 'server_error',
    errorMessage: string,
    context?: string,
    additionalData?: Record<string, unknown>
  ) => {
    trackAuthEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      error_context: context,
      user_action: additionalData?.userAction,
      ...additionalData
    });
  }, [trackAuthEvent]);

  return {
    // Original context methods
    ...context,
    
    // Enhanced authentication analytics
    trackAuthEvent,
    trackRegistrationStep,
    trackLoginStep,
    trackOTPEvent,
    trackPasswordResetStep,
    trackOnboardingStep,
    trackProfileEvent,
    trackSecurityEvent,
    trackEngagementEvent,
    trackConversionEvent,
    trackErrorEvent
  };
}
