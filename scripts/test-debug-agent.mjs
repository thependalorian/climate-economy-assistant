#!/usr/bin/env node

/**
 * Debug Agent Test
 * Identifies specific internal errors in LangGraph processing
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

async function debugAgentProcessing() {
  console.log('🔍 Debug Agent Processing');
  console.log('=' .repeat(50));

  // Test 1: Simple query to see detailed response
  console.log('\n📞 Test 1: Simple Career Query');
  console.log('-'.repeat(30));
  
  try {
    const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
      body: {
        message: 'What climate jobs are available?',
        userId: 'debug-001',
        threadId: 'debug-thread-001'
      }
    });
    
    if (error) {
      console.log(`❌ Error: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`✅ Response received`);
      console.log(`Full Response: ${JSON.stringify(data, null, 2)}`);
      
      // Check if it's a fallback response
      if (data.response && data.response.includes('apologize')) {
        console.log('⚠️  This appears to be a fallback error response');
      }
    }
    
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }

  // Test 2: Check environment variables in function
  console.log('\n📞 Test 2: Environment Check');
  console.log('-'.repeat(30));
  
  try {
    // Create a simple test function call to check env vars
    const { data: envData, error: envError } = await supabase.rpc('check_function_env');
    
    if (envError) {
      console.log('⚠️  Cannot check environment variables via RPC');
    } else {
      console.log(`Environment check: ${JSON.stringify(envData)}`);
    }
  } catch (err) {
    console.log('⚠️  Environment check not available');
  }

  // Test 3: Check database connectivity
  console.log('\n📞 Test 3: Database Connectivity');
  console.log('-'.repeat(30));
  
  try {
    const { data: partnerData, error: partnerError } = await supabase
      .from('partner_profiles')
      .select('id, organization_name')
      .limit(3);
    
    if (partnerError) {
      console.log(`❌ Database Error: ${partnerError.message}`);
    } else {
      console.log(`✅ Database connected - Found ${partnerData.length} partners`);
      console.log(`Sample partners: ${partnerData.map(p => p.organization_name).join(', ')}`);
    }
  } catch (err) {
    console.log(`❌ Database Exception: ${err.message}`);
  }

  // Test 4: Check knowledge base
  console.log('\n📞 Test 4: Knowledge Base Check');
  console.log('-'.repeat(30));
  
  try {
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_resources')
      .select('id, title')
      .limit(3);
    
    if (knowledgeError) {
      console.log(`❌ Knowledge Base Error: ${knowledgeError.message}`);
    } else {
      console.log(`✅ Knowledge Base connected - Found ${knowledgeData.length} resources`);
      console.log(`Sample resources: ${knowledgeData.map(k => k.title).join(', ')}`);
    }
  } catch (err) {
    console.log(`❌ Knowledge Base Exception: ${err.message}`);
  }

  // Test 5: Check vector search function
  console.log('\n📞 Test 5: Vector Search Function');
  console.log('-'.repeat(30));
  
  try {
    const { data: vectorData, error: vectorError } = await supabase.rpc('search_knowledge_resources_text', {
      query_text: 'climate jobs',
      match_count: 2
    });
    
    if (vectorError) {
      console.log(`❌ Vector Search Error: ${vectorError.message}`);
    } else {
      console.log(`✅ Vector Search working - Found ${vectorData.length} results`);
      if (vectorData.length > 0) {
        console.log(`Sample result: ${vectorData[0].title}`);
      }
    }
  } catch (err) {
    console.log(`❌ Vector Search Exception: ${err.message}`);
  }

  // Test 6: Test resume processing with minimal payload
  console.log('\n📞 Test 6: Resume Processing Debug');
  console.log('-'.repeat(30));
  
  try {
    const { data: resumeData, error: resumeError } = await supabase.functions.invoke('langgraph-process-resume', {
      body: {
        userId: 'debug-resume-001',
        resumeText: 'Software Engineer with 3 years experience',
        preferences: { location: 'Massachusetts' }
      }
    });
    
    if (resumeError) {
      console.log(`❌ Resume Error: ${JSON.stringify(resumeError, null, 2)}`);
    } else {
      console.log(`✅ Resume Processing Success`);
      console.log(`Resume Response: ${JSON.stringify(resumeData, null, 2)}`);
    }
  } catch (err) {
    console.log(`❌ Resume Exception: ${err.message}`);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🔍 Debug Summary Complete');
}

// Run the debug test
debugAgentProcessing().catch(console.error); 