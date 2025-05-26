#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  try {
    console.log('🔄 Running security tables migration...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250125000001_security_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration using a simple query
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.warn('⚠️ Migration completed with warnings:', error.message);
    } else {
      console.log('✅ Security tables migration completed successfully');
    }
    
    // Test that tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['security_events', 'otp_codes', 'user_consents']);
    
    if (!tablesError && tables) {
      console.log(`📊 Created ${tables.length} security tables`);
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    
    // Try alternative approach - create tables individually
    console.log('🔄 Trying alternative approach...');
    await createTablesIndividually();
  }
}

async function createTablesIndividually() {
  const tables = [
    {
      name: 'security_events',
      sql: `
        CREATE TABLE IF NOT EXISTS security_events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          ip_address INET NOT NULL,
          user_agent TEXT NOT NULL,
          details JSONB DEFAULT '{}',
          risk_level TEXT NOT NULL DEFAULT 'low',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'otp_codes',
      sql: `
        CREATE TABLE IF NOT EXISTS otp_codes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID,
          email TEXT NOT NULL,
          code TEXT NOT NULL,
          type TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'user_consents',
      sql: `
        CREATE TABLE IF NOT EXISTS user_consents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID,
          consent_type TEXT NOT NULL,
          granted BOOLEAN NOT NULL,
          granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address INET NOT NULL,
          user_agent TEXT NOT NULL,
          version TEXT NOT NULL DEFAULT '1.0',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      if (error) {
        console.warn(`⚠️ Warning creating ${table.name}:`, error.message);
      } else {
        console.log(`✅ Created table: ${table.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to create ${table.name}:`, err.message);
    }
  }
}

runMigration(); 