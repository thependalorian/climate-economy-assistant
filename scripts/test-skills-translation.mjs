#!/usr/bin/env node

/**
 * Skills Translation Test
 * Tests the skills translation functionality specifically
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

async function testSkillsTranslation() {
  console.log('🔍 Testing Skills Translation Functionality');
  console.log('=' .repeat(60));

  const skillsQueries = [
    {
      name: 'Software Engineering Transition',
      message: 'I have 10 years of software engineering experience. How can I transition my skills to clean energy careers?',
      userId: 'test-skills-001'
    },
    {
      name: 'Military Experience Translation',
      message: 'I am a military veteran with logistics and project management experience. What clean energy opportunities are available?',
      userId: 'test-veteran-001'
    },
    {
      name: 'General Career Query (No Skills Translation)',
      message: 'What clean energy jobs are available in Massachusetts?',
      userId: 'test-general-001'
    }
  ];

  for (const query of skillsQueries) {
    console.log(`\n📞 Testing: ${query.name}`);
    console.log('-'.repeat(40));
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
        body: {
          message: query.message,
          userId: query.userId,
          threadId: `thread-${query.userId}`
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Details: ${JSON.stringify(error, null, 2)}`);
      } else {
        console.log(`✅ Success (${duration}ms)`);
        console.log(`   Agent: ${data.agent || 'unknown'}`);
        console.log(`   Response Length: ${data.response?.length || 0} chars`);
        
        // Check for skills translation indicators
        const responseStr = data.response?.toLowerCase() || '';
        const hasSkillsTranslation = responseStr.includes('translate') || responseStr.includes('transferable') || responseStr.includes('experience');
        const hasPartnerMentions = responseStr.includes('franklin') || responseStr.includes('tps') || responseStr.includes('urban league');
        const hasSpecificAdvice = responseStr.includes('recommend') || responseStr.includes('suggest') || responseStr.includes('consider');
        
        console.log(`   Quality Indicators:`);
        console.log(`     - Skills translation: ${hasSkillsTranslation ? '✅' : '❌'}`);
        console.log(`     - Partner mentions: ${hasPartnerMentions ? '✅' : '❌'}`);
        console.log(`     - Specific advice: ${hasSpecificAdvice ? '✅' : '❌'}`);
        
        // Show preview of response
        if (data.response) {
          console.log(`   Preview: ${data.response.substring(0, 200)}...`);
        }
        
        // Check recommendations
        if (data.recommendations && data.recommendations.length > 0) {
          console.log(`   Recommendations: ${data.recommendations.length} provided`);
          data.recommendations.forEach((rec, index) => {
            console.log(`     ${index + 1}. ${rec.partner_name} (${rec.opportunity_type}) - ${rec.relevance_score}`);
          });
        }
      }
      
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🔍 Skills Translation Test Complete');
}

// Run the test
testSkillsTranslation().catch(console.error); 