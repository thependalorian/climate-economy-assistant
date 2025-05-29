/**
 * Email Template Helpers
 * 
 * Provides reusable email template components and wrappers
 * to maintain consistent branding and reduce code duplication.
 * Located in /lib/email/templates.ts for template utilities
 */

// Brand constants for consistent styling
export const BRAND_COLORS = {
  primary: '#059669',      // Green for success/primary actions
  secondary: '#6b7280',    // Gray for secondary text
  danger: '#dc2626',       // Red for warnings/resets
  info: '#2563eb',         // Blue for info/MFA
  background: '#f9fafb',   // Light gray background
  white: '#ffffff',        // White for cards
  border: '#e5e7eb',       // Light border color
  muted: '#9ca3af'         // Muted text color
} as const;

export const EMAIL_PREFIX = '[Climate Ecosystem] ';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Wrap email content with consistent branding and layout
 */
export function wrapEmailBody(content: string, textContent?: string): { html: string; text: string } {
  const html = `
    <main style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${BRAND_COLORS.white};">
      <header style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid ${BRAND_COLORS.border};">
        <h1 style="color: ${BRAND_COLORS.primary}; margin: 0; font-size: 24px; font-weight: bold;">Climate Ecosystem Assistant</h1>
        <p style="color: ${BRAND_COLORS.secondary}; margin: 5px 0 0 0; font-size: 14px;">Clean Energy Career Platform</p>
      </header>
      
      <section style="background: ${BRAND_COLORS.background}; border-radius: 8px; padding: 30px;">
        ${content}
      </section>
      
      <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid ${BRAND_COLORS.border};">
        <p style="color: ${BRAND_COLORS.muted}; font-size: 12px; margin: 0;">
          Climate Ecosystem Assistant - Connecting clean energy careers
        </p>
        <p style="color: ${BRAND_COLORS.muted}; font-size: 12px; margin: 5px 0 0 0;">
          If you have questions, contact us at support@climateecosystem.com
        </p>
      </footer>
    </main>
  `;

  const text = textContent || `
Climate Ecosystem Assistant - Clean Energy Career Platform

${content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}

---
Climate Ecosystem Assistant - Connecting clean energy careers
Questions? Contact us at support@climateecosystem.com
  `;

  return { html, text };
}

/**
 * Create OTP code display component
 */
export function createOTPDisplay(otp: string, color: string = BRAND_COLORS.primary): string {
  return `
    <div style="background: ${BRAND_COLORS.white}; border: 2px solid ${color}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 32px; font-weight: bold; color: ${color}; letter-spacing: 8px; font-family: monospace;">
        ${otp}
      </div>
    </div>
  `;
}

/**
 * Create call-to-action button
 */
export function createCTAButton(text: string, url: string, color: string = BRAND_COLORS.primary): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: ${color}; color: ${BRAND_COLORS.white}; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Generate OTP email template with enhanced styling
 */
export function generateOTPEmailTemplate(otp: string, type: 'registration' | 'password_reset' | 'login_mfa'): EmailTemplate {
  const templates = {
    registration: {
      subject: `${EMAIL_PREFIX}Verify Your Account`,
      color: BRAND_COLORS.primary,
      title: 'Verify Your Email Address',
      message: 'Welcome to the Climate Ecosystem! Please use the verification code below to confirm your email address:',
      footer: 'This code will expire in 10 minutes. If you didn\'t request this verification, please ignore this email.'
    },
    password_reset: {
      subject: `${EMAIL_PREFIX}Reset Your Password`,
      color: BRAND_COLORS.danger,
      title: 'Reset Your Password',
      message: 'You requested a password reset. Please use the verification code below:',
      footer: 'This code will expire in 10 minutes. If you didn\'t request this reset, please ignore this email and consider changing your password.'
    },
    login_mfa: {
      subject: `${EMAIL_PREFIX}Login Verification Code`,
      color: BRAND_COLORS.info,
      title: 'Login Verification',
      message: 'Please use the verification code below to complete your login:',
      footer: 'This code will expire in 10 minutes. If you didn\'t attempt to log in, please secure your account immediately.'
    }
  };

  const template = templates[type];
  
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; text-align: center; font-size: 20px;">${template.title}</h2>
    <p style="color: ${BRAND_COLORS.secondary}; margin: 0 0 30px 0; text-align: center; font-size: 16px; line-height: 1.5;">
      ${template.message}
    </p>
    
    ${createOTPDisplay(otp, template.color)}
    
    <p style="color: ${BRAND_COLORS.secondary}; font-size: 14px; margin: 20px 0 0 0; text-align: center; line-height: 1.4;">
      ${template.footer}
    </p>
  `;

  const { html, text } = wrapEmailBody(content);

  return {
    subject: template.subject,
    html,
    text
  };
}

/**
 * Generate welcome email template
 */
export function generateWelcomeEmailTemplate(
  firstName: string, 
  userType: 'job_seeker' | 'partner'
): EmailTemplate {
  const welcomeMessages = {
    job_seeker: {
      subject: `${EMAIL_PREFIX}Welcome to the Climate Ecosystem!`,
      title: `Welcome ${firstName}!`,
      message: 'You\'re now part of the Climate Ecosystem community. Start exploring clean energy career opportunities that align with your values and skills.',
      ctaText: 'Explore Opportunities',
      benefits: [
        'Access to exclusive climate job postings',
        'Career development resources',
        'Networking with climate professionals',
        'Skills assessments and recommendations'
      ]
    },
    partner: {
      subject: `${EMAIL_PREFIX}Welcome to the Partner Network!`,
      title: `Welcome ${firstName}!`,
      message: 'Thank you for joining the Climate Ecosystem as a partner organization. Start connecting with talented professionals passionate about climate solutions.',
      ctaText: 'Access Partner Dashboard',
      benefits: [
        'Post job opportunities to climate-focused candidates',
        'Access to pre-screened talent pool',
        'Partner networking opportunities',
        'Recruitment analytics and insights'
      ]
    }
  };

  const welcome = welcomeMessages[userType];
  const dashboardUrl = `${import.meta.env.VITE_APP_URL}/dashboard`;

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; text-align: center; font-size: 24px; font-weight: bold;">${welcome.title}</h2>
    
    <p style="color: #111827; margin: 0 0 25px 0; text-align: center; font-size: 16px; line-height: 1.6;">
      ${welcome.message}
    </p>

    ${createCTAButton(welcome.ctaText, dashboardUrl)}

    <div style="margin: 30px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; text-align: center;">What's Next?</h3>
      <ul style="color: ${BRAND_COLORS.secondary}; font-size: 14px; line-height: 1.6; padding-left: 20px;">
        ${welcome.benefits.map(benefit => `<li style="margin: 8px 0;">${benefit}</li>`).join('')}
      </ul>
    </div>

    <div style="background: ${BRAND_COLORS.white}; border-radius: 6px; padding: 20px; margin: 25px 0; border-left: 4px solid ${BRAND_COLORS.primary};">
      <p style="color: #111827; margin: 0 0 10px 0; font-weight: bold; font-size: 14px;">Need Help Getting Started?</p>
      <p style="color: ${BRAND_COLORS.secondary}; margin: 0; font-size: 14px; line-height: 1.5;">
        Our team is here to help! Check out our <a href="${import.meta.env.VITE_APP_URL}/help" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Help Center</a> 
        or contact us directly at support@climateecosystem.com
      </p>
    </div>

    <p style="color: ${BRAND_COLORS.secondary}; margin: 25px 0 0 0; text-align: center; font-size: 14px;">
      Thanks for joining the movement towards a sustainable future!<br>
      <strong style="color: #111827;">The Climate Ecosystem Team</strong>
    </p>
  `;

  const { html, text } = wrapEmailBody(content);

  return {
    subject: welcome.subject,
    html,
    text
  };
}

/**
 * Generate security alert email template
 */
export function generateSecurityAlertTemplate(
  alertType: string,
  details: string,
  userEmail: string
): EmailTemplate {
  const content = `
    <h2 style="color: ${BRAND_COLORS.danger}; margin: 0 0 20px 0; text-align: center; font-size: 20px;">Security Alert</h2>
    
    <div style="background: ${BRAND_COLORS.white}; border: 1px solid ${BRAND_COLORS.danger}; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="color: #111827; margin: 0 0 15px 0; font-weight: bold;">Alert Type: ${alertType}</p>
      <p style="color: ${BRAND_COLORS.secondary}; margin: 0 0 15px 0; line-height: 1.5;">${details}</p>
      <p style="color: ${BRAND_COLORS.secondary}; margin: 0; font-size: 14px;">
        If this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication.
      </p>
    </div>

    ${createCTAButton('Secure My Account', `${import.meta.env.VITE_APP_URL}/security`, BRAND_COLORS.danger)}

    <p style="color: ${BRAND_COLORS.secondary}; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
      This alert was sent to ${userEmail}. If you need assistance, contact our security team immediately.
    </p>
  `;

  const { html, text } = wrapEmailBody(content);

  return {
    subject: `${EMAIL_PREFIX}Security Alert - Immediate Action Required`,
    html,
    text
  };
} 