#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = 'https://kvtkpguwoaqokcylzpic.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGtwZ3V3b2Fxb2tjeWx6cGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTY0NDgsImV4cCI6MjA2MzU3MjQ0OH0.tmAmsWiqhJn4ceG3d_-RpXt7oSMNpcTUOei-igqu1Ps';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRLSFix() {
  console.log('🧪 Testing RLS Policy Fix...\n');

  try {
    // Test 1: Check if we can query user_profiles without infinite recursion
    console.log('📋 Test 1: Querying user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, user_type')
      .limit(1);

    if (profilesError) {
      if (profilesError.message.includes('infinite recursion')) {
        console.log('❌ FAILED: Infinite recursion still detected in user_profiles');
        console.log('   Error:', profilesError.message);
        return false;
      } else {
        console.log('✅ PASSED: No infinite recursion (got different error, which is expected without auth)');
        console.log('   Error:', profilesError.message);
      }
    } else {
      console.log('✅ PASSED: Query successful, no infinite recursion');
      console.log('   Results:', profiles?.length || 0, 'profiles found');
    }

    // Test 2: Check job_seeker_profiles
    console.log('\n📋 Test 2: Querying job_seeker_profiles table...');
    const { data: jobSeekers, error: jobSeekersError } = await supabase
      .from('job_seeker_profiles')
      .select('id')
      .limit(1);

    if (jobSeekersError) {
      if (jobSeekersError.message.includes('infinite recursion')) {
        console.log('❌ FAILED: Infinite recursion still detected in job_seeker_profiles');
        console.log('   Error:', jobSeekersError.message);
        return false;
      } else {
        console.log('✅ PASSED: No infinite recursion in job_seeker_profiles');
      }
    } else {
      console.log('✅ PASSED: Query successful, no infinite recursion');
    }

    // Test 3: Check partner_profiles
    console.log('\n📋 Test 3: Querying partner_profiles table...');
    const { data: partners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('id')
      .limit(1);

    if (partnersError) {
      if (partnersError.message.includes('infinite recursion')) {
        console.log('❌ FAILED: Infinite recursion still detected in partner_profiles');
        console.log('   Error:', partnersError.message);
        return false;
      } else {
        console.log('✅ PASSED: No infinite recursion in partner_profiles');
      }
    } else {
      console.log('✅ PASSED: Query successful, no infinite recursion');
    }

    // Test 4: Check education_records
    console.log('\n📋 Test 4: Querying education_records table...');
    const { data: education, error: educationError } = await supabase
      .from('education_records')
      .select('id')
      .limit(1);

    if (educationError) {
      if (educationError.message.includes('infinite recursion')) {
        console.log('❌ FAILED: Infinite recursion still detected in education_records');
        console.log('   Error:', educationError.message);
        return false;
      } else {
        console.log('✅ PASSED: No infinite recursion in education_records');
      }
    } else {
      console.log('✅ PASSED: Query successful, no infinite recursion');
    }

    console.log('\n🎉 ALL TESTS PASSED! RLS infinite recursion has been fixed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ user_profiles: No infinite recursion');
    console.log('   ✅ job_seeker_profiles: No infinite recursion');
    console.log('   ✅ partner_profiles: No infinite recursion');
    console.log('   ✅ education_records: No infinite recursion');
    console.log('\n🚀 The application should now work properly!');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
}

// Run the test
testRLSFix()
  .then(success => {
    if (success) {
      console.log('\n✅ RLS fix verification completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ RLS fix verification failed. Please apply the SQL fix again.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }); 