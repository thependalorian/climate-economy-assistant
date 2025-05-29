# Enhanced Authentication System Guide

## Overview

The Climate Ecosystem Assistant now features a production-ready authentication system with enhanced security measures, following industry best practices for user authentication and data protection.

## Key Features

### 🔐 **Enhanced Security**
- **Hashed OTP Storage**: All OTP codes are hashed using bcrypt before storage
- **Rate Limiting**: Prevents brute force attacks on registration, login, and password reset
- **Attempt Limiting**: OTP verification limited to 3 attempts before lockout
- **Security Event Logging**: Comprehensive audit trail for all authentication events
- **Multi-Factor Authentication (MFA)**: Support for TOTP and SMS-based MFA

### 📧 **Email Verification System**
- **OTP-based verification**: Secure 6-digit codes with 10-minute expiration
- **Professional email templates**: Beautiful HTML emails with fallback text
- **Automatic cleanup**: Expired OTPs are automatically cleaned up
- **Welcome emails**: Automated welcome emails after successful verification

### 🛡️ **Advanced Password Security**
- **Strong password validation**: Enforced complexity requirements
- **Secure password reset**: OTP-verified password reset flow
- **Password confirmation**: Double verification for critical operations

### 👥 **User Type Management**
- **Job Seekers**: Individual users seeking climate career opportunities
- **Partners**: Organizations offering opportunities (with verification)
- **Admins**: System administrators with granular permissions

### 📊 **Admin Security Tools**
- **Security alerts**: Real-time monitoring of suspicious activities
- **User management**: Suspend/unsuspend accounts with audit trails
- **Partner verification**: Manual approval process for partner accounts
- **Data export**: GDPR-compliant data export for users and admins

## Technical Implementation

### Type-Safe Architecture

All authentication types are now properly typed with enums for better type safety:

```typescript
// User Types
export enum UserType {
  JobSeeker = 'job_seeker',
  Partner = 'partner',
  Admin = 'admin'
}

// OTP Types
export enum OTPType {
  Registration = 'registration',
  PasswordReset = 'password_reset',
  LoginMFA = 'login_mfa'
}

// Organization Types for Partners
export enum OrganizationType {
  Employer = 'employer',
  TrainingProvider = 'training_provider',
  EducationalInstitution = 'educational_institution',
  GovernmentAgency = 'government_agency',
  Nonprofit = 'nonprofit',
  IndustryAssociation = 'industry_association'
}
```

### Database Schema

The OTP system uses a secure database schema with proper indexing and security:

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- Hashed OTP for security
  type TEXT NOT NULL CHECK (type IN ('registration', 'password_reset', 'login_mfa')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3
);
```

### Enhanced OTP Security

The new OTP system provides several security improvements:

```typescript
// Generate cryptographically secure OTP
const otp = generateSecureOTP(6);

// Hash OTP before storage
const codeHash = await hashOTP(otp);

// Store with attempt limiting
await storeSecureOTP(userId, email, otp, type, ipAddress, userAgent);

// Verify with attempt tracking
const result = await verifySecureOTP(email, otp, type);
```

## API Usage Examples

### User Registration

```typescript
import { registerUser, UserType } from '../lib/auth/enhancedAuthService';

const result = await registerUser({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  userType: UserType.JobSeeker,
  firstName: 'John',
  lastName: 'Doe',
  acceptedTerms: true,
  acceptedPrivacy: true,
  marketingConsent: false
}, ipAddress, userAgent);

if (result.success && result.requiresOTP) {
  // Redirect to OTP verification page
}
```

### OTP Verification

```typescript
import { verifyOTP, OTPType } from '../lib/auth/enhancedAuthService';

const result = await verifyOTP({
  email: 'user@example.com',
  otp: '123456',
  type: OTPType.Registration
}, ipAddress, userAgent);

if (result.success) {
  // User verified successfully
} else if (result.isLocked) {
  // Too many attempts, user is locked out
} else {
  // Show error with attempts remaining
  console.log(`Error: ${result.error}`);
  console.log(`Attempts remaining: ${result.attemptsRemaining}`);
}
```

### Password Reset

```typescript
import { requestPasswordReset, resetPasswordWithOTP } from '../lib/auth/enhancedAuthService';

// Step 1: Request password reset
await requestPasswordReset('user@example.com', ipAddress, userAgent);

// Step 2: Reset password with OTP
const result = await resetPasswordWithOTP({
  email: 'user@example.com',
  otp: '123456',
  newPassword: 'NewSecurePassword123!',
  confirmPassword: 'NewSecurePassword123!'
}, ipAddress, userAgent);
```

### Admin Operations

```typescript
import { 
  checkAdminPermissions, 
  getAdminDashboardStats, 
  verifyPartner,
  suspendUser 
} from '../lib/admin/adminSecurityService';

// Check admin permissions
const { isAdmin, permissions } = await checkAdminPermissions(adminId);

if (isAdmin && permissions.canManagePartners) {
  // Verify a partner
  await verifyPartner(adminId, partnerId, true, 'Verified organization documents');
}

if (isAdmin && permissions.canManageUsers) {
  // Suspend a user
  await suspendUser(adminId, userId, true, 'Violation of terms of service');
}
```

## Security Monitoring

### Event Logging

All authentication events are logged with risk levels:

```typescript
await logSecurityEvent(
  userId,
  SecurityEventType.LoginSuccess,
  ipAddress,
  userAgent,
  { action: 'registration', email },
  RiskLevel.Low
);
```

### Rate Limiting

Built-in rate limiting prevents abuse:

```typescript
const rateLimit = await checkRateLimit(email, 'login', ipAddress);
if (!rateLimit.allowed) {
  return {
    success: false,
    error: 'Too many attempts. Please try again later.',
    rateLimited: true,
    resetTime: rateLimit.resetTime
  };
}
```

## Client-Side Integration

### React Hook Usage

```typescript
import { useAuth } from '../lib/hooks/useAuth';

function LoginComponent() {
  const { signIn, user, loading } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      // Handle successful login
    } catch (error) {
      // Handle login error
    }
  };

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Welcome {user.email}</div>;

  return (
    // Login form JSX
  );
}
```

## Email Templates

The system includes professional email templates for:

- **Registration verification**: Welcome email with OTP
- **Password reset**: Secure password reset with OTP
- **MFA login**: Two-factor authentication codes
- **Welcome emails**: Post-verification welcome messages
- **Security alerts**: Suspicious activity notifications

## Deployment Considerations

### Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (for production)
VITE_EMAIL_PROVIDER=sendgrid|ses|mailgun
EMAIL_API_KEY=your_email_api_key

# Security Configuration
VITE_APP_URL=https://yourdomain.com
VITE_ENVIRONMENT=production
```

### Database Setup

1. Run the OTP schema migration:
```sql
\i database/schemas/otp_codes.sql
```

2. Set up Row Level Security policies
3. Configure email triggers if using Supabase Edge Functions

### Vercel Deployment

The system is optimized for Vercel deployment with:
- Server-side rendering support
- Edge function compatibility
- Automatic SSL and domain configuration

## Security Best Practices

1. **Never log sensitive data**: OTPs, passwords, or tokens
2. **Use HTTPS everywhere**: All authentication must be over HTTPS
3. **Regular security audits**: Monitor security events and alerts
4. **Keep dependencies updated**: Regular updates for security patches
5. **Implement CSP headers**: Content Security Policy for XSS protection
6. **Rate limiting**: Protect against brute force attacks
7. **Input validation**: Validate all user inputs on both client and server

## Monitoring and Alerts

### Security Dashboard

Admins can monitor:
- Failed login attempts
- Suspicious activity patterns
- OTP verification rates
- User registration trends
- Security event logs

### Automated Alerts

The system can send alerts for:
- Multiple failed login attempts
- Unusual login patterns
- High-risk security events
- System errors or downtime

## Compliance Features

### GDPR Compliance
- User data export functionality
- Account deletion with audit trails
- Consent tracking and management
- Data anonymization options

### Audit Trail
- Complete authentication history
- Admin action logging
- Security event tracking
- Compliance reporting

## Future Enhancements

### Planned Features
- **Biometric authentication**: Face/fingerprint login
- **SSO integration**: Google, Microsoft, LinkedIn
- **Advanced MFA**: Hardware security keys
- **Behavioral analysis**: AI-powered fraud detection
- **Mobile app support**: React Native integration

This enhanced authentication system provides enterprise-grade security while maintaining ease of use for all user types in the Climate Ecosystem platform. 