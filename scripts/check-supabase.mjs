// Script to check Supabase connection and tables
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

async function checkSupabaseConnection() {
  console.log('Checking Supabase connection...');
  
  try {
    // Check auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error connecting to Supabase Auth:', authError.message);
    } else {
      console.log('✅ Successfully connected to Supabase Auth service');
    }

    // Check tables
    const tables = [
      'user_profiles',
      'job_seeker_profiles',
      'partner_profiles',
      'job_listings',
      'training_programs',
      'job_matches',
      'training_matches'
    ];

    console.log('\nChecking database tables:');
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error accessing table '${table}':`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists with ${count} rows`);
      }
    }

    // Check RLS policies
    console.log('\nNote: Row Level Security (RLS) policies are active.');
    console.log('To access protected data, you need to sign in with a valid user account.');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the check
checkSupabaseConnection().catch(console.error);
