#!/usr/bin/env node

/**
 * Production Deployment Script for CEA Platform
 * Deploys to cea.georgenekwaya.com subdomain
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PRODUCTION_ENV = `# Production Environment Configuration for cea.georgenekwaya.com
# This file contains production-specific settings for the CEA platform

# Production Configuration
VITE_ENVIRONMENT=production
VITE_APP_URL=https://cea.georgenekwaya.com

# Supabase Configuration
VITE_SUPABASE_URL=https://kvtkpguwoaqokcylzpic.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGtwZ3V3b2Fxb2tjeWx6cGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTY0NDgsImV4cCI6MjA2MzU3MjQ0OH0.tmAmsWiqhJn4ceG3d_-RpXt7oSMNpcTUOei-igqu1Ps

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Security Keys
PII_ENCRYPTION_KEY=HsjEnZAMBE/jpf7dBrE2rhEsZ1gN1qUSd+xNICatkag=
JWT_SECRET=7vkAmxX+N3PzRJLMH0F930akhND6k3R6vKXDqSi+rCBM6+8RK3Cdx7SSGZobcqhhehGeHCP59J1XJz5f5GPFxQ==

# Production Settings - Disable Debug Features
VITE_DEBUG=false
VITE_TRACE_ENABLED=false
VITE_DEV_MODE=false
VITE_AUTH_BYPASS_EMAIL_VERIFICATION=false
VITE_VERBOSE=false

# Production API Settings
VITE_API_BASE_URL=https://cea.georgenekwaya.com
VITE_LOG_LEVEL=error
VITE_CONSOLE_TRACE=false

# Performance Settings
VITE_PERFORMANCE_MONITORING=true
VITE_NETWORK_MONITORING=false

# Production Tools
VITE_DEV_TOOLS=false
VITE_ERROR_OVERLAY=false
VITE_HMR=false

# Database Settings
VITE_DB_LOGGING=false
VITE_DB_QUERY_TRACE=false

# AI Settings
VITE_AI_DEBUG=false
VITE_AI_MOCK_RESPONSES=false

# Authentication Settings
VITE_AUTH_DEBUG=false

# Production Health Checks
VITE_HEALTH_CHECK_INTERVAL=300000
VITE_AUTO_HEALTH_CHECK=true

# Production Notifications
VITE_DEV_NOTIFICATIONS=false
VITE_ERROR_NOTIFICATIONS=true

# Production Analytics
VITE_ANALYTICS_DEBUG=false
VITE_TRACK_DEV_EVENTS=false

# SEO and Meta
VITE_SITE_NAME=Climate Economy Assistant
VITE_SITE_DESCRIPTION=AI-powered platform connecting job seekers with climate economy opportunities
VITE_SITE_AUTHOR=George Nekwaya
VITE_SITE_KEYWORDS=climate jobs,green economy,AI job matching,climate careers,sustainability jobs

# Social Media
VITE_OG_IMAGE=https://cea.georgenekwaya.com/og-image.jpg
VITE_TWITTER_HANDLE=@georgenekwaya

# Contact Information
VITE_CONTACT_EMAIL=george@georgenekwaya.com
VITE_SUPPORT_EMAIL=support@georgenekwaya.com

# Legal
VITE_PRIVACY_POLICY_URL=https://cea.georgenekwaya.com/privacy
VITE_TERMS_OF_SERVICE_URL=https://cea.georgenekwaya.com/terms`;

async function deployProduction() {
  console.log('🚀 Starting CEA Platform Production Deployment...\n');

  try {
    // Step 1: Create production environment file
    console.log('📝 Creating production environment configuration...');
    fs.writeFileSync('.env.production', PRODUCTION_ENV);
    console.log('✅ Production environment file created\n');

    // Step 2: Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');

    // Step 3: Run linting
    console.log('🔍 Running code quality checks...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Code quality checks passed\n');
    } catch (error) {
      console.log('⚠️  Linting warnings found, continuing deployment...\n');
    }

    // Step 4: Build for production
    console.log('🏗️  Building production bundle...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Production build completed\n');

    // Step 5: Test production build locally
    console.log('🧪 Testing production build...');
    console.log('Run "npm run preview" to test the production build locally\n');

    // Step 6: Deployment instructions
    console.log('🌐 Deployment Instructions:');
    console.log('1. Install Vercel CLI: npm i -g vercel');
    console.log('2. Deploy to Vercel: vercel --prod');
    console.log('3. Add custom domain: vercel domains add cea.georgenekwaya.com');
    console.log('4. Configure DNS CNAME: cea → cname.vercel-dns.com\n');

    // Step 7: Supabase configuration reminder
    console.log('⚙️  Supabase Configuration Required:');
    console.log('1. Update Site URL to: https://cea.georgenekwaya.com');
    console.log('2. Add redirect URLs:');
    console.log('   - https://cea.georgenekwaya.com/auth/callback');
    console.log('   - https://cea.georgenekwaya.com/auth/confirm');
    console.log('   - https://cea.georgenekwaya.com/auth/reset-password');
    console.log('3. Update email templates with new domain\n');

    // Step 8: Personal website integration
    console.log('🔗 Personal Website Integration:');
    console.log('Add CEA platform link to georgenekwaya.com projects page');
    console.log('Update navigation to include CEA platform link\n');

    console.log('✅ Production deployment preparation complete!');
    console.log('📖 See SUBDOMAIN_DEPLOYMENT_GUIDE.md for detailed instructions');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployProduction(); 