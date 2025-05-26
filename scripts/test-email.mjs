// Script to test Supabase email functionality
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testEmailFunctionality() {
  console.log('Testing Supabase email functionality...');
  
  try {
    // Ask for email address
    const email = await new Promise(resolve => {
      rl.question('Enter your email address to test: ', resolve);
    });
    
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      process.exit(1);
    }
    
    console.log(`\nSending password reset email to ${email}...`);
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/auth/callback`
    });
    
    if (error) {
      console.error('❌ Error sending password reset email:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Password reset email sent successfully');
    console.log('\nPlease check your email inbox (and spam folder) for the password reset email.');
    console.log('If you receive the email, it confirms that Supabase email delivery is working correctly.');
    
  } catch (error) {
    console.error('Unexpected error during email test:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the test
testEmailFunctionality().catch(console.error);
