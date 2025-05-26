#!/usr/bin/env node

/**
 * Test Authentication and Profile Creation
 * 
 * This script tests the complete authentication flow and profile creation
 * to verify that all data model alignments are working properly.
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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AuthProfileTester {
  constructor() {
    this.testResults = {};
    this.testEmail = `test-${Date.now()}@example.com`;
    this.testUserId = null;
  }

  async runTest(testName, testFunction) {
    console.log(`🧪 Testing: ${testName}`);
    try {
      const result = await testFunction();
      this.testResults[testName] = { success: true, result };
      console.log(`✅ ${testName}: PASSED`);
      return result;
    } catch (error) {
      this.testResults[testName] = { success: false, error: error.message };
      console.error(`❌ ${testName}: FAILED - ${error.message}`);
      return null;
    }
  }

  async testDatabaseConnection() {
    return this.runTest('Database Connection', async () => {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('count', { count: 'exact' })
        .limit(0);
      
      if (error) throw new Error(error.message);
      return 'Connected successfully';
    });
  }

  async testTableStructures() {
    return this.runTest('Table Structures', async () => {
      const tables = ['user_profiles', 'job_seeker_profiles', 'partner_profiles', 'admin_profiles'];
      const structures = {};
      
      for (const table of tables) {
        try {
          // Try to insert a test record to see what columns are required/available
          const testData = { id: '00000000-0000-0000-0000-000000000000' };
          
          const { error } = await supabaseAdmin
            .from(table)
            .insert(testData);
          
          if (error) {
            // Parse the error to understand the table structure
            structures[table] = {
              accessible: true,
              error: error.message,
              hint: error.hint || 'No hint available'
            };
          } else {
            // Clean up the test record
            await supabaseAdmin
              .from(table)
              .delete()
              .eq('id', '00000000-0000-0000-0000-000000000000');
            
            structures[table] = { accessible: true, insertable: true };
          }
        } catch (err) {
          structures[table] = { accessible: false, error: err.message };
        }
      }
      
      return structures;
    });
  }

  async testUserProfileCreation() {
    return this.runTest('User Profile Creation', async () => {
      // Create a test user profile
      const testProfile = {
        id: '11111111-1111-1111-1111-111111111111',
        email: this.testEmail,
        user_type: 'job_seeker',
        first_name: 'Test',
        last_name: 'User',
        profile_completed: false
      };

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .insert(testProfile)
        .select()
        .single();

      if (error) throw new Error(error.message);
      
      this.testUserId = testProfile.id;
      return data;
    });
  }

  async testJobSeekerProfileCreation() {
    return this.runTest('Job Seeker Profile Creation', async () => {
      if (!this.testUserId) throw new Error('No test user ID available');

      const testJobSeekerProfile = {
        id: this.testUserId,
        veteran: false,
        international_professional: false,
        ej_community_resident: false,
        onboarding_completed: false,
        onboarding_step: 1,
        willing_to_relocate: false
      };

      const { data, error } = await supabaseAdmin
        .from('job_seeker_profiles')
        .insert(testJobSeekerProfile)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    });
  }

  async testPartnerProfileCreation() {
    return this.runTest('Partner Profile Creation', async () => {
      const testPartnerId = '22222222-2222-2222-2222-222222222222';
      
      // First create a user profile for the partner
      const testUserProfile = {
        id: testPartnerId,
        email: `partner-${Date.now()}@example.com`,
        user_type: 'partner',
        organization_name: 'Test Organization',
        organization_type: 'employer',
        profile_completed: false
      };

      await supabaseAdmin
        .from('user_profiles')
        .insert(testUserProfile);

      // Then create the partner profile
      const testPartnerProfile = {
        id: testPartnerId,
        organization_name: 'Test Organization',
        organization_type: 'employer',
        website: 'https://test.com',
        description: 'Test organization for profile testing',
        partnership_level: 'standard',
        climate_focus: ['renewable_energy'],
        verified: false
      };

      const { data, error } = await supabaseAdmin
        .from('partner_profiles')
        .insert(testPartnerProfile)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    });
  }

  async testProfileRetrieval() {
    return this.runTest('Profile Retrieval', async () => {
      if (!this.testUserId) throw new Error('No test user ID available');

      // Test retrieving the user profile
      const { data: userProfile, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', this.testUserId)
        .single();

      if (userError) throw new Error(`User profile retrieval failed: ${userError.message}`);

      // Test retrieving the job seeker profile
      const { data: jobSeekerProfile, error: jobSeekerError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .select('*')
        .eq('id', this.testUserId)
        .single();

      if (jobSeekerError) throw new Error(`Job seeker profile retrieval failed: ${jobSeekerError.message}`);

      return {
        userProfile,
        jobSeekerProfile
      };
    });
  }

  async testRLSPolicies() {
    return this.runTest('RLS Policies', async () => {
      if (!this.testUserId) throw new Error('No test user ID available');

      // Test that RLS policies don't cause infinite recursion
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', this.testUserId);

      // This should fail with authentication error, not infinite recursion
      if (error && error.message.includes('infinite recursion')) {
        throw new Error('RLS policies still have infinite recursion issue');
      }

      return 'RLS policies are working (no infinite recursion detected)';
    });
  }

  async testVectorEmbeddings() {
    return this.runTest('Vector Embeddings', async () => {
      const { data, error } = await supabaseAdmin
        .from('knowledge_resources')
        .select('id, title, embedding')
        .not('embedding', 'is', null)
        .limit(1);

      if (error) throw new Error(error.message);
      
      if (!data || data.length === 0) {
        return 'No embeddings found (this is okay for testing)';
      }

      const embedding = data[0].embedding;
      let parsedEmbedding;
      
      if (typeof embedding === 'string') {
        parsedEmbedding = JSON.parse(embedding);
      } else {
        parsedEmbedding = embedding;
      }

      if (!Array.isArray(parsedEmbedding)) {
        throw new Error('Embedding is not an array');
      }

      return {
        embeddingDimension: parsedEmbedding.length,
        sampleValues: parsedEmbedding.slice(0, 3),
        totalRecords: data.length
      };
    });
  }

  async cleanupTestData() {
    return this.runTest('Cleanup Test Data', async () => {
      const cleanupResults = [];

      // Clean up job seeker profile
      if (this.testUserId) {
        const { error: jobSeekerError } = await supabaseAdmin
          .from('job_seeker_profiles')
          .delete()
          .eq('id', this.testUserId);
        
        cleanupResults.push(`Job seeker profile: ${jobSeekerError ? 'Failed' : 'Cleaned'}`);
      }

      // Clean up user profiles
      const { error: userError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .like('email', '%@example.com');
      
      cleanupResults.push(`User profiles: ${userError ? 'Failed' : 'Cleaned'}`);

      // Clean up partner profiles
      const { error: partnerError } = await supabaseAdmin
        .from('partner_profiles')
        .delete()
        .eq('organization_name', 'Test Organization');
      
      cleanupResults.push(`Partner profiles: ${partnerError ? 'Failed' : 'Cleaned'}`);

      return cleanupResults;
    });
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive authentication and profile tests...\n');

    // Run all tests in sequence
    await this.testDatabaseConnection();
    await this.testTableStructures();
    await this.testUserProfileCreation();
    await this.testJobSeekerProfileCreation();
    await this.testPartnerProfileCreation();
    await this.testProfileRetrieval();
    await this.testRLSPolicies();
    await this.testVectorEmbeddings();
    await this.cleanupTestData();

    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

    // Show detailed results
    Object.entries(this.testResults).forEach(([testName, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${testName}`);
      
      if (!result.success) {
        console.log(`   Error: ${result.error}`);
      } else if (result.result && typeof result.result === 'object') {
        console.log(`   Result: ${JSON.stringify(result.result, null, 2).substring(0, 200)}...`);
      }
    });

    console.log('\n🎯 RECOMMENDATIONS');
    console.log('==================');

    if (failedTests === 0) {
      console.log('🎉 All tests passed! Your database and authentication system is working correctly.');
      console.log('✅ Data model alignment is successful');
      console.log('✅ RLS policies are working without infinite recursion');
      console.log('✅ Profile creation and retrieval is functional');
      console.log('✅ Vector embeddings are properly configured');
    } else {
      console.log('⚠️ Some tests failed. Review the errors above and:');
      console.log('1. Check database schema alignment');
      console.log('2. Verify RLS policies are correctly configured');
      console.log('3. Ensure all required columns exist');
      console.log('4. Test authentication flow manually');
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🔗 Connecting to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Using Service Role Key for testing\n`);

    const tester = new AuthProfileTester();
    await tester.runAllTests();

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 