// Test real registration and email confirmation
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testRealRegistration() {
  console.log('🧪 Real Registration Test');
  console.log('='.repeat(30));
  
  try {
    // Get email and user type
    const email = await new Promise(resolve => {
      rl.question('Enter your email address: ', resolve);
    });
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }
    
    const userType = await new Promise(resolve => {
      rl.question('Enter user type (job_seeker/partner): ', resolve);
    });
    
    if (!['job_seeker', 'partner'].includes(userType)) {
      console.error('❌ Invalid user type');
      process.exit(1);
    }
    
    const password = 'TestPassword123!';
    
    console.log(`\n🔄 Testing registration for: ${email} (${userType})`);
    
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);
    
    if (existingUser) {
      console.log('⚠️ User already exists. Testing email confirmation...');
      
      if (existingUser.email_confirmed_at) {
        console.log('✅ Email is already confirmed');
        console.log('🔄 You can try logging in at: http://localhost:3000/login');
      } else {
        console.log('📧 Email not confirmed. Manually confirming...');
        
        // Manually confirm email
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true
        });
        
        if (confirmError) {
          console.error('❌ Failed to confirm email:', confirmError.message);
        } else {
          console.log('✅ Email confirmed manually!');
          console.log('🔄 You can now try logging in at: http://localhost:3000/login');
        }
      }
      
      // Test email sending
      console.log('\n📧 Testing email sending...');
      try {
        const { error: emailError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`
          }
        });
        
        if (emailError) {
          console.log('⚠️ Email sending result:', emailError.message);
          if (emailError.message.includes('already confirmed')) {
            console.log('ℹ️ This is expected since email is already confirmed');
          }
        } else {
          console.log('✅ Email sent successfully! Check your inbox.');
        }
      } catch (emailErr) {
        console.log('⚠️ Email test error:', emailErr.message);
      }
      
    } else {
      console.log('🔄 Registering new user...');
      
      // Register new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
          data: {
            user_type: userType,
            first_name: 'Test',
            last_name: 'User'
          }
        }
      });
      
      if (signUpError) {
        console.error('❌ Registration failed:', signUpError.message);
        process.exit(1);
      }
      
      console.log('✅ Registration successful!');
      console.log('📧 User ID:', signUpData.user?.id);
      console.log('📧 Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      if (!signUpData.user?.email_confirmed_at) {
        console.log('\n📧 Email confirmation required');
        console.log('🔄 Manually confirming email for testing...');
        
        // Manually confirm email
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(signUpData.user.id, {
          email_confirm: true
        });
        
        if (confirmError) {
          console.error('❌ Failed to confirm email:', confirmError.message);
        } else {
          console.log('✅ Email confirmed manually!');
        }
        
        // Test email sending
        console.log('\n📧 Testing email sending capability...');
        try {
          const { error: emailError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`
            }
          });
          
          if (emailError) {
            console.log('⚠️ Email sending result:', emailError.message);
            console.log('This might be because:');
            console.log('1. Email is already confirmed');
            console.log('2. Supabase email provider needs configuration');
            console.log('3. Rate limiting is in effect');
          } else {
            console.log('✅ Email sent successfully! Check your inbox.');
          }
        } catch (emailErr) {
          console.log('⚠️ Email test error:', emailErr.message);
        }
      }
    }
    
    console.log('\n🎉 Test Complete!');
    console.log('📋 Next Steps:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('3. You should be redirected to the appropriate onboarding flow');
    console.log('4. Check browser console for any errors');
    
    // Show Supabase dashboard links
    console.log('\n🔗 Supabase Dashboard Links:');
    console.log('Auth Users: https://app.supabase.com/project/kvtkpguwoaqokcylzpic/auth/users');
    console.log('Email Settings: https://app.supabase.com/project/kvtkpguwoaqokcylzpic/auth/providers');
    console.log('Logs: https://app.supabase.com/project/kvtkpguwoaqokcylzpic/logs/explorer');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

testRealRegistration(); 