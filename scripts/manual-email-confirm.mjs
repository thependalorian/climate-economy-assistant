// Script to manually confirm user email for testing
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase service role key');
  console.log('Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function manuallyConfirmEmail() {
  console.log('🔧 Manual Email Confirmation Tool');
  console.log('='.repeat(40));
  
  try {
    // Get email to confirm
    const email = await new Promise(resolve => {
      rl.question('Enter email address to confirm: ', resolve);
    });
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }
    
    console.log(`\n🔄 Looking for user: ${email}`);
    
    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }
    
    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.error('❌ User not found with email:', email);
      console.log('Available users:');
      users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
      process.exit(1);
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at
    });
    
    if (user.email_confirmed_at) {
      console.log('ℹ️ Email is already confirmed at:', user.email_confirmed_at);
    } else {
      console.log('🔄 Confirming email...');
      
      // Confirm email
      const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });
      
      if (confirmError) {
        console.error('❌ Failed to confirm email:', confirmError.message);
        process.exit(1);
      }
      
      console.log('✅ Email confirmed successfully!');
    }
    
    // Test email sending capability
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
        console.warn('⚠️ Email sending test failed:', emailError.message);
        console.log('This might be because:');
        console.log('1. Email is already confirmed');
        console.log('2. Supabase email provider is not configured');
        console.log('3. Rate limiting is in effect');
      } else {
        console.log('✅ Email sending test successful');
        console.log('📧 Check your inbox for a confirmation email');
      }
    } catch (emailErr) {
      console.warn('⚠️ Email sending test error:', emailErr.message);
    }
    
    // Check profile creation
    console.log('\n👤 Checking user profile...');
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.warn('⚠️ Profile fetch error:', profileError.message);
        console.log('This might be due to RLS policies or missing profile');
      } else {
        console.log('✅ Profile found:', {
          user_type: profile.user_type,
          profile_completed: profile.profile_completed,
          first_name: profile.first_name,
          last_name: profile.last_name
        });
      }
    } catch (profileErr) {
      console.warn('⚠️ Profile check error:', profileErr.message);
    }
    
    console.log('\n🎉 Manual confirmation complete!');
    console.log('You can now try logging in with this email address.');
    
  } catch (error) {
    console.error('❌ Manual confirmation failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

manuallyConfirmEmail(); 