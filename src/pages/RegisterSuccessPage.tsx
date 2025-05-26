import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RegisterSuccessPageProps {
  email?: string;
}

/**
 * Registration Success Page
 * 
 * Displays after successful user registration, prompting email verification.
 * Provides options to resend confirmation email and clear instructions.
 * Located in /pages/ for main application pages.
 */
export const RegisterSuccessPage: React.FC<RegisterSuccessPageProps> = ({ email }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use email from props or try to get from localStorage
  const userEmail = email || localStorage.getItem('pendingConfirmationEmail') || '';

  const handleResendEmail = async () => {
    if (!userEmail) {
      setResendStatus('error');
      setErrorMessage('No email address found. Please try registering again.');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      setResendStatus('success');
    } catch (err) {
      setResendStatus('error');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to resend confirmation email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            
            <p className="text-gray-600 mb-6">
              We've sent a confirmation link to:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">{userEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-medium mb-2">Next steps:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>You'll be redirected to complete your profile</li>
              </ol>
            </div>
            
            {resendStatus === 'success' && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmation email resent successfully! Please check your inbox.
                </div>
              </div>
            )}
            
            {resendStatus === 'error' && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                <p className="font-medium">Error sending email</p>
                <p>{errorMessage || 'Failed to resend confirmation email. Please try again.'}</p>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend confirmation email
                  </>
                )}
              </button>
              
              <Link
                to="/register"
                className="w-full flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to registration
              </Link>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
