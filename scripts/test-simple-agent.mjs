#!/usr/bin/env node

/**
 * Simple Agent Test
 * Tests the agent function with minimal payload to debug issues
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kvtkpguwoaqokcylzpic.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSimpleAgent() {
  console.log('🔍 Testing Simple Agent Function');
  console.log('=' .repeat(50));

  try {
    console.log('\n📞 Testing agent function with minimal payload...');
    
    const { data: agentData, error: agentError } = await supabase.functions.invoke('langgraph-agent-response', {
      body: {
        message: 'Hello',
        userId: 'test-user-simple',
        threadId: 'test-thread-simple'
      }
    });

    if (agentError) {
      console.error('❌ Agent function error:', agentError);
      console.log('   Status:', agentError.status);
      console.log('   Message:', agentError.message);
      
      // Try to get more details from the error context
      if (agentError.context && agentError.context.body) {
        try {
          const errorBody = await agentError.context.text();
          console.log('   Error Body:', errorBody);
        } catch (e) {
          console.log('   Could not read error body');
        }
      }
    } else {
      console.log('✅ Agent function responded successfully');
      console.log('📝 Response:', JSON.stringify(agentData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run test
testSimpleAgent().catch(console.error); 