// Script to check Supabase email settings
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmailSettings() {
  console.log('Checking Supabase email settings...');
  
  try {
    // Get the current auth settings
    const { data, error } = await supabase.rpc('get_auth_settings');
    
    if (error) {
      console.error('❌ Error getting auth settings:', error.message);
      console.log('\nAlternative approach: Please check your Supabase dashboard for email settings:');
      console.log('1. Go to https://app.supabase.com/project/_/auth/providers');
      console.log('2. Check if Email provider is enabled');
      console.log('3. Verify the email templates under "Email Templates"');
      process.exit(1);
    }
    
    if (!data) {
      console.log('⚠️ No auth settings data returned');
      process.exit(1);
    }
    
    // Display email settings
    console.log('\n=== Email Provider Settings ===');
    console.log(`Email provider enabled: ${data.EXTERNAL_EMAIL_ENABLED ? 'Yes' : 'No'}`);
    console.log(`SMTP server: ${data.SMTP_HOST || 'Not configured'}`);
    console.log(`SMTP port: ${data.SMTP_PORT || 'Not configured'}`);
    console.log(`SMTP user: ${data.SMTP_USER ? '******' : 'Not configured'}`);
    console.log(`SMTP password: ${data.SMTP_PASS ? '******' : 'Not configured'}`);
    console.log(`SMTP sender: ${data.SMTP_SENDER_NAME || 'Not configured'}`);
    console.log(`SMTP admin email: ${data.SMTP_ADMIN_EMAIL || 'Not configured'}`);
    
    console.log('\n=== Email Template Settings ===');
    console.log(`Confirmation template: ${data.MAILER_TEMPLATES_CONFIRMATION || 'Default'}`);
    console.log(`Invite template: ${data.MAILER_TEMPLATES_INVITE || 'Default'}`);
    console.log(`Magic link template: ${data.MAILER_TEMPLATES_MAGIC_LINK || 'Default'}`);
    console.log(`Recovery template: ${data.MAILER_TEMPLATES_RECOVERY || 'Default'}`);
    console.log(`Email change template: ${data.MAILER_TEMPLATES_EMAIL_CHANGE || 'Default'}`);
    
    console.log('\n=== Email Redirect Settings ===');
    console.log(`Redirect site URL: ${data.SITE_URL || 'Not configured'}`);
    console.log(`Redirect host: ${data.REDIRECT_HOST || 'Not configured'}`);
    console.log(`Confirmation redirect: ${data.MAILER_URLPATHS_CONFIRMATION || 'Default'}`);
    console.log(`Invite redirect: ${data.MAILER_URLPATHS_INVITE || 'Default'}`);
    console.log(`Magic link redirect: ${data.MAILER_URLPATHS_MAGIC_LINK || 'Default'}`);
    console.log(`Recovery redirect: ${data.MAILER_URLPATHS_RECOVERY || 'Default'}`);
    console.log(`Email change redirect: ${data.MAILER_URLPATHS_EMAIL_CHANGE || 'Default'}`);
    
    console.log('\n=== Email Rate Limiting ===');
    console.log(`Rate limit: ${data.RATE_LIMIT_EMAIL_SENT || 'Default'}`);
    
    // Check for potential issues
    const issues = [];
    
    if (!data.EXTERNAL_EMAIL_ENABLED) {
      issues.push('Email provider is not enabled');
    }
    
    if (!data.SMTP_HOST || !data.SMTP_PORT || !data.SMTP_USER || !data.SMTP_PASS) {
      issues.push('SMTP settings are not fully configured');
    }
    
    if (!data.SITE_URL) {
      issues.push('Site URL is not configured');
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️ Potential issues detected:');
      issues.forEach(issue => console.log(`- ${issue}`));
      console.log('\nPlease check your Supabase dashboard to fix these issues:');
      console.log('1. Go to https://app.supabase.com/project/_/auth/providers');
      console.log('2. Configure the Email provider settings');
      console.log('3. Verify the email templates under "Email Templates"');
    } else {
      console.log('\n✅ Email settings appear to be properly configured');
    }
    
  } catch (error) {
    console.error('Unexpected error checking email settings:', error.message);
    process.exit(1);
  }
}

// Run the check
checkEmailSettings().catch(console.error);
