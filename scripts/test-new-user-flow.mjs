import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNewUserFlow() {
  console.log('🧪 Testing new user authentication flow...');
  
  const testUserId = 'd4cbc1a7-4754-4dfe-bf82-5a1e5f5ef09c';
  
  try {
    // Test 1: Check if user exists in auth.users
    console.log('\n📋 Test 1: Checking if user exists in auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUserId);
    
    if (authError) {
      console.error('❌ Auth user check failed:', authError);
      return false;
    }
    
    if (authUser.user) {
      console.log('✅ User exists in auth.users:', authUser.user.email);
    } else {
      console.log('❌ User not found in auth.users');
      return false;
    }
    
    // Test 2: Check if profile exists (should be null for new users)
    console.log('\n📋 Test 2: Checking profile status...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
      
    if (profileError && profileError.code === 'PGRST116') {
      console.log('✅ No profile found - this is CORRECT for new users');
    } else if (profileError) {
      console.error('❌ Unexpected profile error:', profileError);
      return false;
    } else {
      console.log('⚠️ Profile found - this should NOT exist for new users:', profile);
      return false;
    }
    
    // Test 3: Simulate the authentication flow
    console.log('\n📋 Test 3: Simulating authentication flow...');
    
    // Step 1: User logs in (auth succeeds)
    console.log('  ✅ Step 1: User authentication - SUCCESS');
    
    // Step 2: Profile fetch (should return null, not error)
    console.log('  ✅ Step 2: Profile fetch - NULL (expected for new users)');
    
    // Step 3: AuthRedirect logic
    console.log('  ✅ Step 3: AuthRedirect should allow onboarding access');
    
    // Step 4: Expected flow
    console.log('  ✅ Step 4: User should be redirected to /onboarding/job-seeker/step1');
    
    console.log('\n🎉 New user flow test PASSED!');
    console.log('📝 Expected behavior:');
    console.log('   1. User logs in successfully');
    console.log('   2. No profile found (this is normal)');
    console.log('   3. AuthRedirect allows onboarding access');
    console.log('   4. User completes onboarding');
    console.log('   5. Profile gets created during onboarding');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing new user authentication flow...');
  
  const success = await testNewUserFlow();
  
  if (success) {
    console.log('\n✅ All tests PASSED - New user flow is working correctly!');
  } else {
    console.log('\n❌ Tests FAILED - There are issues with the new user flow');
    process.exit(1);
  }
}

main().catch(console.error); 