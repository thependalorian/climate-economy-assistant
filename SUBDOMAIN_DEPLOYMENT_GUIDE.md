# CEA Platform Subdomain Deployment Guide

## Overview
This guide covers deploying the Climate Economy Assistant (CEA) platform to `cea.georgenekwaya.com` and integrating it with the main personal website at `georgenekwaya.com`.

## 1. Domain Configuration

### DNS Setup
1. **Add CNAME Record**:
   ```
   Type: CNAME
   Name: cea
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

2. **Alternative A Record** (if CNAME not supported):
   ```
   Type: A
   Name: cea
   Value: 76.76.19.61 (Vercel IP)
   TTL: 3600
   ```

### Vercel Domain Configuration
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add custom domain: `cea.georgenekwaya.com`
3. Configure SSL certificate (automatic with Vercel)

## 2. Environment Configuration for Production

### Production Environment Variables
Create `.env.production`:

```env
# Production Configuration
VITE_ENVIRONMENT=production
VITE_APP_URL=https://cea.georgenekwaya.com

# Supabase Configuration (same as current)
VITE_SUPABASE_URL=https://kvtkpguwoaqokcylzpic.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGtwZ3V3b2Fxb2tjeWx6cGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTY0NDgsImV4cCI6MjA2MzU3MjQ0OH0.tmAmsWiqhJn4ceG3d_-RpXt7oSMNpcTUOei-igqu1Ps

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Security Keys
PII_ENCRYPTION_KEY=HsjEnZAMBE/jpf7dBrE2rhEsZ1gN1qUSd+xNICatkag=
JWT_SECRET=7vkAmxX+N3PzRJLMH0F930akhND6k3R6vKXDqSi+rCBM6+8RK3Cdx7SSGZobcqhhehGeHCP59J1XJz5f5GPFxQ==

# Production Settings
VITE_DEBUG=false
VITE_TRACE_ENABLED=false
VITE_DEV_MODE=false
VITE_AUTH_BYPASS_EMAIL_VERIFICATION=false
```

## 3. Supabase Configuration Updates

### Email Confirmation URLs
Update Supabase Auth settings:

1. **Site URL**: `https://cea.georgenekwaya.com`
2. **Redirect URLs**:
   ```
   https://cea.georgenekwaya.com/auth/callback
   https://cea.georgenekwaya.com/auth/confirm
   https://cea.georgenekwaya.com/auth/reset-password
   ```

### Email Templates
Update email templates to use the new domain:

```html
<!-- Email Confirmation Template -->
<h2>Welcome to Climate Economy Assistant</h2>
<p>Please confirm your email address by clicking the link below:</p>
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
<p>Visit us at: <a href="https://cea.georgenekwaya.com">cea.georgenekwaya.com</a></p>
```

## 4. Personal Website Integration

### Projects Page Enhancement
Add CEA to the projects section on georgenekwaya.com:

```html
<!-- Add to projects section -->
<div class="project-card">
  <h3>Climate Economy Assistant (CEA)</h3>
  <p>AI-powered platform connecting job seekers with climate economy opportunities through intelligent matching and personalized guidance.</p>
  <div class="project-links">
    <a href="https://cea.georgenekwaya.com" class="btn-primary">Launch Platform</a>
    <a href="https://cea.georgenekwaya.com/about" class="btn-secondary">Learn More</a>
  </div>
  <div class="project-tags">
    <span>AI/ML</span>
    <span>Climate Tech</span>
    <span>Job Matching</span>
    <span>React</span>
    <span>TypeScript</span>
  </div>
</div>
```

### Navigation Integration
Add CEA link to main navigation:

```html
<!-- Add to main navigation -->
<nav>
  <a href="/">Home</a>
  <a href="/experience">Experience</a>
  <a href="/projects">Projects</a>
  <a href="https://cea.georgenekwaya.com">CEA Platform</a>
  <a href="/certificates">Certificates</a>
  <a href="/namibia">Namibia</a>
  <a href="/buffr">Buffr</a>
</nav>
```

## 5. Cross-Domain Analytics & Tracking

### Google Analytics Setup
Configure cross-domain tracking:

```javascript
// Add to both sites
gtag('config', 'GA_MEASUREMENT_ID', {
  'linker': {
    'domains': ['georgenekwaya.com', 'cea.georgenekwaya.com']
  }
});
```

### User Journey Tracking
Track users moving between sites:

```javascript
// On personal website
function trackCEAVisit() {
  gtag('event', 'cea_platform_visit', {
    'event_category': 'external_link',
    'event_label': 'cea_platform',
    'value': 1
  });
}
```

## 6. SEO Optimization

### Meta Tags for CEA Platform
```html
<meta name="description" content="Climate Economy Assistant - AI-powered job matching platform for climate economy opportunities by George Nekwaya">
<meta name="keywords" content="climate jobs, green economy, AI job matching, climate careers, sustainability jobs">
<meta property="og:title" content="Climate Economy Assistant | George Nekwaya">
<meta property="og:description" content="AI-powered platform connecting job seekers with climate economy opportunities">
<meta property="og:url" content="https://cea.georgenekwaya.com">
<meta property="og:image" content="https://cea.georgenekwaya.com/og-image.jpg">
```

### Canonical URLs
```html
<link rel="canonical" href="https://cea.georgenekwaya.com">
```

## 7. Security Considerations

### CORS Configuration
Update CORS settings for cross-domain requests:

```javascript
// In Supabase or backend configuration
const corsOptions = {
  origin: [
    'https://georgenekwaya.com',
    'https://cea.georgenekwaya.com',
    'http://localhost:3000' // for development
  ],
  credentials: true
};
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' https://cea.georgenekwaya.com https://georgenekwaya.com;
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
">
```

## 8. Deployment Steps

### Step 1: Prepare Production Build
```bash
# Update package.json for production
npm run build

# Test production build locally
npm run preview
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add custom domain
vercel domains add cea.georgenekwaya.com
```

### Step 3: Configure DNS
1. Log into your domain registrar (where georgenekwaya.com is hosted)
2. Add CNAME record: `cea` → `cname.vercel-dns.com`
3. Wait for DNS propagation (up to 24 hours)

### Step 4: Update Supabase Settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Update Site URL to `https://cea.georgenekwaya.com`
3. Add redirect URLs as listed above
4. Update email templates

### Step 5: Test Email Flow
```bash
# Test email confirmation
npm run test-email-flow

# Test registration flow
npm run test-real-registration
```

## 9. Monitoring & Maintenance

### Health Checks
Set up monitoring for:
- SSL certificate expiration
- Domain resolution
- Application uptime
- Database connectivity

### Performance Monitoring
```javascript
// Add to CEA platform
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Track performance metrics
    gtag('event', 'performance_metric', {
      'metric_name': entry.name,
      'metric_value': entry.duration
    });
  }
});
```

## 10. Backup & Recovery

### Database Backups
- Supabase automatic backups enabled
- Weekly manual exports
- Test restore procedures monthly

### Code Repository
- GitHub repository with production branch
- Automated deployments via Vercel
- Environment variable backups

## 11. Future Enhancements

### Single Sign-On (SSO)
Implement SSO between personal website and CEA platform:

```javascript
// Shared authentication token
const sharedAuth = {
  domain: '.georgenekwaya.com',
  secure: true,
  sameSite: 'strict'
};
```

### API Integration
Create API endpoints for personal website to display CEA statistics:

```javascript
// On personal website
async function getCEAStats() {
  const response = await fetch('https://cea.georgenekwaya.com/api/public/stats');
  return response.json();
}
```

## 12. Launch Checklist

- [ ] DNS configuration complete
- [ ] SSL certificate active
- [ ] Supabase settings updated
- [ ] Email templates configured
- [ ] Personal website integration complete
- [ ] Analytics tracking setup
- [ ] SEO optimization complete
- [ ] Performance monitoring active
- [ ] Security headers configured
- [ ] Backup procedures tested
- [ ] User acceptance testing complete
- [ ] Launch announcement prepared

## Support & Documentation

### User Guides
- Getting started guide for job seekers
- Partner onboarding documentation
- Admin user manual

### Technical Documentation
- API documentation
- Integration guides
- Troubleshooting manual

---

**Contact**: george@georgenekwaya.com
**Platform**: https://cea.georgenekwaya.com
**Documentation**: https://cea.georgenekwaya.com/docs 