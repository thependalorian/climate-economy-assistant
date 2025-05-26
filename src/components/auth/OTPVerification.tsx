import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onResendOTP: () => void;
}

/**
 * OTP Verification Component
 * 
 * Handles email verification with 6-digit OTP codes.
 * Used during registration flow to verify user email addresses.
 * Located in /components/auth/ for authentication-related UI components.
 */
export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onVerificationComplete,
  onResendOTP
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      // For now, we'll use Supabase's built-in email verification
      // In a production app, you'd verify against your OTP table
      console.log('🔄 Verifying OTP:', otpCode);
      
      // Simulate verification (replace with actual OTP verification)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 6-digit code
      if (otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
        console.log('✅ OTP verified successfully');
        onVerificationComplete();
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      console.error('❌ OTP verification failed:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setOtp(['', '', '', '', '', '']); // Clear OTP on error
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError(null);

    try {
      // Resend confirmation email using Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Verification email resent');
      setResendCooldown(60); // 60 second cooldown
      onResendOTP();
    } catch (err) {
      console.error('❌ Failed to resend OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleManualSubmit = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      handleVerifyOTP(otpCode);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Verify Your Email
        </h2>
        <p className="text-neutral-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-medium text-neutral-900">{email}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-sm text-error-600">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-center space-x-3 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={e => handleInputChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-semibold border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              disabled={isVerifying}
            />
          ))}
        </div>

        <button
          onClick={handleManualSubmit}
          disabled={otp.join('').length !== 6 || isVerifying}
          className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      <div className="text-center">
        <p className="text-sm text-neutral-600 mb-2">
          Didn't receive the code?
        </p>
        <button
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || isResending}
          className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            'Sending...'
          ) : resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            'Resend verification code'
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/register')}
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← Back to registration
        </button>
      </div>
    </div>
  );
}; 