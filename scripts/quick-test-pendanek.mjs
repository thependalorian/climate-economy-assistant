// Quick test for pendanek@gmail.com
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPendanek() {
  const email = 'pendanek@gmail.com';
  const userType = 'job_seeker';
  const password = 'TestPassword123!';
  
  console.log('🧪 Testing pendanek@gmail.com registration');
  console.log('='.repeat(40));
  
  try {
    // Check if user exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === email);
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.id);
      console.log('📧 Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');
      
      if (!existingUser.email_confirmed_at) {
        console.log('🔄 Manually confirming email...');
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true
        });
        console.log('✅ Email confirmed!');
      }
    } else {
      console.log('🔄 Creating new user...');
      
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
          data: {
            user_type: userType,
            first_name: 'George',
            last_name: 'Nekwaya'
          }
        }
      });
      
      if (error) {
        console.error('❌ Registration failed:', error.message);
        return;
      }
      
      console.log('✅ User created:', signUpData.user?.id);
      
      // Manually confirm email
      console.log('🔄 Manually confirming email...');
      await supabaseAdmin.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true
      });
      console.log('✅ Email confirmed!');
    }
    
    console.log('\n🎉 Ready to test!');
    console.log('📋 Next steps:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log('2. Login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('3. Should redirect to job seeker onboarding');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPendanek(); 