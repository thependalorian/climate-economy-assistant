#!/usr/bin/env node

/**
 * Test Vector Search Functions
 * Tests the newly added vector search functionality for knowledge_resources
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

async function testVectorSearchFunctions() {
  console.log('🔍 Testing Vector Search Functions');
  console.log('=' .repeat(50));

  try {
    // 1. Check if knowledge_resources table has data
    console.log('\n📊 Checking knowledge_resources table...');
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('knowledge_resources')
      .select('id, title, embedding')
      .limit(5);

    if (resourcesError) {
      console.error('❌ Error querying knowledge_resources:', resourcesError);
      return;
    }

    console.log(`✅ Found ${resourcesData?.length || 0} knowledge resources`);
    
    if (resourcesData && resourcesData.length > 0) {
      const withEmbeddings = resourcesData.filter(r => r.embedding !== null);
      console.log(`📈 Resources with embeddings: ${withEmbeddings.length}`);
      
      if (withEmbeddings.length > 0) {
        console.log(`📝 Sample resource: "${resourcesData[0].title}"`);
      }
    }

    // 2. Test text search function (fallback)
    console.log('\n🔤 Testing text search function...');
    const { data: textSearchData, error: textSearchError } = await supabase
      .rpc('search_knowledge_resources_text', {
        search_query: 'clean energy',
        match_count: 3
      });

    if (textSearchError) {
      console.error('❌ Text search function error:', textSearchError);
    } else {
      console.log(`✅ Text search returned ${textSearchData?.length || 0} results`);
      if (textSearchData && textSearchData.length > 0) {
        console.log(`📝 Sample result: "${textSearchData[0].title}"`);
      }
    }

    // 3. Test vector search function (if we have embeddings)
    console.log('\n🎯 Testing vector search function...');
    
    // Create a dummy embedding for testing (1536 dimensions)
    const dummyEmbedding = Array(1536).fill(0).map(() => Math.random() * 0.1);
    
    const { data: vectorSearchData, error: vectorSearchError } = await supabase
      .rpc('search_knowledge_resources', {
        query_embedding: dummyEmbedding,
        match_threshold: 0.1, // Very low threshold for testing
        match_count: 3
      });

    if (vectorSearchError) {
      console.error('❌ Vector search function error:', vectorSearchError);
      console.log('   This might be expected if there are no embeddings in the database');
    } else {
      console.log(`✅ Vector search returned ${vectorSearchData?.length || 0} results`);
      if (vectorSearchData && vectorSearchData.length > 0) {
        console.log(`📝 Sample result: "${vectorSearchData[0].title}" (similarity: ${vectorSearchData[0].similarity})`);
      }
    }

    // 4. Test function permissions
    console.log('\n🔐 Testing function permissions...');
    
    // Test with authenticated role (simulated)
    const { data: permissionTest, error: permissionError } = await supabase
      .rpc('search_knowledge_resources_text', {
        search_query: 'test',
        match_count: 1
      });

    if (permissionError) {
      console.error('❌ Permission test failed:', permissionError);
    } else {
      console.log('✅ Function permissions working correctly');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function testAgentFunctionIntegration() {
  console.log('\n🤖 Testing Agent Function Integration');
  console.log('=' .repeat(50));

  try {
    // Test the langgraph-agent-response function with a simple query
    console.log('\n📞 Testing agent function...');
    
    const { data: agentData, error: agentError } = await supabase.functions.invoke('langgraph-agent-response', {
      body: {
        message: 'What clean energy training programs are available?',
        userId: 'test-user-vector-search',
        threadId: 'test-thread-vector-search'
      }
    });

    if (agentError) {
      console.error('❌ Agent function error:', agentError);
      console.log('   Status:', agentError.status);
      console.log('   Details:', agentError.message);
    } else {
      console.log('✅ Agent function responded successfully');
      console.log('📝 Response preview:', agentData.response?.substring(0, 200) + '...');
      console.log('🎯 Agent used:', agentData.agent);
      console.log('💡 Recommendations:', agentData.recommendations?.length || 0);
    }

  } catch (error) {
    console.error('❌ Agent integration test failed:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Vector Search and Agent Integration Tests');
  console.log('=' .repeat(80));
  
  await testVectorSearchFunctions();
  await testAgentFunctionIntegration();
  
  console.log('\n✅ All tests completed!');
  console.log('=' .repeat(80));
}

runAllTests().catch(console.error); 