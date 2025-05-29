import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('  VITE_APP_URL:', import.meta.env.VITE_APP_URL);
console.log('  All VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('  URL:', supabaseUrl);
  console.error('  Key exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

console.log('🔧 Supabase config:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });

// Verify the URL is correct
if (supabaseUrl.includes('cea.georgenekwaya.com')) {
  console.error('🚨 ERROR: Supabase URL is incorrectly set to app domain!');
  console.error('  Expected: https://kvtkpguwoaqokcylzpic.supabase.co');
  console.error('  Got:', supabaseUrl);
}

// Create a simple browser client (for client-side usage)
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);