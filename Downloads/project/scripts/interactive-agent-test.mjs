#!/usr/bin/env node

/**
 * Interactive Agent Testing Tool
 * Allows manual testing of specific scenarios and real-time agent responses
 * 
 * Usage: npm run test-agents-interactive
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import readline from 'readline';

// Load environment variables
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Sample resume texts for quick testing
const SAMPLE_RESUMES = {
  engineer: `
John Smith - Mechanical Engineer
john.smith@email.com | Boston, MA

EXPERIENCE
Senior Mechanical Engineer | Ford Motor Company | 2018-2024
• Led design of fuel-efficient engine components
• Managed teams of 12 engineers
• Implemented lean manufacturing processes
• Collaborated on sustainable material sourcing

SKILLS
• CAD Software: SolidWorks, AutoCAD
• Project Management: Agile, Lean
• Technical: Thermal Analysis, Quality Control
  `,
  
  veteran: `
Maria Rodriguez - Navy Veteran
maria.rodriguez@email.com | Springfield, MA

MILITARY EXPERIENCE
Petty Officer First Class | U.S. Navy | 2015-2023
• Maintained complex electrical systems on naval vessels
• Led team of 22 electricians and technicians
• Implemented safety protocols reducing incidents by 40%
• Trained 100+ junior personnel

SKILLS
• Electrical Systems: High-voltage, Power Distribution
• Leadership: Team Management, Safety Implementation
• Technical: Troubleshooting, System Integration
  `,
  
  international: `
Priya Patel - Environmental Engineer
priya.patel@email.com | Cambridge, MA

INTERNATIONAL EXPERIENCE
Senior Environmental Engineer | Tata Power Solar | Mumbai, India | 2019-2024
• Designed utility-scale solar installations (500MW capacity)
• Conducted environmental impact assessments
• Led cross-cultural engineering teams
• Managed $50M+ projects

SKILLS
• Technical: Solar PV Design, Environmental Modeling
• Languages: English, Hindi, Gujarati
• Software: MATLAB, Python, PVsyst
  `,
  
  teacher: `
Carlos Mendoza - Community Educator
carlos.mendoza@email.com | Lawrence, MA

EXPERIENCE
High School Science Teacher | Lawrence Public Schools | 2018-2024
• Taught environmental science to 150+ students
• Developed curriculum connecting science to community issues
• Organized environmental awareness campaigns
• Increased STEM engagement by 35%

Community Outreach Coordinator | United Way | 2016-2018
• Coordinated programs for 500+ families
• Facilitated energy efficiency workshops
• Built community partnerships

SKILLS
• Education: Curriculum Development, Student Engagement
• Community: Outreach, Organizing, Grant Writing
• Languages: English, Spanish
  `
};

// Test user profiles
const TEST_PROFILES = {
  engineer: {
    background: 'Mechanical Engineer with 8 years in automotive industry',
    skills: ['CAD Design', 'Project Management', 'Manufacturing', 'Quality Control'],
    goals: 'Transition to renewable energy sector'
  },
  veteran: {
    background: 'Navy veteran with electrical systems and leadership experience',
    skills: ['Electrical Systems', 'Leadership', 'Safety Protocols', 'Training'],
    goals: 'Civilian career in electrical grid modernization'
  },
  international: {
    background: 'Environmental engineer from India with renewable energy experience',
    skills: ['Environmental Engineering', 'Solar Design', 'Data Analysis'],
    goals: 'Establish career in US clean energy market'
  },
  teacher: {
    background: 'Former teacher interested in environmental justice',
    skills: ['Education', 'Community Outreach', 'Public Speaking', 'Bilingual'],
    goals: 'Work in environmental justice and community clean energy'
  }
};

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testResumeAnalysis(resumeText, profileType) {
  console.log('\n🔍 Testing Resume Analysis...');
  console.log('=' .repeat(50));

  try {
    const { data, error } = await supabase.functions.invoke('langgraph-process-resume', {
      body: {
        user_id: `interactive-test-${profileType}-${Date.now()}`,
        resume_text: resumeText
      }
    });

    if (error) {
      console.error('❌ Resume analysis failed:', error);
      return null;
    }

    console.log('✅ Resume Analysis Results:');
    console.log(`📊 Climate Relevance Score: ${data.climate_analysis?.overall_score || 'N/A'}/100`);
    console.log(`🎯 Strengths: ${data.climate_analysis?.strengths?.join(', ') || 'None'}`);
    console.log(`📈 Growth Areas: ${data.climate_analysis?.gaps?.join(', ') || 'None'}`);
    console.log(`🏢 Partner Matches: ${data.partner_matches?.length || 0} found`);

    if (data.partner_matches?.length > 0) {
      console.log('\n🤝 Partner Matches:');
      data.partner_matches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.partner_name} (${match.relevance_score}% match)`);
        console.log(`     Type: ${match.match_type}`);
        console.log(`     Reason: ${match.reasoning}`);
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Resume analysis error:', error);
    return null;
  }
}

async function testAgentResponse(userMessage, profileType, resumeData = null) {
  console.log('\n💬 Testing Agent Response...');
  console.log('=' .repeat(50));
  console.log(`📝 Query: "${userMessage}"`);

  try {
    const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
      body: {
        user_id: `interactive-test-${profileType}`,
        conversation_id: `interactive-conv-${Date.now()}`,
        messages: [{ role: 'user', content: userMessage }],
        user_message: userMessage,
        user_context: {
          profile: TEST_PROFILES[profileType],
          resume_analysis: resumeData
        }
      }
    });

    if (error) {
      console.error('❌ Agent response failed:', error);
      return;
    }

    console.log(`\n🤖 Agent: ${data.agent_name || 'Unknown'}`);
    console.log(`💡 Response:`);
    console.log(data.response || 'No response generated');

    // Quality analysis
    const response = data.response || '';
    const hasPartnerMentions = /Franklin Cummings|TPS Energy|Urban League|Headlamp|African Bridge|MassHire|MassCEC|ACT/i.test(response);
    const hasSkillTranslation = /experience|skills|background|transition/i.test(response);
    const hasActionableSteps = /step|action|recommend|program|training/i.test(response);

    console.log(`\n✅ Quality Analysis:`);
    console.log(`   Partner Mentions: ${hasPartnerMentions ? '✓' : '✗'}`);
    console.log(`   Skills Translation: ${hasSkillTranslation ? '✓' : '✗'}`);
    console.log(`   Actionable Steps: ${hasActionableSteps ? '✓' : '✗'}`);

  } catch (error) {
    console.error('❌ Agent response error:', error);
  }
}

async function runInteractiveTest() {
  console.log('🚀 Interactive Agent Testing Tool');
  console.log('=' .repeat(60));
  console.log('Test the resume analysis and agent system with various scenarios');
  console.log('Available profiles: engineer, veteran, international, teacher');
  console.log('Type "quit" to exit\n');

  while (true) {
    try {
      const choice = await question('\n🎯 Choose test type:\n1. Resume Analysis\n2. Agent Conversation\n3. Skills Translation\n4. Custom Query\n5. Quit\n\nEnter choice (1-5): ');

      if (choice === '5' || choice.toLowerCase() === 'quit') {
        console.log('\n👋 Goodbye!');
        break;
      }

      const profileType = await question('\n👤 Choose profile type (engineer/veteran/international/teacher): ');
      
      if (!TEST_PROFILES[profileType]) {
        console.log('❌ Invalid profile type. Please choose: engineer, veteran, international, or teacher');
        continue;
      }

      switch (choice) {
        case '1':
          // Resume Analysis
          console.log('\n📄 Using sample resume for', profileType);
          const resumeData = await testResumeAnalysis(SAMPLE_RESUMES[profileType], profileType);
          
          const continueWithAgent = await question('\n🤔 Test agent conversation with this resume? (y/n): ');
          if (continueWithAgent.toLowerCase() === 'y') {
            const query = await question('💬 Enter your question: ');
            await testAgentResponse(query, profileType, resumeData);
          }
          break;

        case '2':
          // Agent Conversation
          const agentQuery = await question('\n💬 Enter your question for the agent: ');
          await testAgentResponse(agentQuery, profileType);
          break;

        case '3':
          // Skills Translation
          const skills = TEST_PROFILES[profileType].skills;
          console.log(`\n🛠️  Available skills for ${profileType}:`, skills.join(', '));
          const skillChoice = await question('Choose a skill to translate: ');
          const skillQuery = `How does my ${skillChoice} experience translate to clean energy careers?`;
          await testAgentResponse(skillQuery, profileType);
          break;

        case '4':
          // Custom Query
          const customQuery = await question('\n💭 Enter your custom query: ');
          await testAgentResponse(customQuery, profileType);
          break;

        default:
          console.log('❌ Invalid choice. Please enter 1-5.');
      }

      const continueTest = await question('\n🔄 Continue testing? (y/n): ');
      if (continueTest.toLowerCase() !== 'y') {
        console.log('\n👋 Thanks for testing!');
        break;
      }

    } catch (error) {
      console.error('❌ Error in interactive test:', error);
    }
  }

  rl.close();
}

// Predefined test scenarios for quick testing
async function runQuickTests() {
  console.log('⚡ Running Quick Test Scenarios');
  console.log('=' .repeat(60));

  const scenarios = [
    {
      profile: 'engineer',
      query: 'How can I transition my automotive engineering experience to clean energy?'
    },
    {
      profile: 'veteran',
      query: 'What opportunities exist for veterans in Massachusetts clean energy sector?'
    },
    {
      profile: 'international',
      query: 'How can I get my Indian engineering credentials recognized in Massachusetts?'
    },
    {
      profile: 'teacher',
      query: 'How can my teaching experience help me work in environmental justice?'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🎯 Testing: ${scenario.profile.toUpperCase()} Profile`);
    await testAgentResponse(scenario.query, scenario.profile);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Quick tests completed!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    await runQuickTests();
  } else {
    await runInteractiveTest();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runInteractiveTest, runQuickTests }; 