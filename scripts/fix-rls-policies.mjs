// Script to fix RLS policies in Supabase
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

async function fixRlsPolicies() {
  console.log('Fixing RLS policies in Supabase...');
  
  try {
    // SQL to fix RLS policies
    const sql = `
      -- Temporarily disable RLS to allow script to run
      ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE job_seeker_profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE partner_profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE job_listings DISABLE ROW LEVEL SECURITY;
      ALTER TABLE training_programs DISABLE ROW LEVEL SECURITY;
      ALTER TABLE job_matches DISABLE ROW LEVEL SECURITY;
      ALTER TABLE training_matches DISABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
      
      DROP POLICY IF EXISTS "Job seekers can read their own profile" ON job_seeker_profiles;
      DROP POLICY IF EXISTS "Job seekers can update their own profile" ON job_seeker_profiles;
      DROP POLICY IF EXISTS "Job seekers can insert their own profile" ON job_seeker_profiles;
      DROP POLICY IF EXISTS "Admins can read all job seeker profiles" ON job_seeker_profiles;
      
      DROP POLICY IF EXISTS "Partners can read their own profile" ON partner_profiles;
      DROP POLICY IF EXISTS "Partners can update their own profile" ON partner_profiles;
      DROP POLICY IF EXISTS "Partners can insert their own profile" ON partner_profiles;
      DROP POLICY IF EXISTS "Anyone can read partner profiles" ON partner_profiles;
      DROP POLICY IF EXISTS "Admins can read all partner profiles" ON partner_profiles;
      
      -- Re-enable RLS
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
      ALTER TABLE training_matches ENABLE ROW LEVEL SECURITY;
      
      -- Create user_profiles policies
      CREATE POLICY "Users can read their own profile"
        ON user_profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
      
      CREATE POLICY "Users can update their own profile"
        ON user_profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
        
      CREATE POLICY "Users can insert their own profile"
        ON user_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
      
      CREATE POLICY "Admins can read all profiles"
        ON user_profiles
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
        );
      
      -- Create job_seeker_profiles policies
      CREATE POLICY "Job seekers can read their own profile"
        ON job_seeker_profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
      
      CREATE POLICY "Job seekers can update their own profile"
        ON job_seeker_profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
        
      CREATE POLICY "Job seekers can insert their own profile"
        ON job_seeker_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
      
      CREATE POLICY "Admins can read all job seeker profiles"
        ON job_seeker_profiles
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
        );
      
      -- Create partner_profiles policies
      CREATE POLICY "Partners can read their own profile"
        ON partner_profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
      
      CREATE POLICY "Partners can update their own profile"
        ON partner_profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
        
      CREATE POLICY "Partners can insert their own profile"
        ON partner_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
      
      CREATE POLICY "Anyone can read partner profiles"
        ON partner_profiles
        FOR SELECT
        TO authenticated
        USING (true);
      
      CREATE POLICY "Admins can read all partner profiles"
        ON partner_profiles
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
        );
      
      -- Add a policy to allow public access to partner profiles
      CREATE POLICY "Public can read partner profiles"
        ON partner_profiles
        FOR SELECT
        TO anon
        USING (verified = true);
    `;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error fixing RLS policies:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Successfully fixed RLS policies');
    
  } catch (error) {
    console.error('Unexpected error fixing RLS policies:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixRlsPolicies().catch(console.error);
