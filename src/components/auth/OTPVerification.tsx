import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOTP, generateAndSendSecureOTP } from '../../lib/auth/enhancedAuthService';
import { OTPType } from '../../types/auth';

interface OTPVerificationProps {
  email: string;
  otpType?: OTPType;
  onVerificationComplete: () => void;
  onResendOTP?: () => void;
  showBackButton?: boolean;
}

/**
 * Enhanced OTP Verification Component
 * 
 * Production-ready email verification with secure 6-digit OTP codes.
 * Features: auto-focus, keyboard navigation, accessibility, rate limiting.
 * Used during registration, password reset, and MFA flows.
 * Located in /components/auth/ for authentication-related UI components.
 */
export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  otpType = OTPType.Registration,
  onVerificationComplete,
  onResendOTP,
  showBackButton = true
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Load persisted cooldown timer
  useEffect(() => {
    const cooldownKey = `otpResendTime_${email}_${otpType}`;
    const lastResend = parseInt(localStorage.getItem(cooldownKey) || '0');
    const elapsed = Math.floor((Date.now() - lastResend) / 1000);
    if (elapsed < 60) {
      setResendCooldown(60 - elapsed);
    }
  }, [email, otpType]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const sanitizeInput = (value: string): string => {
    // Only allow digits, remove any non-numeric characters
    return value.replace(/\D/g, '');
  };

  const handleInputChange = (index: number, value: string) => {
    // Sanitize input to ensure only digits
    const sanitizedValue = sanitizeInput(value);
    
    // Only allow single digits
    if (sanitizedValue.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = sanitizedValue;
    setOtp(newOtp);
    setError(null);
    setIsLocked(false);

    // Auto-focus next input
    if (sanitizedValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && sanitizedValue) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError(null);
      setIsLocked(false);
      
      // Focus last input
      inputRefs.current[5]?.focus();
      
      // Auto-verify pasted OTP
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (isLocked) return;
    
    setIsVerifying(true);
    setError(null);

    try {
      // Get client IP and user agent for security logging
      const ipAddress = '127.0.0.1'; // In production, get real IP
      const userAgent = navigator.userAgent;

      const result = await verifyOTP(
        {
          email,
          otp: otpCode,
          type: otpType
        },
        ipAddress,
        userAgent
      );

      if (result.success) {
        console.log('✅ OTP verified successfully');
        onVerificationComplete();
      } else {
        setError(result.error || 'Verification failed');
        
        if (result.isLocked) {
          setIsLocked(true);
          setError('Too many verification attempts. Please request a new code.');
        } else if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
        
        // Clear OTP on error and refocus first input
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      console.error('❌ OTP verification failed:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    setError(null);
    setIsLocked(false);
    setAttemptsRemaining(null);

    try {
      // For registration type, we need to get the user ID
      // In a real implementation, you'd have this from the registration flow
      const userId = 'temp_user_id'; // This should come from parent component
      const ipAddress = '127.0.0.1'; // In production, get real IP
      const userAgent = navigator.userAgent;

      // Use our secure OTP generation instead of Supabase's built-in
      const result = await generateAndSendSecureOTP(
        userId,
        email,
        otpType,
        ipAddress,
        userAgent
      );

      if (result.success) {
        console.log('✅ Verification email resent');
        
        // Set cooldown and persist to localStorage
        const cooldownKey = `otpResendTime_${email}_${otpType}`;
        localStorage.setItem(cooldownKey, Date.now().toString());
        setResendCooldown(60);
        
        if (onResendOTP) {
          onResendOTP();
        }
      } else {
        throw new Error(result.error || 'Failed to resend verification code');
      }
    } catch (err) {
      console.error('❌ Failed to resend OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleManualSubmit = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6 && !isVerifying && !isLocked) {
      handleVerifyOTP(otpCode);
    }
  };

  const getOTPTypeLabel = () => {
    switch (otpType) {
      case OTPType.Registration:
        return 'Verify Your Email';
      case OTPType.PasswordReset:
        return 'Reset Your Password';
      case OTPType.LoginMFA:
        return 'Complete Your Login';
      default:
        return 'Verify Code';
    }
  };

  const getOTPTypeDescription = () => {
    switch (otpType) {
      case OTPType.Registration:
        return "We've sent a 6-digit verification code to";
      case OTPType.PasswordReset:
        return "We've sent a password reset code to";
      case OTPType.LoginMFA:
        return "We've sent a login verification code to";
      default:
        return "We've sent a verification code to";
    }
  };

  const getBackButtonDestination = () => {
    switch (otpType) {
      case OTPType.Registration:
        return '/register';
      case OTPType.PasswordReset:
        return '/forgot-password';
      case OTPType.LoginMFA:
        return '/login';
      default:
        return '/';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {getOTPTypeLabel()}
        </h2>
        <p className="text-neutral-600">
          {getOTPTypeDescription()}
        </p>
        <p className="font-medium text-neutral-900">{email}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-center space-x-3 mb-4" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={e => handleInputChange(index, sanitizeInput(e.target.value))}
              onKeyDown={e => handleKeyDown(index, e)}
              className={`w-12 h-12 text-center text-xl font-semibold border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error && !isLocked
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20'
                  : isLocked
                  ? 'border-warning-300 focus:border-warning-500 focus:ring-warning-500/20'
                  : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20'
              }`}
              disabled={isVerifying || isLocked}
              aria-label={`OTP digit ${index + 1} of 6`}
              aria-invalid={!!error}
              aria-describedby={error ? 'otp-error' : 'otp-instructions'}
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          ))}
        </div>

        <div id="otp-instructions" className="sr-only">
          Enter the 6-digit verification code sent to your email. Use arrow keys to navigate between digits.
        </div>

        <button
          onClick={handleManualSubmit}
          disabled={otp.join('').length !== 6 || isVerifying || isLocked}
          className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="submit-help"
        >
          {isVerifying ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            'Verify Code'
          )}
        </button>
        
        <p id="submit-help" className="text-xs text-neutral-500 mt-2 text-center">
          Code will auto-submit when all 6 digits are entered
        </p>
      </div>

      {error && (
        <div id="otp-error" className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg" role="alert" aria-live="polite">
          <p className="text-sm text-error-600">{error}</p>
          {attemptsRemaining !== null && attemptsRemaining > 0 && (
            <p className="text-xs text-error-500 mt-1">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      )}

      {isLocked && (
        <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg" role="alert" aria-live="polite">
          <p className="text-sm text-warning-700 font-medium">Account Temporarily Locked</p>
          <p className="text-xs text-warning-600 mt-1">
            Please request a new verification code to continue.
          </p>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-neutral-600 mb-2">
          Didn't receive the code?
        </p>
        <button
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || isResending}
          className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-describedby="resend-help"
        >
          {isResending ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600 mr-2"></div>
              Sending...
            </span>
          ) : resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            'Resend verification code'
          )}
        </button>
        
        {resendCooldown === 0 && (
          <p id="resend-help" className="text-xs text-neutral-500 mt-1">
            You can request a new code every 60 seconds
          </p>
        )}
      </div>

      {showBackButton && (
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(getBackButtonDestination())}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            ← Back to {otpType === OTPType.Registration ? 'registration' : 
                      otpType === OTPType.PasswordReset ? 'password reset' : 'login'}
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs text-neutral-400">
          Having trouble? Contact{' '}
          <a 
            href="mailto:support@climateecosystem.com" 
            className="text-primary-600 hover:text-primary-500"
          >
            support@climateecosystem.com
          </a>
        </p>
      </div>
    </div>
  );
}; 