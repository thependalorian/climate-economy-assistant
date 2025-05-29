# Email Service Configuration Guide

## Overview

The Climate Ecosystem Assistant supports multiple email providers for production-ready email delivery. This guide covers setup and configuration for all supported providers.

## Quick Start

### 1. Choose Your Email Provider

We recommend **Resend** for climate tech applications, but support multiple providers:

- **[Resend](https://resend.com/)** - Recommended for modern applications
- **[SendGrid](https://sendgrid.com/)** - Enterprise-grade email service
- **[Mailgun](https://mailgun.com/)** - Developer-friendly email API
- **[AWS SES](https://aws.amazon.com/ses/)** - Cost-effective for high volume

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Application Configuration
VITE_APP_URL=http://localhost:3000
VITE_ENVIRONMENT=development

# Email Provider Selection
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_FROM=Climate Ecosystem <noreply@climateecosystem.com>

# Provider-specific API key (choose one)
VITE_RESEND_API_KEY=re_your_api_key
# OR
VITE_SENDGRID_API_KEY=SG.your_api_key
# OR
VITE_MAILGUN_API_KEY=your_api_key
VITE_MAILGUN_DOMAIN=your_domain.com
```

## Provider Setup Instructions

### Resend (Recommended)

**Why Resend?**
- Modern, developer-friendly API
- Great deliverability rates
- Climate-tech friendly company
- Excellent React/Next.js integration

**Setup:**
1. Sign up at [resend.com](https://resend.com/)
2. Create an API key
3. Add to your environment:
```bash
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_your_api_key
VITE_EMAIL_FROM=Climate Ecosystem <noreply@yourdomain.com>
```

**Domain Verification:**
- Add your domain in Resend dashboard
- Add required DNS records
- Verify domain ownership

### SendGrid

**Setup:**
1. Sign up at [sendgrid.com](https://sendgrid.com/)
2. Create an API key with Mail Send permissions
3. Add to your environment:
```bash
VITE_EMAIL_PROVIDER=sendgrid
VITE_SENDGRID_API_KEY=SG.your_sendgrid_api_key
VITE_EMAIL_FROM=noreply@yourdomain.com
```

**Domain Authentication:**
- Go to Settings > Sender Authentication
- Authenticate your domain
- Add CNAME records to your DNS

### Mailgun

**Setup:**
1. Sign up at [mailgun.com](https://mailgun.com/)
2. Add and verify your domain
3. Get your API key from the dashboard
4. Add to your environment:
```bash
VITE_EMAIL_PROVIDER=mailgun
VITE_MAILGUN_API_KEY=your_mailgun_api_key
VITE_MAILGUN_DOMAIN=mg.yourdomain.com
VITE_EMAIL_FROM=Climate Ecosystem <noreply@yourdomain.com>
```

### AWS SES

**Setup:**
1. Configure AWS credentials
2. Verify your domain/email in SES console
3. Move out of sandbox mode for production
4. Add to your environment:
```bash
VITE_EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

## Development Mode

In development, emails are logged to the console instead of being sent:

```bash
# Development settings
VITE_ENVIRONMENT=development
# No email provider needed for dev mode
```

Console output will show:
```
📧 [DEV MODE] Email would be sent:
📧 To: user@example.com
📧 Subject: [Climate Ecosystem] Verify Your Account
📧 Text Content: Welcome to Climate Ecosystem...
```

## Production Deployment

### Vercel Configuration

Add environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to Environment Variables
3. Add all required email configuration variables
4. Redeploy your application

### Required Variables for Production:
```bash
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_live_your_production_key
VITE_EMAIL_FROM=Climate Ecosystem <noreply@yourdomain.com>
VITE_APP_URL=https://yourdomain.com
VITE_ENVIRONMENT=production
```

## Email Templates

The system includes branded email templates for:

### Registration Verification
- **Subject:** `[Climate Ecosystem] Verify Your Account`
- **Content:** Welcome message with 6-digit OTP
- **Color:** Green (`#059669`)

### Password Reset
- **Subject:** `[Climate Ecosystem] Reset Your Password`
- **Content:** Password reset instructions with OTP
- **Color:** Red (`#dc2626`)

### MFA Login
- **Subject:** `[Climate Ecosystem] Login Verification Code`
- **Content:** Login verification with OTP
- **Color:** Blue (`#2563eb`)

### Welcome Email
- **Subject:** `[Climate Ecosystem] Welcome to the Climate Ecosystem!`
- **Content:** Onboarding information and next steps
- **Includes:** Dashboard link, feature benefits, help resources

## Rate Limiting

The email service includes built-in rate limiting:

- **Default:** 5 emails per 10 minutes per email address
- **Configurable:** Adjust limits in `checkEmailRateLimit()`
- **Protection:** Prevents spam and abuse

## Monitoring and Analytics

### Email Delivery Tracking

Track email success rates:
```typescript
const result = await sendOTPEmail(email, otp, 'registration');
if (result.success) {
  // Log successful delivery
  console.log(`Email sent: ${result.messageId}`);
} else {
  // Log delivery failure
  console.error(`Email failed: ${result.error}`);
}
```

### Provider-Specific Analytics

- **Resend:** Built-in analytics dashboard
- **SendGrid:** Email Activity Feed
- **Mailgun:** Message tracking and analytics
- **AWS SES:** CloudWatch metrics

## Troubleshooting

### Common Issues

**Emails not sending:**
1. Check API key is correct
2. Verify domain authentication
3. Check rate limiting
4. Review provider-specific logs

**Emails going to spam:**
1. Set up SPF, DKIM, and DMARC records
2. Warm up your sending domain
3. Monitor sender reputation
4. Use consistent from address

**Development mode not working:**
1. Ensure `VITE_ENVIRONMENT=development`
2. Check console output
3. Verify no production email provider is set

### Provider-Specific Troubleshooting

**Resend:**
- Check domain verification status
- Review API logs in dashboard
- Ensure correct API endpoint

**SendGrid:**
- Verify sender authentication
- Check suppression lists
- Review activity feed

**Mailgun:**
- Confirm domain verification
- Check route configuration
- Review message logs

## Security Best Practices

### API Key Management
- Use different keys for development/production
- Rotate keys regularly
- Never commit keys to version control
- Use environment variables only

### Domain Security
- Enable SPF records: `v=spf1 include:_spf.yourdomain.com ~all`
- Set up DKIM signing
- Configure DMARC policy
- Monitor for domain spoofing

### Rate Limiting
- Implement per-user email limits
- Monitor for suspicious activity
- Log all email attempts
- Use exponential backoff for retries

### Content Security
- Sanitize email content
- Validate recipient addresses
- Use HTTPS for all links
- Include unsubscribe options

## Cost Optimization

### Free Tier Limits
- **Resend:** 3,000 emails/month
- **SendGrid:** 100 emails/day
- **Mailgun:** 5,000 emails/month (first 3 months)
- **AWS SES:** 62,000 emails/month (when sent from EC2)

### Production Scaling
- Monitor monthly usage
- Set up billing alerts
- Use bulk sending for newsletters
- Implement email queuing for high volume

## Integration Testing

### Test Email Delivery
```bash
# Run email test script
npm run test-email

# Test specific provider
VITE_EMAIL_PROVIDER=resend npm run test-email
```

### Automated Testing
```typescript
describe('Email Service', () => {
  it('should send OTP email', async () => {
    const result = await sendOTPEmail('test@example.com', '123456', 'registration');
    expect(result.success).toBe(true);
  });
});
```

This comprehensive email system ensures reliable, secure, and scalable email delivery for the Climate Ecosystem platform! 🌱📧 