// Script to test user registration with a specific email
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

async function registerTestUser() {
  console.log('Testing user registration with a specific email...');
  
  try {
    // Ask for email address
    const email = await new Promise(resolve => {
      rl.question('Enter your email address: ', resolve);
    });
    
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      process.exit(1);
    }
    
    // Ask for password
    const password = await new Promise(resolve => {
      rl.question('Enter a password (min 8 chars, with uppercase, lowercase, and number): ', resolve);
    });
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      process.exit(1);
    }
    
    console.log(`\nRegistering user with email ${email}...`);
    
    // Register the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/auth/callback`,
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (error) {
      console.error('❌ Error registering user:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Registration successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmation status:', data.user?.email_confirmed_at ? 'Confirmed' : 'Not confirmed');
    
    if (!data.user?.email_confirmed_at) {
      console.log('\nPlease check your email inbox (and spam folder) for the confirmation email.');
      console.log('Click the link in the email to confirm your account.');
    }
    
    // Create user profile if registration was successful
    if (data.user?.id) {
      console.log('\nCreating user profile...');
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email,
          first_name: 'Test',
          last_name: 'User',
          user_type: 'job_seeker',
          profile_completed: false
        });
      
      if (profileError) {
        console.error('❌ Error creating user profile:', profileError.message);
      } else {
        console.log('✅ User profile created successfully');
      }
      
      // Create job seeker profile
      console.log('\nCreating job seeker profile...');
      
      const { error: seekerError } = await supabase
        .from('job_seeker_profiles')
        .insert({
          id: data.user.id,
          onboarding_completed: false,
          onboarding_step: 1
        });
      
      if (seekerError) {
        console.error('❌ Error creating job seeker profile:', seekerError.message);
      } else {
        console.log('✅ Job seeker profile created successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during registration:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the registration
registerTestUser().catch(console.error);
