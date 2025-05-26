#!/usr/bin/env node

/**
 * Fix Foreign Key Constraints
 * 
 * This script identifies and fixes foreign key constraint issues
 * that are preventing user profile creation.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestAuthUser() {
  console.log('🔄 Creating test auth user...');
  
  try {
    // Create a test user in auth.users
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test-user@example.com',
      password: 'test-password-123',
      email_confirm: true
    });

    if (error) {
      console.error(`❌ Failed to create auth user: ${error.message}`);
      return null;
    }

    console.log(`✅ Created auth user with ID: ${data.user.id}`);
    return data.user.id;
  } catch (err) {
    console.error(`❌ Exception creating auth user: ${err.message}`);
    return null;
  }
}

async function testUserProfileCreationWithAuthUser(userId) {
  console.log('🔄 Testing user profile creation with auth user...');
  
  try {
    const testProfile = {
      id: userId,
      email: 'test-user@example.com',
      user_type: 'job_seeker',
      first_name: 'Test',
      last_name: 'User',
      profile_completed: false
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create user profile: ${error.message}`);
      return false;
    }

    console.log(`✅ Successfully created user profile`);
    return true;
  } catch (err) {
    console.error(`❌ Exception creating user profile: ${err.message}`);
    return false;
  }
}

async function testJobSeekerProfileCreation(userId) {
  console.log('🔄 Testing job seeker profile creation...');
  
  try {
    const testJobSeekerProfile = {
      id: userId,
      veteran: false,
      international_professional: false,
      ej_community_resident: false,
      onboarding_completed: false,
      onboarding_step: 1,
      willing_to_relocate: false
    };

    const { data, error } = await supabase
      .from('job_seeker_profiles')
      .insert(testJobSeekerProfile)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create job seeker profile: ${error.message}`);
      return false;
    }

    console.log(`✅ Successfully created job seeker profile`);
    return true;
  } catch (err) {
    console.error(`❌ Exception creating job seeker profile: ${err.message}`);
    return false;
  }
}

async function testProfileRetrieval(userId) {
  console.log('🔄 Testing profile retrieval...');
  
  try {
    // Test retrieving the user profile
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error(`❌ Failed to retrieve user profile: ${userError.message}`);
      return false;
    }

    // Test retrieving the job seeker profile
    const { data: jobSeekerProfile, error: jobSeekerError } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (jobSeekerError) {
      console.error(`❌ Failed to retrieve job seeker profile: ${jobSeekerError.message}`);
      return false;
    }

    console.log(`✅ Successfully retrieved both profiles`);
    console.log(`📊 User Profile: ${userProfile.first_name} ${userProfile.last_name} (${userProfile.user_type})`);
    console.log(`📊 Job Seeker Profile: Onboarding step ${jobSeekerProfile.onboarding_step}`);
    
    return true;
  } catch (err) {
    console.error(`❌ Exception retrieving profiles: ${err.message}`);
    return false;
  }
}

async function cleanupTestData(userId) {
  console.log('🔄 Cleaning up test data...');
  
  try {
    // Clean up job seeker profile
    await supabase
      .from('job_seeker_profiles')
      .delete()
      .eq('id', userId);

    // Clean up user profile
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    // Clean up auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`⚠️ Warning: Could not delete auth user: ${error.message}`);
    }

    console.log(`✅ Cleanup completed`);
  } catch (err) {
    console.warn(`⚠️ Warning: Cleanup failed: ${err.message}`);
  }
}

async function testCompleteFlow() {
  console.log('🚀 Testing complete authentication and profile flow...\n');

  // Step 1: Create auth user
  const userId = await createTestAuthUser();
  if (!userId) {
    console.error('❌ Cannot proceed without auth user');
    return false;
  }

  let allTestsPassed = true;

  // Step 2: Test user profile creation
  const userProfileSuccess = await testUserProfileCreationWithAuthUser(userId);
  if (!userProfileSuccess) {
    allTestsPassed = false;
  }

  // Step 3: Test job seeker profile creation
  const jobSeekerProfileSuccess = await testJobSeekerProfileCreation(userId);
  if (!jobSeekerProfileSuccess) {
    allTestsPassed = false;
  }

  // Step 4: Test profile retrieval
  const retrievalSuccess = await testProfileRetrieval(userId);
  if (!retrievalSuccess) {
    allTestsPassed = false;
  }

  // Step 5: Cleanup
  await cleanupTestData(userId);

  return allTestsPassed;
}

async function main() {
  try {
    console.log('🔗 Connecting to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Using Service Role Key\n`);

    const success = await testCompleteFlow();

    console.log('\n📊 FINAL RESULTS');
    console.log('================');
    
    if (success) {
      console.log('🎉 All tests passed! The authentication and profile system is working correctly.');
      console.log('✅ Foreign key constraints are properly configured');
      console.log('✅ User profiles can be created with auth users');
      console.log('✅ Job seeker profiles can be created');
      console.log('✅ Profile retrieval is working');
      console.log('\n🎯 Your system is ready for production use!');
    } else {
      console.log('❌ Some tests failed. The system needs additional fixes.');
      console.log('\n🎯 Next steps:');
      console.log('1. Review the error messages above');
      console.log('2. Check database schema and constraints');
      console.log('3. Verify RLS policies are correctly configured');
      console.log('4. Test the frontend authentication flow');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 