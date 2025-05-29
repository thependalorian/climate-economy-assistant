# Enhanced Authentication System - Usage Guide

## Overview

The enhanced authentication system provides production-ready authentication with comprehensive security, analytics, and user management features. This guide shows you how to implement each component following the 23 rules framework.

## Quick Start

### 1. Basic Registration Flow

```typescript
// components/auth/RegistrationForm.tsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useAnalyticsContext } from '../../hooks/useAnalyticsContext';

export function RegistrationForm() {
  const { register, isLoading } = useAuth();
  const analytics = useAnalyticsContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'job_seeker' as const,
    firstName: '',
    lastName: '',
    acceptedTerms: false,
    acceptedPrivacy: false
  });

  const { errors, validateField, validateForm } = useFormValidation({
    rules: 'registration'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(formData);
    if (!validation.isValid) return;

    analytics.trackEngagementEvent('form_submitted', 'registration', {
      userType: formData.userType,
      hasName: !!(formData.firstName && formData.lastName)
    });

    const result = await register(formData);
    
    if (result.success) {
      analytics.trackConversionEvent('user_registered', 1, {
        userType: formData.userType,
        method: 'email'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          placeholder="your.email@example.com"
          className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            validateField('email', e.target.value);
          }}
        />
        {errors.email && <label className="label label-text-alt text-error">{errors.email}</label>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Password</span>
        </label>
        <input
          type="password"
          placeholder="Strong password"
          className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            validateField('password', e.target.value);
          }}
        />
        {errors.password && <label className="label label-text-alt text-error">{errors.password}</label>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">User Type</span>
        </label>
        <select
          className="select select-bordered"
          value={formData.userType}
          onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
        >
          <option value="job_seeker">Job Seeker</option>
          <option value="partner">Partner Organization</option>
        </select>
      </div>

      <div className="form-control">
        <label className="cursor-pointer label">
          <input
            type="checkbox"
            className="checkbox"
            checked={formData.acceptedTerms}
            onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
          />
          <span className="label-text ml-2">I accept the Terms of Service</span>
        </label>
      </div>

      <button
        type="submit"
        className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Register'}
      </button>
    </form>
  );
}
```

### 2. OTP Verification Component

```typescript
// components/auth/OTPVerification.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAnalyticsContext } from '../../hooks/useAnalyticsContext';

interface OTPVerificationProps {
  email: string;
  type: 'registration' | 'password_reset' | 'login_mfa';
  onSuccess: () => void;
}

export function OTPVerification({ email, type, onSuccess }: OTPVerificationProps) {
  const { verifyOTP, resendOTP, isLoading } = useAuth();
  const analytics = useAnalyticsContext();
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    analytics.trackEngagementEvent('form_submitted', 'otp_verification', {
      type,
      otpLength: otp.length
    });

    const result = await verifyOTP({ email, otp, type });
    
    if (result.success) {
      analytics.trackConversionEvent('otp_verified', 1, { type });
      onSuccess();
    }
  };

  const handleResend = async () => {
    analytics.trackEngagementEvent('button_clicked', 'resend_otp', { type });
    await resendOTP(email, type);
    setTimeLeft(300);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Verify Your Email</h2>
        <p className="text-sm text-base-content/70">
          We've sent a verification code to {email}
        </p>

        <form onSubmit={handleVerify} className="space-y-4 mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Verification Code</span>
            </label>
            <input
              type="text"
              placeholder="123456"
              className="input input-bordered text-center text-lg tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="divider">Need help?</div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-base-content/70">
            Code expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResend}
            disabled={timeLeft > 240} // Allow resend after 1 minute
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Security Dashboard Component

```typescript
// components/security/SecurityDashboard.tsx
import { useEffect } from 'react';
import { useAuthSecurity } from '../../hooks/useAuthSecurity';

export function SecurityDashboard() {
  const {
    securityAlerts,
    sessionInfo,
    riskAssessment,
    clearAlert,
    refreshSecurityData
  } = useAuthSecurity();

  useEffect(() => {
    refreshSecurityData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Security Overview</h2>
          
          {/* Risk Assessment */}
          <div className="alert alert-info">
            <div className="flex-1">
              <h3 className="font-bold">Security Score</h3>
              <div className="flex items-center gap-2">
                <progress 
                  className="progress progress-primary w-32" 
                  value={riskAssessment.score} 
                  max="100"
                ></progress>
                <span className="text-sm">{riskAssessment.score}/100</span>
              </div>
              <p className="text-sm mt-1">{riskAssessment.level} risk level</p>
            </div>
          </div>

          {/* Active Session Info */}
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Current Session</div>
              <div className="stat-value text-primary">{sessionInfo.duration}</div>
              <div className="stat-desc">Active for</div>
            </div>
            <div className="stat">
              <div className="stat-title">Location</div>
              <div className="stat-value text-sm">{sessionInfo.location}</div>
              <div className="stat-desc">Current IP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Security Alerts</h3>
            <div className="space-y-2">
              {securityAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`alert ${
                    alert.severity === 'high' ? 'alert-error' : 
                    alert.severity === 'medium' ? 'alert-warning' : 'alert-info'
                  }`}
                >
                  <div className="flex-1">
                    <h4 className="font-bold">{alert.title}</h4>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-base-content/70">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => clearAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Integration Examples

### 1. Using Enhanced Agent Service

```typescript
// components/chat/AgentChat.tsx
import { useState } from 'react';
import { enhancedAgentService } from '../../services/enhancedAgentService';
import { useAnalyticsContext } from '../../hooks/useAnalyticsContext';

export function AgentChat() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const analytics = useAnalyticsContext();

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const result = await enhancedAgentService.sendMessage({
        message,
        conversation_id: 'conv_' + Date.now(),
        context: {
          urgency_level: 'medium',
          previous_interactions: conversation.length
        }
      });

      if (result.success && result.data) {
        setConversation(prev => [...prev, {
          type: 'user',
          content: message,
          timestamp: new Date()
        }, {
          type: 'agent',
          content: result.data.message,
          recommendations: result.data.partner_recommendations,
          timestamp: new Date()
        }]);

        analytics.trackEngagementEvent('feature_used', 'agent_interaction', {
          response_time: Date.now() - startTime,
          recommendations_count: result.data.partner_recommendations.length
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Climate Career Assistant</h2>
        
        <div className="chat-container h-96 overflow-y-auto space-y-4">
          {conversation.map((msg, index) => (
            <div key={index} className={`chat ${msg.type === 'user' ? 'chat-end' : 'chat-start'}`}>
              <div className="chat-bubble">
                {msg.content}
              </div>
              {msg.recommendations && (
                <div className="mt-2 space-y-2">
                  {msg.recommendations.slice(0, 3).map((rec: any, i: number) => (
                    <div key={i} className="card bg-primary/10 shadow-sm">
                      <div className="card-body p-3">
                        <h4 className="text-sm font-bold">{rec.partner_name}</h4>
                        <p className="text-xs">{rec.reasoning}</p>
                        <div className="card-actions justify-end">
                          <button className="btn btn-xs btn-primary">Learn More</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Ask about climate careers..."
              className="input input-bordered flex-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              onClick={sendMessage}
              disabled={isLoading || !message.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. Profile Management with Optimistic Updates

```typescript
// components/profile/ProfileEditor.tsx
import { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useAnalyticsContext } from '../../hooks/useAnalyticsContext';

export function ProfileEditor() {
  const { 
    profile, 
    updateProfile, 
    addSkill, 
    removeSkill, 
    isLoading,
    completionStatus 
  } = useProfile();
  
  const analytics = useAnalyticsContext();
  const [formData, setFormData] = useState(profile || {});

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSave = async () => {
    const result = await updateProfile(formData);
    
    if (result.success) {
      analytics.trackEngagementEvent('profile_updated', 'save', {
        completion_score: completionStatus.score,
        sections_completed: completionStatus.completedSections.length
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Completion Progress */}
      <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content">
        <div className="card-body">
          <h2 className="card-title">Profile Completion</h2>
          <div className="flex items-center gap-4">
            <progress 
              className="progress progress-primary-content w-full" 
              value={completionStatus.score} 
              max="100"
            ></progress>
            <span className="text-lg font-bold">{completionStatus.score}%</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {completionStatus.missingSections.map((section) => (
              <div key={section} className="badge badge-outline">
                Missing: {section.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Last Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Skills</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {(formData.skills || []).map((skill: any, index: number) => (
              <div key={index} className="badge badge-primary gap-2">
                {skill.name}
                <button 
                  className="btn btn-ghost btn-xs"
                  onClick={() => removeSkill(skill.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Add a skill"
                className="input input-bordered flex-1"
                onKeyPress={async (e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    await addSkill(e.currentTarget.value.trim(), 'intermediate');
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button className="btn btn-primary">Add</button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="card-actions justify-end">
        <button 
          className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
```

## Advanced Usage

### Custom Authentication Flow

```typescript
// hooks/useCustomAuth.ts
import { useAuth } from './useAuth';
import { useAuthSecurity } from './useAuthSecurity';
import { useAnalyticsContext } from './useAnalyticsContext';

export function useCustomAuth() {
  const auth = useAuth();
  const security = useAuthSecurity();
  const analytics = useAnalyticsContext();

  const handleSecureLogin = async (credentials: any) => {
    // Check security first
    const riskCheck = await security.assessLoginRisk(credentials.email);
    
    if (riskCheck.level === 'high') {
      analytics.trackSecurityEvent('high_risk_login_attempt', {
        email: credentials.email,
        risk_factors: riskCheck.factors
      });
      
      // Require additional verification
      return { success: false, requiresAdditionalVerification: true };
    }

    // Proceed with normal login
    return auth.login(credentials);
  };

  return {
    ...auth,
    ...security,
    handleSecureLogin
  };
}
```

This enhanced authentication system provides production-ready features while maintaining clean, maintainable code following your 23 rules framework. 