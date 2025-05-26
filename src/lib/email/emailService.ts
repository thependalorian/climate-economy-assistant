/**
 * Email Service
 * 
 * Handles sending emails for authentication and notifications.
 * Supports multiple email providers and includes email templates.
 * Located in /lib/email/ for email-related services.
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Generate OTP email template
 */
export function generateOTPEmailTemplate(otp: string, type: 'registration' | 'password_reset' | 'login_mfa'): EmailTemplate {
  const templates = {
    registration: {
      subject: 'Verify Your Climate Ecosystem Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">Climate Ecosystem Assistant</h1>
            <p style="color: #6b7280; margin: 5px 0;">Clean Energy Career Platform</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #111827; margin: 0 0 20px 0;">Verify Your Email Address</h2>
            <p style="color: #6b7280; margin: 0 0 30px 0;">
              Welcome to the Climate Ecosystem! Please use the verification code below to confirm your email address:
            </p>
            
            <div style="background: white; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <div style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Climate Ecosystem Assistant - Connecting clean energy careers
            </p>
          </div>
        </div>
      `,
      text: `
Climate Ecosystem Assistant - Email Verification

Welcome to the Climate Ecosystem! Please use the verification code below to confirm your email address:

Verification Code: ${otp}

This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.

Climate Ecosystem Assistant - Connecting clean energy careers
      `
    },
    password_reset: {
      subject: 'Reset Your Climate Ecosystem Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">Climate Ecosystem Assistant</h1>
            <p style="color: #6b7280; margin: 5px 0;">Clean Energy Career Platform</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #111827; margin: 0 0 20px 0;">Reset Your Password</h2>
            <p style="color: #6b7280; margin: 0 0 30px 0;">
              You requested a password reset. Please use the verification code below:
            </p>
            
            <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <div style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
              This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Climate Ecosystem Assistant - Connecting clean energy careers
            </p>
          </div>
        </div>
      `,
      text: `
Climate Ecosystem Assistant - Password Reset

You requested a password reset. Please use the verification code below:

Verification Code: ${otp}

This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.

Climate Ecosystem Assistant - Connecting clean energy careers
      `
    },
    login_mfa: {
      subject: 'Climate Ecosystem Login Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">Climate Ecosystem Assistant</h1>
            <p style="color: #6b7280; margin: 5px 0;">Clean Energy Career Platform</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #111827; margin: 0 0 20px 0;">Login Verification</h2>
            <p style="color: #6b7280; margin: 0 0 30px 0;">
              Please use the verification code below to complete your login:
            </p>
            
            <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
              This code will expire in 10 minutes. If you didn't attempt to log in, please secure your account.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Climate Ecosystem Assistant - Connecting clean energy careers
            </p>
          </div>
        </div>
      `,
      text: `
Climate Ecosystem Assistant - Login Verification

Please use the verification code below to complete your login:

Verification Code: ${otp}

This code will expire in 10 minutes. If you didn't attempt to log in, please secure your account.

Climate Ecosystem Assistant - Connecting clean energy careers
      `
    }
  };

  return templates[type];
}

/**
 * Send email using console logging (development mode)
 */
export async function sendEmailDev(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 [DEV MODE] Email would be sent:');
    console.log('📧 To:', options.to);
    console.log('📧 Subject:', options.subject);
    console.log('📧 Text Content:');
    console.log(options.text || 'No text content');
    console.log('📧 HTML Content:');
    console.log(options.html || 'No HTML content');
    console.log('📧 ================================');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  } catch (error) {
    console.error('❌ [DEV MODE] Email sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  email: string, 
  otp: string, 
  type: 'registration' | 'password_reset' | 'login_mfa'
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = generateOTPEmailTemplate(otp, type);
    
    // In development, use console logging
    if (import.meta.env.DEV || !import.meta.env.VITE_EMAIL_PROVIDER) {
      return await sendEmailDev({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    }
    
    // In production, you would integrate with your email service
    // Examples: SendGrid, AWS SES, Mailgun, etc.
    console.warn('⚠️ Production email service not configured. Using dev mode.');
    return await sendEmailDev({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const welcomeMessages = {
      job_seeker: {
        subject: 'Welcome to the Climate Ecosystem!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669;">Welcome ${firstName}!</h1>
            <p>You're now part of the Climate Ecosystem community. Start exploring clean energy career opportunities today!</p>
            <a href="${import.meta.env.VITE_APP_URL}/dashboard" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Explore Opportunities
            </a>
          </div>
        `,
        text: `Welcome ${firstName}! You're now part of the Climate Ecosystem community. Start exploring clean energy career opportunities today!`
      },
      partner: {
        subject: 'Welcome to the Climate Ecosystem Partner Network!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669;">Welcome ${firstName}!</h1>
            <p>Thank you for joining the Climate Ecosystem as a partner. Start connecting with talented professionals in the clean energy sector!</p>
            <a href="${import.meta.env.VITE_APP_URL}/dashboard" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Access Partner Dashboard
            </a>
          </div>
        `,
        text: `Welcome ${firstName}! Thank you for joining the Climate Ecosystem as a partner. Start connecting with talented professionals in the clean energy sector!`
      }
    };

    const template = welcomeMessages[userType];
    
    return await sendEmailDev({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send welcome email' 
    };
  }
} 