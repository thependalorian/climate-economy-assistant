import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSpecificUser() {
  console.log('🧪 Testing specific user profile fetch...');
  
  const testUserId = 'd4cbc1a7-4754-4dfe-bf82-5a1e5f5ef09c';
  
  try {
    // Test the exact query that was failing in the browser
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id,user_type,profile_completed,email,first_name,last_name,organization_name,organization_type')
      .eq('id', testUserId);
      
    if (error) {
      console.error('❌ Query failed:', error);
      return false;
    }
    
    console.log('✅ Query successful!');
    console.log('📊 Results:', data);
    
    if (data && data.length > 0) {
      console.log('✅ User profile found:', data[0]);
      return true;
    } else {
      console.log('⚠️ No profile found for user');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing user profile fetch...');
  
  const success = await testSpecificUser();
  
  if (success) {
    console.log('✅ User profile fetch test PASSED');
    console.log('🎯 Login should now work without redirects');
  } else {
    console.log('❌ User profile fetch test FAILED');
    process.exit(1);
  }
}

main().catch(console.error); 