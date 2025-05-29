#!/usr/bin/env node

/**
 * Comprehensive Agent Test
 * Tests all agent functions with detailed error reporting and debugging
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

async function testComprehensiveAgent() {
  console.log('🔍 Comprehensive Agent Function Test');
  console.log('=' .repeat(60));

  const testCases = [
    {
      name: 'Career Transition Query',
      payload: {
        message: 'I am a military veteran looking to transition to renewable energy careers. What opportunities are available?',
        userId: 'test-veteran-001',
        threadId: 'thread-veteran-001'
      }
    },
    {
      name: 'Skills Assessment Query',
      payload: {
        message: 'I have experience in project management and want to know how my skills translate to climate jobs.',
        userId: 'test-pm-001',
        threadId: 'thread-pm-001'
      }
    },
    {
      name: 'Training Program Query',
      payload: {
        message: 'What training programs are available for solar panel installation in Massachusetts?',
        userId: 'test-training-001',
        threadId: 'thread-training-001'
      }
    },
    {
      name: 'Environmental Justice Query',
      payload: {
        message: 'How can I get involved in environmental justice work in underserved communities?',
        userId: 'test-ej-001',
        threadId: 'thread-ej-001'
      }
    },
    {
      name: 'International Experience Query',
      payload: {
        message: 'I have international development experience. How can I apply this to climate work?',
        userId: 'test-intl-001',
        threadId: 'thread-intl-001'
      }
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const testCase of testCases) {
    console.log(`\n📞 Testing: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
        body: testCase.payload
      });
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Details: ${JSON.stringify(error, null, 2)}`);
        errorCount++;
      } else {
        console.log(`✅ Success (${duration}ms)`);
        console.log(`   Response Type: ${typeof data}`);
        console.log(`   Response Length: ${JSON.stringify(data).length} chars`);
        
        if (typeof data === 'string') {
          console.log(`   Preview: ${data.substring(0, 150)}...`);
        } else if (data && typeof data === 'object') {
          console.log(`   Response Keys: ${Object.keys(data).join(', ')}`);
          if (data.response) {
            console.log(`   Agent Response: ${data.response.substring(0, 150)}...`);
          }
        }
        
        // Check if response contains expected elements
        const responseStr = JSON.stringify(data).toLowerCase();
        const hasPartnerMention = responseStr.includes('partner') || responseStr.includes('organization');
        const hasActionableAdvice = responseStr.includes('recommend') || responseStr.includes('suggest') || responseStr.includes('consider');
        const hasSpecificInfo = responseStr.includes('massachusetts') || responseStr.includes('training') || responseStr.includes('program');
        
        console.log(`   Quality Indicators:`);
        console.log(`     - Partner mentions: ${hasPartnerMention ? '✅' : '❌'}`);
        console.log(`     - Actionable advice: ${hasActionableAdvice ? '✅' : '❌'}`);
        console.log(`     - Specific info: ${hasSpecificInfo ? '✅' : '❌'}`);
        
        successCount++;
      }
      
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      console.log(`   Stack: ${err.stack}`);
      errorCount++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Successful: ${successCount}/${testCases.length}`);
  console.log(`   ❌ Failed: ${errorCount}/${testCases.length}`);
  console.log(`   📈 Success Rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);

  if (successCount > 0) {
    console.log('\n🎉 Functions are working! Now testing resume processing...');
    await testResumeProcessing();
  }
}

async function testResumeProcessing() {
  console.log('\n🔍 Testing Resume Processing Function');
  console.log('=' .repeat(50));

  const resumeTestPayload = {
    userId: 'test-resume-001',
    resumeText: `John Smith
Software Engineer
5 years experience in web development, project management, and team leadership.
Skills: JavaScript, Python, React, Node.js, AWS, Docker
Experience:
- Led development team of 5 engineers
- Managed cloud infrastructure and deployment pipelines
- Implemented sustainable coding practices
Education: BS Computer Science, MIT 2018`,
    preferences: {
      location: 'Massachusetts',
      interests: ['renewable energy', 'sustainability'],
      experience_level: 'mid-level'
    }
  };

  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('langgraph-process-resume', {
      body: resumeTestPayload
    });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log(`❌ Resume Processing Error: ${error.message}`);
      console.log(`   Details: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`✅ Resume Processing Success (${duration}ms)`);
      console.log(`   Response Type: ${typeof data}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
    
  } catch (err) {
    console.log(`❌ Resume Processing Exception: ${err.message}`);
  }
}

// Run the comprehensive test
testComprehensiveAgent().catch(console.error); 