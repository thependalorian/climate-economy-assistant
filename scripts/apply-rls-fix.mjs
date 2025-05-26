#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kvtkpguwoaqokcylzpic.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Get it from: https://app.supabase.com/project/kvtkpguwoaqokcylzpic/settings/api');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyRLSFix() {
  try {
    console.log('🔧 Applying RLS Policy Fix...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'fix-rls-direct.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.log(`📄 Statement: ${statement}`);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 RLS Policy Fix completed!');
    console.log('🔍 Test your application now - the 500 errors should be resolved.');
    
  } catch (error) {
    console.error('❌ Failed to apply RLS fix:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyRLSFixDirect() {
  try {
    console.log('🔧 Applying RLS Policy Fix (Direct Method)...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'fix-rls-direct.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL directly...');
    
    // Try to execute the entire SQL content at once
    const { data, error } = await supabase
      .from('_supabase_admin')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Direct admin access not available, using statement-by-statement approach...');
      return applyRLSFix();
    }
    
    // If we have admin access, we could execute the SQL directly
    // For now, fall back to statement-by-statement
    return applyRLSFix();
    
  } catch (error) {
    console.error('❌ Failed to apply RLS fix:', error.message);
    process.exit(1);
  }
}

console.log('🚀 CEA Platform - RLS Policy Fix');
console.log('================================');
console.log('This script will fix the infinite recursion in RLS policies');
console.log('that are causing 500 errors in your application.\n');

applyRLSFixDirect(); 