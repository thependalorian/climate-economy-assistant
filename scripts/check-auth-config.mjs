// Check Supabase auth configuration and provide fixes
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthConfig() {
  console.log('🔍 Supabase Auth Configuration Check');
  console.log('='.repeat(50));
  
  // Extract project ID from URL
  const projectId = supabaseUrl.split('//')[1].split('.')[0];
  
  console.log('📋 Current Configuration:');
  console.log(`🔗 Project ID: ${projectId}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  
  console.log('\n🚨 REQUIRED FIXES:');
  console.log('='.repeat(30));
  
  console.log('\n1️⃣ FIX CALLBACK URLs:');
  console.log('Go to: https://app.supabase.com/project/' + projectId + '/auth/url-configuration');
  console.log('Add these URLs to "Redirect URLs":');
  console.log('  ✅ http://localhost:3000/auth/callback');
  console.log('  ✅ http://localhost:3000/auth/confirm');
  console.log('  ✅ https://your-domain.vercel.app/auth/callback (for production)');
  
  console.log('\n2️⃣ FIX EMAIL PROVIDER:');
  console.log('Go to: https://app.supabase.com/project/' + projectId + '/auth/providers');
  console.log('Enable Email provider and configure:');
  console.log('  ✅ Enable "Enable email confirmations"');
  console.log('  ✅ Set "Confirm email" to ON');
  console.log('  ✅ For development: Use Supabase SMTP (built-in)');
  console.log('  ✅ For production: Configure SendGrid, AWS SES, etc.');
  
  console.log('\n3️⃣ FIX EMAIL TEMPLATES:');
  console.log('Go to: https://app.supabase.com/project/' + projectId + '/auth/templates');
  console.log('Customize these templates:');
  console.log('  ✅ Confirm signup');
  console.log('  ✅ Magic link');
  console.log('  ✅ Change email address');
  console.log('  ✅ Reset password');
  
  console.log('\n4️⃣ FIX RLS POLICIES (CRITICAL):');
  console.log('Go to: https://app.supabase.com/project/' + projectId + '/sql/new');
  console.log('Run this SQL to fix infinite recursion:');
  console.log('```sql');
  console.log('-- Fix RLS infinite recursion');
  console.log('DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;');
  console.log('DROP POLICY IF EXISTS "job_seeker_profiles_admin_access" ON job_seeker_profiles;');
  console.log('DROP POLICY IF EXISTS "partner_profiles_admin_access" ON partner_profiles;');
  console.log('DROP POLICY IF EXISTS "admin_profiles_admin_access" ON admin_profiles;');
  console.log('```');
  
  console.log('\n5️⃣ TEST EMAIL SENDING:');
  console.log('After fixing the above, test with:');
  console.log('  📧 npm run test-real-registration');
  console.log('  📧 Check your email inbox/spam folder');
  
  // Test current user creation
  console.log('\n🧪 Testing User Creation...');
  try {
    const testEmail = 'test' + Date.now() + '@gmail.com';
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false, // Require email confirmation
      user_metadata: {
        user_type: 'job_seeker',
        first_name: 'Test',
        last_name: 'User'
      }
    });
    
    if (error) {
      console.log('❌ User creation failed:', error.message);
    } else {
      console.log('✅ User creation works');
      console.log('📧 User ID:', data.user.id);
      console.log('📧 Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Clean up
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      console.log('🧹 Test user cleaned up');
    }
  } catch (err) {
    console.log('❌ User creation test failed:', err.message);
  }
  
  console.log('\n📱 QUICK FIXES FOR IMMEDIATE TESTING:');
  console.log('='.repeat(40));
  console.log('1. Fix callback URLs (most important)');
  console.log('2. Enable email confirmations');
  console.log('3. Run the RLS fix SQL');
  console.log('4. Test registration in browser');
  
  console.log('\n🔗 Direct Links:');
  console.log(`Auth Settings: https://app.supabase.com/project/${projectId}/auth/providers`);
  console.log(`URL Config: https://app.supabase.com/project/${projectId}/auth/url-configuration`);
  console.log(`SQL Editor: https://app.supabase.com/project/${projectId}/sql/new`);
  console.log(`Email Templates: https://app.supabase.com/project/${projectId}/auth/templates`);
}

checkAuthConfig(); 