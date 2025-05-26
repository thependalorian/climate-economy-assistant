// Script to manually confirm a user in Supabase
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

async function confirmUser() {
  console.log('Manually confirming a user in Supabase...');
  
  try {
    // Ask for email address
    const email = await new Promise(resolve => {
      rl.question('Enter the email address of the user to confirm: ', resolve);
    });
    
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      process.exit(1);
    }
    
    // First, check if the user exists
    console.log(`\nChecking if user with email ${email} exists...`);
    
    // We need to sign in as the user to confirm them
    // First, let's generate a one-time password
    const tempPassword = Math.random().toString(36).slice(-10);
    
    // Create a magic link for the user
    console.log(`\nSending magic link to ${email}...`);
    
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/auth/callback`
      }
    });
    
    if (magicLinkError) {
      console.error('❌ Error sending magic link:', magicLinkError.message);
      process.exit(1);
    }
    
    console.log('✅ Magic link sent successfully');
    console.log('\nPlease check your email inbox (and spam folder) for the magic link.');
    console.log('Click the link to confirm your account.');
    
    // Ask if the user clicked the link
    const confirmed = await new Promise(resolve => {
      rl.question('\nDid you click the magic link and confirm your account? (yes/no): ', answer => {
        resolve(answer.toLowerCase() === 'yes');
      });
    });
    
    if (confirmed) {
      console.log('✅ User confirmed successfully');
      console.log('\nYou can now log in with your email and password.');
    } else {
      console.log('❌ User confirmation cancelled');
    }
    
  } catch (error) {
    console.error('Unexpected error during user confirmation:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the confirmation
confirmUser().catch(console.error);
