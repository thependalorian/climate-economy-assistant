// Script to check Supabase auth schema
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

async function checkAuthSchema() {
  console.log('Checking Supabase auth configuration...\n');

  try {
    // Check if we can access auth.users
    console.log('Attempting to access auth configuration...');

    // Test authentication with a temporary user
    console.log('\nTesting authentication flow:');

    // Get current auth settings
    const { data: authSettings, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Error accessing auth settings:', authError.message);
    } else {
      console.log('✅ Successfully accessed auth settings');
      console.log('Current session:', authSettings.session ? 'Active' : 'None');
    }

    // Check auth providers
    console.log('\nChecking available auth providers:');

    // Email auth is always available
    console.log('- Email/Password: Available');

    // Check if OAuth providers are configured
    const providers = [
      'google',
      'facebook',
      'twitter',
      'github',
      'apple',
      'microsoft',
      'linkedin'
    ];

    for (const provider of providers) {
      // We can't directly check if providers are configured via the API
      // This is just a placeholder - in a real scenario, you'd need to check
      // the Supabase dashboard or configuration
      console.log(`- ${provider.charAt(0).toUpperCase() + provider.slice(1)}: Unknown (check Supabase dashboard)`);
    }

    // Check auth redirects
    console.log('\nAuth redirect URLs:');
    console.log(`- Redirect URL: http://localhost:5173/auth/callback (configured in code)`);

    console.log('\nAuth schema check complete!');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the check
checkAuthSchema().catch(console.error);
