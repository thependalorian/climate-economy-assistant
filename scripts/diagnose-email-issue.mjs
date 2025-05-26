// Comprehensive diagnostic script for email and registration issues
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Email and Registration Diagnostic Tool');
console.log('='.repeat(50));

// Create Supabase clients
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostics() {
  try {
    // 1. Check environment variables
    console.log('\n1️⃣ Environment Variables Check');
    console.log('✅ VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : '❌ Missing');
    console.log('✅ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : '❌ Missing');
    console.log('✅ VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : '❌ Missing');
    
    // 2. Test Supabase connection
    console.log('\n2️⃣ Supabase Connection Test');
    try {
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      if (error) {
        console.log('⚠️ Connection test with RLS:', error.message);
      } else {
        console.log('✅ Basic connection working');
      }
    } catch (err) {
      console.log('❌ Connection failed:', err.message);
    }
    
    // 3. List all users
    console.log('\n3️⃣ Current Users in System');
    if (supabaseAdmin) {
      try {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
          console.log('❌ Failed to list users:', error.message);
        } else {
          console.log(`📊 Total users: ${users.users.length}`);
          users.users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.id})`);
            console.log(`   - Created: ${user.created_at}`);
            console.log(`   - Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
            console.log(`   - Last sign in: ${user.last_sign_in_at || 'Never'}`);
          });
        }
      } catch (err) {
        console.log('❌ User listing failed:', err.message);
      }
    } else {
      console.log('⚠️ No service role key - cannot list users');
    }
    
    // 4. Test registration process
    console.log('\n4️⃣ Testing Registration Process');
    const testEmail = 'test' + Date.now() + '@gmail.com'; // Use gmail.com for better validation
    const testPassword = 'TestPassword123!';
    
    try {
      console.log(`🔄 Attempting to register: ${testEmail}`);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
          data: {
            user_type: 'job_seeker',
            first_name: 'Test',
            last_name: 'User'
          }
        }
      });
      
      if (signUpError) {
        console.log('❌ Registration failed:', signUpError.message);
        console.log('Error details:', signUpError);
      } else {
        console.log('✅ Registration successful!');
        console.log('📧 User ID:', signUpData.user?.id);
        console.log('📧 Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
        console.log('📧 Session:', signUpData.session ? 'Created' : 'Not created');
        
        // Clean up test user
        if (supabaseAdmin && signUpData.user?.id) {
          await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
          console.log('🧹 Test user cleaned up');
        }
      }
    } catch (err) {
      console.log('❌ Registration test failed:', err.message);
    }
    
    // 5. Test email sending
    console.log('\n5️⃣ Testing Email Sending');
    try {
      // Try to resend confirmation for a non-existent user (should fail gracefully)
      const { error: emailError } = await supabase.auth.resend({
        type: 'signup',
        email: 'nonexistent@example.com'
      });
      
      if (emailError) {
        console.log('⚠️ Email test result:', emailError.message);
        if (emailError.message.includes('User not found')) {
          console.log('✅ Email system is responding (user not found is expected)');
        } else if (emailError.message.includes('Email rate limit')) {
          console.log('✅ Email system is working (rate limited)');
        } else {
          console.log('❌ Unexpected email error');
        }
      } else {
        console.log('🤔 Unexpected success for non-existent user');
      }
    } catch (err) {
      console.log('❌ Email test failed:', err.message);
    }
    
    // 6. Check Supabase project settings
    console.log('\n6️⃣ Supabase Project Configuration');
    console.log('Please manually check these settings in your Supabase dashboard:');
    console.log('🔗 Auth Settings: https://app.supabase.com/project/' + supabaseUrl.split('.')[0].split('//')[1] + '/auth/providers');
    console.log('📧 Email Templates: https://app.supabase.com/project/' + supabaseUrl.split('.')[0].split('//')[1] + '/auth/templates');
    console.log('⚙️ Project Settings: https://app.supabase.com/project/' + supabaseUrl.split('.')[0].split('//')[1] + '/settings/general');
    
    console.log('\n📋 Required Settings:');
    console.log('1. ✅ Enable email confirmations');
    console.log('2. ✅ Set up email provider (or use Supabase built-in for development)');
    console.log('3. ✅ Configure redirect URLs');
    console.log('4. ✅ Check rate limiting settings');
    
    // 7. Test our email service
    console.log('\n7️⃣ Testing Our Email Service');
    try {
      // Import the email service using the correct path
      const emailModule = await import('../src/lib/email/emailService.ts');
      const { sendOTPEmail } = emailModule;
      
      console.log('📧 Testing OTP email generation...');
      const result = await sendOTPEmail('test@gmail.com', '123456', 'registration');
      console.log('📧 Email service result:', result.success ? '✅ Success' : `❌ Failed: ${result.error}`);
      
    } catch (importError) {
      console.log('⚠️ Could not test email service:', importError.message);
      console.log('This is expected in Node.js environment - email service works in browser');
    }
    
    // 8. Recommendations
    console.log('\n8️⃣ Recommendations');
    console.log('Based on the diagnostics above:');
    console.log('');
    console.log('If registration is failing:');
    console.log('  - Check Supabase project settings');
    console.log('  - Verify email confirmation is enabled');
    console.log('  - Check for rate limiting');
    console.log('');
    console.log('If emails are not being sent:');
    console.log('  - Configure email provider in Supabase dashboard');
    console.log('  - Check spam folder');
    console.log('  - Verify redirect URLs are whitelisted');
    console.log('  - For development, emails might be logged instead of sent');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Fix any issues identified above');
    console.log('  2. Test registration in the browser');
    console.log('  3. Check browser console for errors');
    console.log('  4. Monitor Supabase logs for errors');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

runDiagnostics(); 