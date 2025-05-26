import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeTestProfile() {
  console.log('🗑️ Removing test user profile...');
  
  const testUserId = 'd4cbc1a7-4754-4dfe-bf82-5a1e5f5ef09c';
  
  try {
    // Remove the profile
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', testUserId);
      
    if (error) {
      console.error('❌ Error removing profile:', error);
      return false;
    }
    
    console.log('✅ Test profile removed successfully');
    console.log('🎯 User is now in proper "new user" state (no profile)');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting profile removal...');
  
  const success = await removeTestProfile();
  
  if (success) {
    console.log('✅ Profile removal completed successfully');
    console.log('🔄 User will now go through proper onboarding flow');
  } else {
    console.log('❌ Profile removal failed');
    process.exit(1);
  }
}

main().catch(console.error); 