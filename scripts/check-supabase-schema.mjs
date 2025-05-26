// Script to check Supabase database schema
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

// List of tables to check (based on our previous code exploration)
const tables = [
  'user_profiles',
  'job_seeker_profiles',
  'partner_profiles',
  'job_listings',
  'training_programs',
  'job_matches',
  'training_matches'
];

async function checkSupabaseSchema() {
  console.log('Checking Supabase database schema...\n');
  console.log(`Examining ${tables.length} tables:\n`);

  try {
    for (const tableName of tables) {
      console.log(`\n=== TABLE: ${tableName} ===`);

      // Try to get a single row to examine the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`Error accessing table '${tableName}':`, error.message);
        continue;
      }

      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error(`Error counting rows in table ${tableName}:`, countError.message);
      } else {
        console.log(`Row count: ${count}`);
      }

      // If we have data, show the structure
      if (data && data.length > 0) {
        console.log('Columns:');
        const columns = Object.keys(data[0]);

        for (const column of columns) {
          const value = data[0][column];
          const type = value === null ? 'unknown' : typeof value;
          console.log(`  - ${column} (${type})`);
        }

        // Show a sample row if available
        console.log('\nSample data:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('Table exists but is empty');
      }
    }

    console.log('\nSchema check complete!');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the check
checkSupabaseSchema().catch(console.error);
