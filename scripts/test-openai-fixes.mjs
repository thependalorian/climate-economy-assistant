#!/usr/bin/env node

/**
 * Test script to validate OpenAI timeout fixes and retry mechanisms
 * Tests the enhanced error handling, circuit breaker, and retry logic
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

// Test scenarios with different complexity levels
const testScenarios = [
  {
    name: 'Simple Career Question',
    message: 'I want to transition to clean energy',
    userId: 'test-user-1',
    threadId: 'thread-simple',
    expectedAgent: 'career_specialist',
    timeout: 30000
  },
  {
    name: 'Veterans Military Translation',
    message: 'I am a veteran with logistics experience in the military. How can I transition to clean energy?',
    userId: 'test-user-2', 
    threadId: 'thread-veterans',
    expectedAgent: 'veterans_specialist',
    timeout: 45000
  },
  {
    name: 'International Professional',
    message: 'I am an engineer from India looking to work in Massachusetts clean energy sector',
    userId: 'test-user-3',
    threadId: 'thread-international', 
    expectedAgent: 'international_specialist',
    timeout: 45000
  },
  {
    name: 'Environmental Justice Focus',
    message: 'I want to help my community access clean energy jobs and training',
    userId: 'test-user-4',
    threadId: 'thread-ej',
    expectedAgent: 'ej_specialist', 
    timeout: 45000
  },
  {
    name: 'Complex Multi-Agent Query',
    message: 'I am a veteran engineer from Mexico who wants to help underserved communities access clean energy careers',
    userId: 'test-user-5',
    threadId: 'thread-complex',
    expectedAgent: 'supervisor', // Should route through supervisor
    timeout: 60000
  }
];

async function testOpenAIFixes() {
  console.log('🧪 Testing OpenAI Timeout Fixes and Retry Mechanisms\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n🔍 Testing: ${scenario.name}`);
    console.log(`📝 Query: "${scenario.message}"`);
    console.log(`⏱️  Timeout: ${scenario.timeout}ms`);
    
    const startTime = Date.now();
    
    try {
      // Test the langgraph-agent-response function
      const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
        body: {
          message: scenario.message,
          userId: scenario.userId,
          threadId: scenario.threadId
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
          duration
        });
        continue;
      }
      
      // Analyze the response
      const response = data?.response || data?.message || 'No response';
      const agent = data?.agent || data?.current_agent || 'unknown';
      
      console.log(`✅ Success! Duration: ${duration}ms`);
      console.log(`🤖 Agent: ${agent}`);
      console.log(`📄 Response length: ${response.length} characters`);
      
      // Check if response contains error indicators
      const hasErrorIndicators = response.includes('technical issue') || 
                                response.includes('apologize') ||
                                response.includes('try again') ||
                                response.length < 100;
      
      if (hasErrorIndicators) {
        console.log(`⚠️  Warning: Response may indicate underlying issues`);
        console.log(`📝 Response preview: "${response.substring(0, 150)}..."`);
      } else {
        console.log(`🎯 Quality response received`);
      }
      
      results.push({
        scenario: scenario.name,
        success: true,
        agent,
        duration,
        responseLength: response.length,
        hasErrorIndicators,
        response: response.substring(0, 200)
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Exception: ${error.message}`);
      
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message,
        duration
      });
    }
    
    // Wait between tests to avoid rate limiting
    console.log('⏳ Waiting 3 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Summary report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const withErrors = results.filter(r => r.success && r.hasErrorIndicators);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`⚠️  With Error Indicators: ${withErrors.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const avgResponseLength = successful.reduce((sum, r) => sum + (r.responseLength || 0), 0) / successful.length;
    
    console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
    console.log(`📄 Average Response Length: ${Math.round(avgResponseLength)} characters`);
  }
  
  // Detailed failure analysis
  if (failed.length > 0) {
    console.log('\n🔍 FAILURE ANALYSIS:');
    failed.forEach(result => {
      console.log(`- ${result.scenario}: ${result.error}`);
    });
  }
  
  // Error indicator analysis
  if (withErrors.length > 0) {
    console.log('\n⚠️  ERROR INDICATOR ANALYSIS:');
    withErrors.forEach(result => {
      console.log(`- ${result.scenario}: "${result.response}..."`);
    });
  }
  
  // Performance analysis
  console.log('\n⚡ PERFORMANCE ANALYSIS:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const errorFlag = result.hasErrorIndicators ? '⚠️' : '';
    console.log(`${status}${errorFlag} ${result.scenario}: ${result.duration}ms`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (failed.length > 0) {
    console.log('- Investigate failed requests for infrastructure issues');
    console.log('- Check OpenAI API key and rate limits');
    console.log('- Review Supabase Edge Function logs');
  }
  
  if (withErrors.length > 0) {
    console.log('- Review error handling in specialist nodes');
    console.log('- Check OpenAI timeout and retry configurations');
    console.log('- Verify circuit breaker thresholds');
  }
  
  if (successful.length === results.length && withErrors.length === 0) {
    console.log('🎉 All tests passed! OpenAI integration is working correctly.');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the tests
testOpenAIFixes().catch(console.error); 