// Quick Supabase connection test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtkpguwoaqokcylzpic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGtwZ3V3b2Fxb2tjeWx6cGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTY0NDgsImV4cCI6MjA2MzU3MjQ0OH0.tmAmsWiqhJn4ceG3d_-RpXt7oSMNpcTUOei-igqu1Ps';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Testing Supabase connection...');

// Test 1: Basic connection
try {
  console.log('📡 Testing basic connection...');
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Auth session error:', error);
  } else {
    console.log('✅ Auth session successful:', data.session ? 'User logged in' : 'No active session');
  }
} catch (err) {
  console.error('❌ Connection failed:', err);
}

// Test 2: Database query
try {
  console.log('📊 Testing database query...');
  const { data, error } = await supabase
    .from('user_profiles')
    .select('count')
    .limit(1);
    
  if (error) {
    console.error('❌ Database query error:', error);
  } else {
    console.log('✅ Database query successful:', data);
  }
} catch (err) {
  console.error('❌ Database query failed:', err);
}

console.log('🏁 Test complete');
