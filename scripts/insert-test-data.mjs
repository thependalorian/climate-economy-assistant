// Script to insert test data into Supabase
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

async function insertTestData() {
  console.log('Inserting test data into Supabase...');
  
  try {
    // First, create a test user with Supabase Auth
    console.log('\nCreating test user...');
    
    const testEmail = `test-jobseeker-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Error creating test user:', authError.message);
      return;
    }
    
    console.log('✅ Test user created successfully');
    console.log('User ID:', authData.user.id);
    console.log('Email:', testEmail);
    
    // Create user profile
    console.log('\nCreating user profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        user_type: 'job_seeker',
        profile_completed: false
      })
      .select();
    
    if (profileError) {
      console.error('❌ Error creating user profile:', profileError.message);
      return;
    }
    
    console.log('✅ User profile created successfully');
    
    // Create job seeker profile
    console.log('\nCreating job seeker profile...');
    
    const { data: seekerData, error: seekerError } = await supabase
      .from('job_seeker_profiles')
      .insert({
        id: authData.user.id,
        onboarding_completed: false,
        onboarding_step: 1,
        barriers: ['lack_of_experience', 'need_training'],
        interests: ['renewable_energy', 'sustainability'],
        veteran: false,
        international_professional: false,
        ej_community_resident: true
      })
      .select();
    
    if (seekerError) {
      console.error('❌ Error creating job seeker profile:', seekerError.message);
      return;
    }
    
    console.log('✅ Job seeker profile created successfully');
    
    // Create a test partner user
    console.log('\nCreating test partner user...');
    
    const partnerEmail = `test-partner-${Date.now()}@example.com`;
    
    const { data: partnerAuthData, error: partnerAuthError } = await supabase.auth.signUp({
      email: partnerEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Partner',
          last_name: 'Organization'
        }
      }
    });
    
    if (partnerAuthError) {
      console.error('❌ Error creating test partner user:', partnerAuthError.message);
      return;
    }
    
    console.log('✅ Test partner user created successfully');
    console.log('Partner User ID:', partnerAuthData.user.id);
    console.log('Partner Email:', partnerEmail);
    
    // Create partner user profile
    console.log('\nCreating partner user profile...');
    
    const { data: partnerProfileData, error: partnerProfileError } = await supabase
      .from('user_profiles')
      .insert({
        id: partnerAuthData.user.id,
        email: partnerEmail,
        first_name: 'Partner',
        last_name: 'Organization',
        user_type: 'partner',
        organization_name: 'Green Energy Solutions',
        organization_type: 'employer',
        profile_completed: false
      })
      .select();
    
    if (partnerProfileError) {
      console.error('❌ Error creating partner user profile:', partnerProfileError.message);
      return;
    }
    
    console.log('✅ Partner user profile created successfully');
    
    // Create partner profile
    console.log('\nCreating partner profile...');
    
    const { data: partnerData, error: partnerError } = await supabase
      .from('partner_profiles')
      .insert({
        id: partnerAuthData.user.id,
        organization_name: 'Green Energy Solutions',
        organization_type: 'employer',
        website: 'https://example.com',
        description: 'A company focused on renewable energy solutions',
        partnership_level: 'standard',
        climate_focus: ['solar', 'energy_efficiency'],
        verified: true
      })
      .select();
    
    if (partnerError) {
      console.error('❌ Error creating partner profile:', partnerError.message);
      return;
    }
    
    console.log('✅ Partner profile created successfully');
    
    console.log('\nTest data insertion complete!');
    console.log('\nTest User Credentials:');
    console.log(`Job Seeker: ${testEmail} / ${testPassword}`);
    console.log(`Partner: ${partnerEmail} / ${testPassword}`);
    console.log('\nNote: These users need email confirmation before they can log in.');
    
  } catch (error) {
    console.error('Unexpected error during test data insertion:', error.message);
  }
}

// Run the insertion
insertTestData().catch(console.error);
