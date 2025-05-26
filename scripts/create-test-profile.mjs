import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestProfile() {
  console.log('🔧 Creating test user profile...');
  
  const testUserId = 'd4cbc1a7-4754-4dfe-bf82-5a1e5f5ef09c';
  const testEmail = 'pendanek@gmail.com';
  
  try {
    // Check if profile already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
      
    if (existing) {
      console.log('✅ Profile already exists:', existing);
      return existing;
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', checkError);
      return null;
    }
    
    console.log('📝 Creating new profile for user:', testUserId);
    
    // Create the profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        user_type: 'job_seeker',
        profile_completed: false,
        first_name: null,
        last_name: null,
        organization_name: null,
        organization_type: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Error creating profile:', createError);
      return null;
    }
    
    console.log('✅ Profile created successfully:', newProfile);
    return newProfile;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting profile creation...');
  
  const profile = await createTestProfile();
  
  if (profile) {
    console.log('✅ Profile creation completed successfully');
    console.log('🎯 User can now proceed to onboarding');
  } else {
    console.log('❌ Profile creation failed');
    process.exit(1);
  }
}

main().catch(console.error); 