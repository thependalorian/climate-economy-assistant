#!/usr/bin/env node

/**
 * Debug script to test Edge Function and see actual error responses
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugEdgeFunction() {
  console.log('🔍 Debugging Edge Function Response\n');
  
  try {
    console.log('📡 Invoking langgraph-agent-response...');
    
    const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
      body: {
        message: 'I want to transition to clean energy',
        userId: 'debug-user',
        threadId: 'debug-thread'
      }
    });
    
    console.log('\n📊 Raw Response:');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', JSON.stringify(error, null, 2));
    
    if (error) {
      console.log('\n❌ Error Details:');
      console.log('- Message:', error.message);
      console.log('- Context:', error.context);
      console.log('- Details:', error.details);
      console.log('- Hint:', error.hint);
      console.log('- Code:', error.code);
    }
    
    if (data) {
      console.log('\n✅ Success! Response received');
      console.log('- Type:', typeof data);
      console.log('- Keys:', Object.keys(data));
    }
    
  } catch (error) {
    console.error('\n💥 Exception caught:');
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    console.error('- Name:', error.name);
  }
}

debugEdgeFunction().catch(console.error); 