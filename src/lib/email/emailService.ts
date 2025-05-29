/**
 * Enhanced Email Service
 * 
 * Production-ready email service with multiple provider support,
 * consistent branding, rate limiting, and comprehensive error handling.
 * Located in /lib/email/ for email-related services.
 */

import { sendEmailProd, checkEmailRateLimit } from './providers';
import { 
  generateOTPEmailTemplate, 
  generateWelcomeEmailTemplate,
  generateSecurityAlertTemplate,
  EMAIL_PREFIX 
} from './templates';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
  rateLimited?: boolean;
}

/**
 * Send email using console logging (development mode)
 */
export async function sendEmailDev(options: EmailOptions): Promise<EmailResult> {
  try {
    console.log('📧 [DEV MODE] Email would be sent:');
    console.log('📧 To:', options.to);
    console.log('📧 Subject:', options.subject);
    console.log('📧 Text Content:');
    console.log(options.text || 'No text content');
    console.log('📧 HTML Content (truncated):');
    console.log((options.html || 'No HTML content').substring(0, 200) + '...');
    console.log('📧 ================================');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, messageId: `dev_${Date.now()}` };
  } catch (error) {
    console.error('❌ [DEV MODE] Email sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send email with rate limiting and provider fallback
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Check rate limiting
    const rateLimitResult = await checkEmailRateLimit(options.to);
    if (!rateLimitResult.allowed) {
      console.warn(`📧 Rate limit exceeded for ${options.to}`);
      return {
        success: false,
        error: 'Email rate limit exceeded. Please try again later.',
        rateLimited: true
      };
    }

    // Add brand prefix to subject if not already present
    const subject = options.subject.startsWith(EMAIL_PREFIX) 
      ? options.subject 
      : `${EMAIL_PREFIX}${options.subject}`;

    const emailOptions = { ...options, subject };

    // In development, use console logging
    if (import.meta.env.DEV || !import.meta.env.VITE_EMAIL_PROVIDER) {
      return await sendEmailDev(emailOptions);
    }
    
    // In production, use configured email provider
    const result = await sendEmailProd(emailOptions);
    
    if (result.success) {
      console.log(`✅ Email sent successfully to ${options.to} via production provider`);
    } else {
      console.error(`❌ Production email failed for ${options.to}:`, result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Send OTP email with enhanced templates
 */
export async function sendOTPEmail(
  email: string, 
  otp: string, 
  type: 'registration' | 'password_reset' | 'login_mfa'
): Promise<EmailResult> {
  try {
    const template = generateOTPEmailTemplate(otp, type);
    
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    if (result.success) {
      console.log(`✅ OTP email (${type}) sent successfully to ${email}`);
    }

    return result;
    
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send OTP email' 
    };
  }
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(
  email: string, 
  firstName: string,
  userType: 'job_seeker' | 'partner'
): Promise<EmailResult> {
  try {
    const template = generateWelcomeEmailTemplate(firstName, userType);
    
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    if (result.success) {
      console.log(`✅ Welcome email sent successfully to ${email} (${userType})`);
    }

    return result;
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send welcome email' 
    };
  }
}

/**
 * Send security alert email
 */
export async function sendSecurityAlert(
  email: string,
  alertType: string,
  details: string
): Promise<EmailResult> {
  try {
    const template = generateSecurityAlertTemplate(alertType, details, email);
    
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    if (result.success) {
      console.log(`✅ Security alert sent successfully to ${email} (${alertType})`);
    }

    return result;
    
  } catch (error) {
    console.error('❌ Failed to send security alert:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send security alert' 
    };
  }
}

/**
 * Send account suspension notification
 */
export async function sendAccountSuspensionEmail(
  email: string,
  firstName: string,
  reason: string,
  isUnsuspension: boolean = false
): Promise<EmailResult> {
  try {
    const action = isUnsuspension ? 'reactivated' : 'suspended';
    const actionTitle = isUnsuspension ? 'Account Reactivated' : 'Account Suspended';
    
    const subject = `${EMAIL_PREFIX}Your Account Has Been ${action.charAt(0).toUpperCase() + action.slice(1)}`;
    
    const content = `
      <h2 style="color: ${isUnsuspension ? '#059669' : '#dc2626'}; margin: 0 0 20px 0; text-align: center; font-size: 20px;">${actionTitle}</h2>
      
      <p style="color: #111827; margin: 0 0 20px 0; text-align: center; font-size: 16px;">
        Hello ${firstName},
      </p>
      
      <p style="color: #6b7280; margin: 0 0 25px 0; text-align: center; font-size: 16px; line-height: 1.6;">
        ${isUnsuspension 
          ? 'Your Climate Ecosystem account has been reactivated. You can now access all platform features.'
          : 'Your Climate Ecosystem account has been temporarily suspended due to the following reason:'
        }
      </p>
      
      ${!isUnsuspension ? `
        <div style="background: #ffffff; border: 1px solid #dc2626; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <p style="color: #111827; margin: 0; font-weight: bold;">Reason: ${reason}</p>
        </div>
      ` : ''}
      
      <p style="color: #6b7280; margin: 25px 0 0 0; text-align: center; font-size: 14px;">
        ${isUnsuspension 
          ? 'If you have any questions, please contact our support team.'
          : 'If you believe this is an error or would like to appeal, please contact our support team at support@climateecosystem.com'
        }
      </p>
    `;

    const html = `
      <main style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <section style="background: #f9fafb; border-radius: 8px; padding: 30px;">
          ${content}
        </section>
      </main>
    `;

    const text = `
${actionTitle}

Hello ${firstName},

${isUnsuspension 
  ? 'Your Climate Ecosystem account has been reactivated. You can now access all platform features.'
  : `Your Climate Ecosystem account has been temporarily suspended.\n\nReason: ${reason}`
}

${isUnsuspension 
  ? 'If you have any questions, please contact our support team.'
  : 'If you believe this is an error or would like to appeal, please contact our support team at support@climateecosystem.com'
}

Climate Ecosystem Team
    `;

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text
    });

    if (result.success) {
      console.log(`✅ Account ${action} email sent successfully to ${email}`);
    }

    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send account ${isUnsuspension ? 'reactivation' : 'suspension'} email:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send account notification email' 
    };
  }
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangeConfirmation(
  email: string,
  firstName: string,
  ipAddress: string,
  timestamp: Date
): Promise<EmailResult> {
  try {
    const subject = `${EMAIL_PREFIX}Password Changed Successfully`;
    
    const content = `
      <h2 style="color: #059669; margin: 0 0 20px 0; text-align: center; font-size: 20px;">Password Changed</h2>
      
      <p style="color: #111827; margin: 0 0 20px 0; text-align: center; font-size: 16px;">
        Hello ${firstName},
      </p>
      
      <p style="color: #6b7280; margin: 0 0 25px 0; text-align: center; font-size: 16px; line-height: 1.6;">
        Your Climate Ecosystem account password was successfully changed.
      </p>
      
      <div style="background: #ffffff; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #059669;">
        <p style="color: #111827; margin: 0 0 10px 0; font-size: 14px;"><strong>Change Details:</strong></p>
        <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">Time: ${timestamp.toLocaleString()}</p>
        <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">IP Address: ${ipAddress}</p>
      </div>
      
      <p style="color: #6b7280; margin: 25px 0 0 0; text-align: center; font-size: 14px;">
        If you did not make this change, please contact our security team immediately at security@climateecosystem.com
      </p>
    `;

    const html = `
      <main style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <section style="background: #f9fafb; border-radius: 8px; padding: 30px;">
          ${content}
        </section>
      </main>
    `;

    const text = `
Password Changed Successfully

Hello ${firstName},

Your Climate Ecosystem account password was successfully changed.

Change Details:
- Time: ${timestamp.toLocaleString()}
- IP Address: ${ipAddress}

If you did not make this change, please contact our security team immediately at security@climateecosystem.com

Climate Ecosystem Team
    `;

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text
    });

    if (result.success) {
      console.log(`✅ Password change confirmation sent successfully to ${email}`);
    }

    return result;
    
  } catch (error) {
    console.error('❌ Failed to send password change confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send password change confirmation' 
    };
  }
} 