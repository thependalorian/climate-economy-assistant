import { useState, useCallback, useEffect } from 'react';
import { 
  checkRateLimit, 
  logSecurityEvent, 
  RateLimitResult 
} from '../lib/security/userSecurity';
import { useAuth } from './useAuth';

/**
 * useAuthSecurity Hook
 * 
 * Specialized hook for authentication security features:
 * - Rate limiting monitoring
 * - Security event logging  
 * - Suspicious activity detection
 * - Session monitoring
 * 
 * Located in /hooks/ for authentication security management
 */
export function useAuthSecurity() {
  const { user } = useAuth();
  const [rateLimitStatus, setRateLimitStatus] = useState<Record<string, RateLimitResult>>({});
  const [securityAlerts, setSecurityAlerts] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>>([]);

  // Helper to get client info
  const getClientInfo = useCallback(() => {
    return {
      ipAddress: '127.0.0.1', // In production, get real IP
      userAgent: navigator.userAgent
    };
  }, []);

  // Check rate limit for specific action
  const checkActionRateLimit = useCallback(async (
    action: 'login' | 'registration' | 'password_reset' | 'otp_request',
    identifier?: string
  ): Promise<RateLimitResult> => {
    const { ipAddress } = getClientInfo();
    const checkIdentifier = identifier || user?.email || 'anonymous';
    
    try {
      const result = await checkRateLimit(checkIdentifier, action, ipAddress);
      
      // Update rate limit status
      setRateLimitStatus(prev => ({
        ...prev,
        [`${action}_${checkIdentifier}`]: result
      }));
      
      return result;
    } catch (error) {
      console.error(`Rate limit check failed for ${action}:`, error);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000), // 1 minute fallback
        error: 'Rate limit check failed'
      };
    }
  }, [user?.email, getClientInfo]);

  // Log security event with enhanced tracking
  const logAuthSecurityEvent = useCallback(async (
    eventType: 'login_success' | 'login_failed' | 'password_changed' | 'password_reset_requested' | 'suspicious_activity',
    metadata?: Record<string, unknown>,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    if (!user?.id) {
      console.warn('Cannot log security event: No user ID available');
      return;
    }

    const { ipAddress, userAgent } = getClientInfo();
    
    try {
      await logSecurityEvent(
        user.id,
        eventType,
        ipAddress,
        userAgent,
        {
          timestamp: new Date().toISOString(),
          ...metadata
        },
        riskLevel
      );

      // Add to local security alerts for UI
      if (riskLevel === 'high' || riskLevel === 'critical') {
        const alert = {
          id: `${Date.now()}-${Math.random()}`,
          type: eventType,
          message: `Security event: ${eventType}`,
          timestamp: new Date(),
          severity: riskLevel
        };
        
        setSecurityAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user?.id, getClientInfo]);

  // Monitor session for suspicious activity
  const monitorSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Check for multiple rapid actions
      const actions = ['login', 'password_reset', 'otp_request'] as const;
      const suspiciousActivity = [];

      for (const action of actions) {
        const result = await checkActionRateLimit(action);
        if (!result.allowed && result.remaining === 0) {
          suspiciousActivity.push(action);
        }
      }

      if (suspiciousActivity.length > 0) {
        await logAuthSecurityEvent(
          'suspicious_activity',
          {
            triggeredActions: suspiciousActivity,
            sessionId: user.id
          },
          'high'
        );
      }
    } catch (error) {
      console.error('Session monitoring failed:', error);
    }
  }, [user?.id, checkActionRateLimit, logAuthSecurityEvent]);

  // Clear old security alerts
  const clearSecurityAlert = useCallback((alertId: string) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear all security alerts
  const clearAllSecurityAlerts = useCallback(() => {
    setSecurityAlerts([]);
  }, []);

  // Get rate limit status for specific action
  const getRateLimitStatus = useCallback((
    action: string,
    identifier?: string
  ): RateLimitResult | null => {
    const checkIdentifier = identifier || user?.email || 'anonymous';
    return rateLimitStatus[`${action}_${checkIdentifier}`] || null;
  }, [rateLimitStatus, user?.email]);

  // Monitor session periodically
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(monitorSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user?.id, monitorSession]);

  return {
    // Rate limiting
    checkActionRateLimit,
    getRateLimitStatus,
    rateLimitStatus,
    
    // Security logging
    logAuthSecurityEvent,
    
    // Security alerts
    securityAlerts,
    clearSecurityAlert,
    clearAllSecurityAlerts,
    
    // Session monitoring
    monitorSession,
    
    // Utilities
    getClientInfo
  };
} 