# Complete Onboarding Flow Guide

## Overview

This guide explains the complete user onboarding flow for the Climate Ecosystem Assistant, including email verification, profile creation, and dashboard access for all user types.

## User Types

The system supports three user types:
- **Job Seekers**: Individuals looking for clean energy career opportunities
- **Partners**: Organizations (employers, training providers, etc.)
- **Admins**: System administrators

## Complete Flow Diagram

```
Registration → Email Verification → Profile Creation → Onboarding → Dashboard
```

## Detailed Flow Steps

### 1. Registration (`/register`)

**Components:**
- `src/pages/RegisterPage.tsx` - Main registration form
- `src/lib/validations.ts` - Form validation schemas
- `src/contexts/AuthContext.tsx` - Authentication handling

**Process:**
1. User selects user type (job_seeker/partner)
2. User fills out registration form
3. Form data is stored in localStorage for onboarding
4. Supabase auth.signUp() is called
5. User is redirected to email verification page

**Key Files:**
```typescript
// Registration form submission
const { user, error } = await signUp(data.email, data.password);
if (!user?.email_confirmed_at) {
  navigate('/register/success');
}
```

### 2. Email Verification (`/register/success`)

**Components:**
- `src/pages/RegisterSuccessPage.tsx` - Email verification instructions
- `src/lib/email/emailService.ts` - Email templates and sending

**Process:**
1. User receives confirmation email from Supabase
2. User clicks confirmation link in email
3. Link redirects to `/auth/callback`
4. AuthCallback component processes the verification

**Email Templates:**
- Development: Console logging with formatted templates
- Production: Ready for integration with email providers (SendGrid, AWS SES, etc.)

### 3. Auth Callback (`/auth/callback`)

**Components:**
- `src/components/auth/AuthCallback.tsx` - Handles email confirmation redirects

**Process:**
1. Exchanges auth code for session
2. Creates user profiles in database
3. Determines appropriate redirect based on user type and completion status

**Profile Creation:**
```typescript
// Creates user_profiles entry
await createUserProfile({
  id: user.id,
  email: user.email,
  user_type: storedUserType,
  // ... other fields
});

// Creates type-specific profile
if (userType === 'job_seeker') {
  await createJobSeekerProfile(user.id);
} else if (userType === 'partner') {
  await createPartnerProfile(user.id, orgName, orgType);
}
```

### 4. Onboarding Steps

#### Job Seeker Onboarding
**Path:** `/onboarding/job-seeker/step1` → `/onboarding/job-seeker/step5`

**Steps:**
1. **Step 1**: Personal information and location
2. **Step 2**: Career interests and goals
3. **Step 3**: Skills and experience
4. **Step 4**: Education and certifications
5. **Step 5**: Resume upload and preferences

**Components:**
- `src/pages/onboarding/job-seeker/JobSeekerStep1.tsx`
- `src/pages/onboarding/job-seeker/JobSeekerStep2.tsx`
- `src/pages/onboarding/job-seeker/JobSeekerStep3.tsx`
- `src/pages/onboarding/job-seeker/JobSeekerStep4.tsx`
- `src/pages/onboarding/job-seeker/JobSeekerStep5.tsx`

#### Partner Onboarding
**Path:** `/onboarding/partner/step1` → `/onboarding/partner/step4`

**Steps:**
1. **Step 1**: Organization information
2. **Step 2**: Organization details and industry
3. **Step 3**: Services and offerings
4. **Step 4**: Contact information and preferences

**Components:**
- `src/pages/onboarding/partner/PartnerStep1.tsx`
- `src/pages/onboarding/partner/PartnerStep2.tsx`
- `src/pages/onboarding/partner/PartnerStep3.tsx`
- `src/pages/onboarding/partner/PartnerStep4.tsx`

#### Admin Users
**Path:** Direct to `/admin-dashboard`

Admins skip onboarding and go directly to the admin dashboard.

### 5. Dashboard Access

After completing onboarding, users are redirected to their appropriate dashboard:

- **Job Seekers**: `/dashboard` - Main user dashboard with job search, AI assistant
- **Partners**: `/partner-dashboard` - Partner dashboard with candidate management
- **Admins**: `/admin-dashboard` - Administrative interface

## Authentication Components

### Core Auth Components
- `src/contexts/AuthContext.tsx` - Main authentication context
- `src/hooks/useAuth.tsx` - Authentication hook
- `src/components/auth/ProtectedRoute.tsx` - Route protection
- `src/components/auth/QuickAuthCheck.tsx` - Quick auth verification
- `src/components/auth/OnboardingRedirect.tsx` - Onboarding flow management

### Auth Flow Components
- `src/components/auth/AuthCallback.tsx` - Email verification callback
- `src/components/auth/OTPVerification.tsx` - OTP input component (future use)

## Email System

### Email Service
**File:** `src/lib/email/emailService.ts`

**Features:**
- OTP email templates for registration, password reset, MFA
- Welcome emails for new users
- Development mode with console logging
- Production-ready structure for email providers

**Templates:**
- Registration verification
- Password reset
- Login MFA
- Welcome messages (user-type specific)

### Email Configuration
**Development:** Uses console logging to display email content
**Production:** Ready for integration with:
- SendGrid
- AWS SES
- Mailgun
- Other email providers

## Database Schema

### Core Tables
- `user_profiles` - Main user information
- `job_seeker_profiles` - Job seeker specific data
- `partner_profiles` - Partner organization data
- `admin_profiles` - Admin user data

### Security Tables
- `otp_codes` - OTP verification codes
- `security_events` - Security event logging
- `user_consents` - User consent tracking

## Testing

### Test Scripts
```bash
# Test complete email and onboarding flow
npm run test-email-flow

# Test email functionality
npm run test-email

# Register test user
npm run register-test

# Manually confirm user email
npm run confirm-user
```

### Manual Testing Checklist

#### Registration Flow
- [ ] User can select user type
- [ ] Form validation works correctly
- [ ] Registration creates auth user
- [ ] Email verification page displays
- [ ] Resend email functionality works

#### Email Verification
- [ ] Confirmation email is sent (check console in dev)
- [ ] Email contains correct verification link
- [ ] Clicking link redirects to auth callback
- [ ] Auth callback processes verification correctly

#### Profile Creation
- [ ] User profiles are created in database
- [ ] Type-specific profiles are created
- [ ] User data from registration is preserved

#### Onboarding
- [ ] Correct onboarding path based on user type
- [ ] All onboarding steps are accessible
- [ ] Form data is saved between steps
- [ ] Completion redirects to correct dashboard

#### Dashboard Access
- [ ] Job seekers reach main dashboard
- [ ] Partners reach partner dashboard
- [ ] Admins reach admin dashboard
- [ ] Protected routes work correctly

## Troubleshooting

### Common Issues

#### Email Not Received
**Symptoms:** User doesn't receive confirmation email
**Solutions:**
1. Check Supabase email configuration
2. Verify redirect URLs are whitelisted
3. Check spam folder
4. Use manual confirmation script for testing

#### Infinite Loading on Auth
**Symptoms:** App shows loading spinner indefinitely
**Solutions:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies
4. Clear localStorage and try again

#### Profile Creation Fails
**Symptoms:** User authenticated but no profile created
**Solutions:**
1. Check database RLS policies
2. Verify table permissions
3. Check for missing required fields
4. Review auth callback logs

#### Onboarding Redirect Issues
**Symptoms:** User stuck on wrong onboarding step
**Solutions:**
1. Clear localStorage data
2. Check user_type in database
3. Verify onboarding completion status
4. Check route protection logic

### Debug Commands

```bash
# Check Supabase connection
npm run check-supabase

# Check database schema
npm run check-schema

# Test authentication
npm run test-auth

# Check email settings
npm run check-email-settings
```

### Development Tips

1. **Use Console Logging**: Email service logs all email content in development
2. **Check Network Tab**: Monitor Supabase API calls for errors
3. **Verify RLS Policies**: Ensure database policies allow user operations
4. **Test with Real Email**: Use a real email address for end-to-end testing
5. **Clear Browser Data**: Clear localStorage/cookies between tests

## Production Deployment

### Email Provider Setup
1. Choose email provider (SendGrid recommended)
2. Configure API keys in environment variables
3. Update `emailService.ts` with provider integration
4. Test email delivery in staging environment

### Supabase Configuration
1. Configure email templates in Supabase dashboard
2. Set up proper redirect URLs
3. Configure rate limiting
4. Enable email confirmations

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
VITE_APP_URL=your_app_url
VITE_EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
```

## Security Considerations

1. **Email Verification**: Always verify email addresses before account activation
2. **Rate Limiting**: Implement rate limiting for email sending
3. **Secure Redirects**: Validate all redirect URLs
4. **Data Protection**: Encrypt sensitive user data
5. **Audit Logging**: Log all authentication events

## Future Enhancements

1. **SMS Verification**: Add phone number verification option
2. **Social Login**: Integrate Google/LinkedIn authentication
3. **Advanced MFA**: Implement TOTP-based MFA
4. **Email Templates**: Create rich HTML email templates
5. **Onboarding Analytics**: Track onboarding completion rates 