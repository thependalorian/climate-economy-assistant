// Script to test Supabase authentication
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

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testAuthentication() {
  console.log('Supabase Authentication Test');
  console.log('===========================');
  
  try {
    // Test sign-up
    const testSignUp = await prompt('Do you want to test sign-up? (y/n): ');
    
    if (testSignUp.toLowerCase() === 'y') {
      const email = await prompt('Enter email for sign-up: ');
      const password = await prompt('Enter password (min 8 characters): ');
      
      console.log(`\nAttempting to sign up with email: ${email}`);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'http://localhost:5173/auth/callback'
        }
      });
      
      if (signUpError) {
        console.error('❌ Sign-up failed:', signUpError.message);
      } else {
        console.log('✅ Sign-up successful!');
        console.log('User data:', signUpData.user);
        console.log('\nCheck your email for the confirmation link.');
      }
    }
    
    // Test sign-in
    const testSignIn = await prompt('\nDo you want to test sign-in? (y/n): ');
    
    if (testSignIn.toLowerCase() === 'y') {
      const email = await prompt('Enter email for sign-in: ');
      const password = await prompt('Enter password: ');
      
      console.log(`\nAttempting to sign in with email: ${email}`);
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('❌ Sign-in failed:', signInError.message);
      } else {
        console.log('✅ Sign-in successful!');
        console.log('Session:', signInData.session ? 'Active' : 'None');
        console.log('User:', signInData.user);
        
        // Test accessing protected data
        console.log('\nTesting access to protected data...');
        
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Error accessing user profile:', profileError.message);
        } else {
          console.log('✅ Successfully accessed user profile:');
          console.log(profileData);
        }
        
        // Test sign-out
        const testSignOut = await prompt('\nDo you want to test sign-out? (y/n): ');
        
        if (testSignOut.toLowerCase() === 'y') {
          const { error: signOutError } = await supabase.auth.signOut();
          
          if (signOutError) {
            console.error('❌ Sign-out failed:', signOutError.message);
          } else {
            console.log('✅ Sign-out successful!');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the test
testAuthentication().catch(console.error);
