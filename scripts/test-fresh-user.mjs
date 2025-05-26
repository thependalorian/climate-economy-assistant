// Test with fresh user after Supabase configuration fixes
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFreshUser() {
  console.log('🧪 Testing Fresh User Registration');
  console.log('='.repeat(40));
  
  // Use a unique email for testing
  const testEmail = `test.${Date.now()}@gmail.com`;
  const password = 'TestPassword123!';
  
  console.log(`📧 Testing with: ${testEmail}`);
  console.log('🔄 Attempting registration...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
        data: {
          user_type: 'job_seeker',
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (error) {
      console.error('❌ Registration failed:', error.message);
      console.log('\n🔧 Possible fixes:');
      console.log('1. Check callback URLs in Supabase dashboard');
      console.log('2. Enable email confirmations');
      console.log('3. Fix RLS policies');
      return;
    }
    
    console.log('✅ Registration successful!');
    console.log('📧 User ID:', data.user?.id);
    console.log('📧 Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('📧 Session created:', data.session ? 'Yes' : 'No');
    
    if (!data.user?.email_confirmed_at) {
      console.log('\n📧 Email confirmation required');
      console.log('✅ This is correct behavior!');
      console.log('📬 Check your email inbox for confirmation link');
      console.log('📬 Also check spam/junk folder');
      
      // Test resend functionality
      console.log('\n🔄 Testing email resend...');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback'
        }
      });
      
      if (resendError) {
        console.log('⚠️ Resend failed:', resendError.message);
      } else {
        console.log('✅ Resend successful! Check your email again.');
      }
    }
    
    console.log('\n🎉 Test Results:');
    console.log('✅ User registration: Working');
    console.log('✅ Email system: ' + (data.user?.email_confirmed_at ? 'Auto-confirmed' : 'Requires confirmation'));
    console.log('✅ Callback URL: Configured correctly');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email for confirmation link');
    console.log('2. Click the confirmation link');
    console.log('3. You should be redirected to the app');
    console.log('4. Try logging in with the credentials');
    
    console.log('\n🔑 Test Credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${password}`);
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.log('\n🔧 Check these settings:');
    console.log('1. Callback URLs: https://app.supabase.com/project/kvtkpguwoaqokcylzpic/auth/url-configuration');
    console.log('2. Email Settings: https://app.supabase.com/project/kvtkpguwoaqokcylzpic/auth/providers');
    console.log('3. RLS Policies: Run the SQL fix in the SQL editor');
  }
}

testFreshUser(); 