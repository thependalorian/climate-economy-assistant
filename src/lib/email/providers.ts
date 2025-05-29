/**
 * Email Provider Abstractions
 * 
 * Handles production email sending through various providers
 * Currently supports: SendGrid, AWS SES, Mailgun, Resend
 * Located in /lib/email/providers.ts for email provider services
 */

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface EmailResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send email using Resend (recommended for climate tech)
 */
export async function sendEmailResend(options: EmailOptions): Promise<EmailResponse> {
  try {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: import.meta.env.VITE_EMAIL_FROM || 'Climate Ecosystem <noreply@climateecosystem.com>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    return { 
      success: true, 
      messageId: result.id 
    };

  } catch (error) {
    console.error('❌ Resend email failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email sending failed' 
    };
  }
}

/**
 * Send email using SendGrid
 */
export async function sendEmailSendGrid(options: EmailOptions): Promise<EmailResponse> {
  try {
    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
          subject: options.subject,
        }],
        from: { 
          email: import.meta.env.VITE_EMAIL_FROM || 'noreply@climateecosystem.com',
          name: 'Climate Ecosystem'
        },
        content: [
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ...(options.html ? [{ type: 'text/html', value: options.html }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    return { success: true };

  } catch (error) {
    console.error('❌ SendGrid email failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email sending failed' 
    };
  }
}

/**
 * Send email using AWS SES
 */
export async function sendEmailSES(): Promise<EmailResponse> {
  try {
    // Note: This would require AWS SDK setup
    // For now, return placeholder implementation
    console.warn('⚠️ AWS SES integration not yet implemented');
    return { 
      success: false, 
      error: 'AWS SES provider not implemented yet' 
    };

  } catch (error) {
    console.error('❌ AWS SES email failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email sending failed' 
    };
  }
}

/**
 * Send email using Mailgun
 */
export async function sendEmailMailgun(options: EmailOptions): Promise<EmailResponse> {
  try {
    const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
    const domain = import.meta.env.VITE_MAILGUN_DOMAIN;
    
    if (!apiKey || !domain) {
      throw new Error('Mailgun API key or domain not configured');
    }

    const formData = new FormData();
    formData.append('from', import.meta.env.VITE_EMAIL_FROM || 'Climate Ecosystem <noreply@climateecosystem.com>');
    formData.append('to', options.to);
    formData.append('subject', options.subject);
    if (options.text) formData.append('text', options.text);
    if (options.html) formData.append('html', options.html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun API error: ${error}`);
    }

    const result = await response.json();
    return { 
      success: true, 
      messageId: result.id 
    };

  } catch (error) {
    console.error('❌ Mailgun email failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email sending failed' 
    };
  }
}

/**
 * Main production email sender with provider fallback
 */
export async function sendEmailProd(options: EmailOptions): Promise<EmailResponse> {
  const provider = import.meta.env.VITE_EMAIL_PROVIDER?.toLowerCase();
  
  try {
    switch (provider) {
      case 'resend':
        return await sendEmailResend(options);
      case 'sendgrid':
        return await sendEmailSendGrid(options);
      case 'mailgun':
        return await sendEmailMailgun(options);
      case 'ses':
        return await sendEmailSES();
      default:
        // Default to Resend as it's climate-tech friendly
        if (import.meta.env.VITE_RESEND_API_KEY) {
          return await sendEmailResend(options);
        }
        throw new Error('No email provider configured');
    }
  } catch (error) {
    console.error('❌ Production email sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email sending failed' 
    };
  }
}

/**
 * Email rate limiting check
 */
export async function checkEmailRateLimit(
  identifier: string, 
  maxEmails: number = 5, 
  windowMinutes: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // This could be implemented with Redis or database-based rate limiting
    // For now, return a simple check
    
    // In a real implementation, you'd check against a cache/database
    // For now, allow all emails but log the check
    console.log(`📧 Rate limit check for ${identifier}: ${maxEmails} emails per ${windowMinutes} minutes`);
    
    return { allowed: true, remaining: maxEmails };
  } catch (error) {
    console.error('❌ Rate limit check failed:', error);
    // Default to allowing email on error
    return { allowed: true, remaining: 0 };
  }
} 