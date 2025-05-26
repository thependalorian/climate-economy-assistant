// Script to test Supabase connection
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

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log(`URL: ${supabaseUrl}`);
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\nTest 1: Basic connection test');
    const { data: versionData, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('❌ Connection failed:', versionError.message);
    } else {
      console.log('✅ Successfully connected to Supabase');
      console.log('Version info:', versionData);
    }
    
    // Test 2: Check auth service
    console.log('\nTest 2: Auth service test');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service test failed:', authError.message);
    } else {
      console.log('✅ Auth service is working properly');
      console.log('Session:', authData.session ? 'Active' : 'None');
    }
    
    // Test 3: Check database access
    console.log('\nTest 3: Database access test');
    
    // Try to access a few tables
    const tables = [
      'user_profiles',
      'job_seeker_profiles',
      'partner_profiles',
      'job_listings',
      'training_programs'
    ];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Failed to access table '${table}':`, error.message);
      } else {
        console.log(`✅ Successfully accessed table '${table}' (${count} rows)`);
      }
    }
    
    console.log('\nConnection tests complete!');
    
  } catch (error) {
    console.error('Unexpected error during connection test:', error.message);
  }
}

// Run the test
testConnection().catch(console.error);
