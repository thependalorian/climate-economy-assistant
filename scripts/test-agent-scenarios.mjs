#!/usr/bin/env node

/**
 * Comprehensive Agent System Testing Suite
 * Tests resume analysis, skills translation, recommendations, and knowledge base integration
 * 
 * Usage: npm run test-agents
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Test scenarios with different backgrounds
const TEST_SCENARIOS = [
  {
    id: 'traditional_engineer',
    name: 'Traditional Engineer → Clean Energy Transition',
    profile: {
      background: 'Mechanical Engineer with 8 years in automotive industry',
      skills: ['CAD Design', 'Project Management', 'Manufacturing', 'Quality Control', 'Team Leadership'],
      experience: 'Led engine design projects, managed cross-functional teams, optimized manufacturing processes',
      goals: 'Transition to renewable energy sector, specifically wind or solar'
    },
    resume_text: `
John Smith
Mechanical Engineer
john.smith@email.com | (555) 123-4567 | Boston, MA

EXPERIENCE
Senior Mechanical Engineer | Ford Motor Company | 2018-2024
• Led design and development of fuel-efficient engine components
• Managed cross-functional teams of 12 engineers and technicians
• Implemented lean manufacturing processes, reducing waste by 25%
• Collaborated with suppliers on sustainable material sourcing
• Mentored junior engineers on CAD design and project management

Mechanical Engineer | General Motors | 2016-2018
• Designed automotive components using SolidWorks and AutoCAD
• Conducted thermal analysis and stress testing
• Participated in product lifecycle management initiatives
• Supported manufacturing process optimization

EDUCATION
Bachelor of Science in Mechanical Engineering
University of Massachusetts Amherst | 2016
Relevant Coursework: Thermodynamics, Fluid Mechanics, Materials Science

SKILLS
• CAD Software: SolidWorks, AutoCAD, CATIA
• Project Management: Agile, Lean Manufacturing
• Technical: Thermal Analysis, Stress Testing, Quality Control
• Leadership: Team Management, Mentoring, Cross-functional Collaboration
    `,
    test_queries: [
      "How can I transition my automotive engineering experience to clean energy?",
      "What specific skills from my manufacturing background are valuable in solar energy?",
      "I want to work in wind energy - what training programs are available?",
      "How does my project management experience translate to renewable energy projects?"
    ]
  },
  
  {
    id: 'military_veteran',
    name: 'Military Veteran → Clean Energy Career',
    profile: {
      background: 'Navy veteran with electrical systems and leadership experience',
      skills: ['Electrical Systems', 'Leadership', 'Logistics', 'Safety Protocols', 'Training'],
      experience: 'Managed electrical systems on naval vessels, led teams of 20+ personnel',
      goals: 'Civilian career in electrical grid modernization or energy storage'
    },
    resume_text: `
Maria Rodriguez
Navy Veteran - Electrical Systems Specialist
maria.rodriguez@email.com | (555) 987-6543 | Springfield, MA

MILITARY EXPERIENCE
Petty Officer First Class | U.S. Navy | 2015-2023
• Maintained and repaired complex electrical systems on USS Enterprise
• Led team of 22 electricians and technicians in high-pressure environments
• Implemented safety protocols reducing electrical incidents by 40%
• Trained over 100 junior personnel on electrical systems and safety procedures
• Managed inventory and logistics for electrical components worth $2M+

Electronics Technician | U.S. Navy | 2015-2019
• Diagnosed and repaired radar, communication, and navigation systems
• Performed preventive maintenance on critical ship systems
• Collaborated with engineering teams on system upgrades
• Maintained detailed technical documentation and reports

EDUCATION
Associate Degree in Electronics Technology
Community College of the Air Force | 2018

CERTIFICATIONS
• Navy Electrical Safety Certification
• Leadership and Management Training
• Hazardous Materials Handling

SKILLS
• Electrical Systems: High-voltage, Low-voltage, Power Distribution
• Leadership: Team Management, Training, Safety Implementation
• Technical: Troubleshooting, Preventive Maintenance, System Integration
• Security Clearance: Secret (expired)
    `,
    test_queries: [
      "How does my Navy electrical experience translate to civilian clean energy jobs?",
      "What opportunities exist for veterans in Massachusetts clean energy sector?",
      "I have leadership experience - are there management roles in renewable energy?",
      "How can I use my electrical systems background in grid modernization?"
    ]
  },

  {
    id: 'international_professional',
    name: 'International Professional → US Clean Energy Market',
    profile: {
      background: 'Environmental engineer from India with renewable energy experience',
      skills: ['Environmental Engineering', 'Solar Design', 'Data Analysis', 'Research', 'Multilingual'],
      experience: 'Designed solar installations in India, conducted environmental impact assessments',
      goals: 'Establish career in US clean energy market, credential recognition'
    },
    resume_text: `
Priya Patel
Environmental Engineer
priya.patel@email.com | (555) 456-7890 | Cambridge, MA

INTERNATIONAL EXPERIENCE
Senior Environmental Engineer | Tata Power Solar | Mumbai, India | 2019-2024
• Designed utility-scale solar installations totaling 500MW capacity
• Conducted environmental impact assessments for renewable energy projects
• Led cross-cultural teams of engineers and environmental scientists
• Collaborated with government agencies on renewable energy policy
• Managed projects worth $50M+ from conception to commissioning

Environmental Consultant | Green Energy Solutions | Delhi, India | 2017-2019
• Performed environmental due diligence for wind and solar projects
• Developed sustainability reports for international clients
• Conducted air quality and water impact studies
• Presented findings to stakeholders in English and Hindi

EDUCATION
Master of Technology in Environmental Engineering
Indian Institute of Technology Delhi | 2017
Bachelor of Engineering in Civil Engineering
University of Mumbai | 2015

CERTIFICATIONS
• LEED Green Associate (India)
• Project Management Professional (PMP) - India Chapter
• Environmental Impact Assessment Certification

SKILLS
• Technical: Solar PV Design, Environmental Modeling, GIS, AutoCAD
• Languages: English (Fluent), Hindi (Native), Gujarati (Native)
• Software: MATLAB, Python, ArcGIS, PVsyst
• Project Management: Agile, Waterfall, Stakeholder Management
    `,
    test_queries: [
      "How can I get my Indian engineering credentials recognized in Massachusetts?",
      "What are the differences between Indian and US solar industry standards?",
      "I have international experience - how do I break into the US clean energy market?",
      "Are there programs to help international professionals transition to US clean energy jobs?"
    ]
  },

  {
    id: 'career_changer',
    name: 'Career Changer → Environmental Justice Focus',
    profile: {
      background: 'Former teacher interested in environmental justice and community organizing',
      skills: ['Education', 'Community Outreach', 'Public Speaking', 'Program Development', 'Bilingual'],
      experience: 'Taught in underserved communities, organized parent engagement programs',
      goals: 'Work in environmental justice, community clean energy programs'
    },
    resume_text: `
Carlos Mendoza
Community Educator & Organizer
carlos.mendoza@email.com | (555) 321-0987 | Lawrence, MA

EXPERIENCE
High School Science Teacher | Lawrence Public Schools | 2018-2024
• Taught environmental science to 150+ students in Title I school
• Developed hands-on curriculum connecting science to community issues
• Organized student-led environmental awareness campaigns
• Collaborated with parents and community leaders on education initiatives
• Increased student engagement in STEM by 35% through culturally relevant teaching

Community Outreach Coordinator | United Way of Merrimack Valley | 2016-2018
• Coordinated programs serving 500+ families in environmental justice communities
• Facilitated workshops on energy efficiency and cost savings
• Built partnerships with local organizations and government agencies
• Managed volunteer programs with 50+ community members
• Conducted outreach in English and Spanish

EDUCATION
Master of Education in Science Education
University of Massachusetts Lowell | 2018
Bachelor of Science in Environmental Science
Merrimack College | 2016

VOLUNTEER EXPERIENCE
• Environmental Justice Advocate | Neighbor to Neighbor | 2020-Present
• Community Garden Coordinator | Lawrence CommunityWorks | 2019-Present

SKILLS
• Education: Curriculum Development, Student Engagement, Assessment
• Community: Outreach, Organizing, Partnership Building, Grant Writing
• Languages: English (Native), Spanish (Fluent)
• Technical: Data Analysis, Presentation Software, Social Media
    `,
    test_queries: [
      "How can my teaching experience help me work in environmental justice?",
      "What clean energy programs focus on underserved communities in Massachusetts?",
      "I want to help communities access clean energy - what career paths exist?",
      "How can I combine my education background with environmental advocacy?"
    ]
  },

  {
    id: 'recent_graduate',
    name: 'Recent Graduate → Clean Energy Entry Level',
    profile: {
      background: 'Recent environmental studies graduate with internship experience',
      skills: ['Research', 'Data Analysis', 'Sustainability', 'Social Media', 'Writing'],
      experience: 'Internships at environmental nonprofits, sustainability research projects',
      goals: 'Entry-level position in clean energy policy or sustainability consulting'
    },
    resume_text: `
Sarah Chen
Environmental Studies Graduate
sarah.chen@email.com | (555) 654-3210 | Boston, MA

EDUCATION
Bachelor of Arts in Environmental Studies
Northeastern University | 2024
GPA: 3.7/4.0
Relevant Coursework: Environmental Policy, Climate Change Science, Sustainable Energy Systems
Senior Thesis: "Community Solar Programs in Massachusetts: Barriers and Opportunities"

EXPERIENCE
Sustainability Intern | Boston Green Ribbon Commission | Summer 2023
• Researched best practices for municipal clean energy procurement
• Analyzed data on building energy efficiency programs
• Assisted with stakeholder engagement for climate action planning
• Created social media content reaching 5,000+ followers

Research Assistant | Northeastern University | 2022-2024
• Conducted literature review on renewable energy policy effectiveness
• Collected and analyzed survey data from 200+ Massachusetts residents
• Co-authored research paper on community attitudes toward clean energy
• Presented findings at undergraduate research symposium

Environmental Education Intern | Mass Audubon | Summer 2022
• Developed educational materials on climate change for K-12 students
• Led nature walks and environmental education programs
• Assisted with habitat restoration projects
• Engaged with diverse community groups on environmental issues

SKILLS
• Research: Literature Review, Data Collection, Statistical Analysis
• Technical: Excel, SPSS, GIS, Adobe Creative Suite
• Communication: Writing, Public Speaking, Social Media Management
• Languages: English (Native), Mandarin (Conversational)

PROJECTS
• Community Solar Analysis: Mapped potential sites for solar installations in environmental justice communities
• Campus Sustainability Audit: Led team assessing Northeastern's carbon footprint
    `,
    test_queries: [
      "What entry-level opportunities exist in Massachusetts clean energy sector?",
      "How can I leverage my research skills for a career in clean energy policy?",
      "I'm a recent graduate - what skills should I develop for clean energy jobs?",
      "Are there fellowship or training programs for new clean energy professionals?"
    ]
  }
];

// Test functions
async function testResumeAnalysis(scenario) {
  console.log(`\n🔍 Testing Resume Analysis: ${scenario.name}`);
  console.log('=' .repeat(60));

  try {
    // Call the LangGraph resume processing function
    const { data, error } = await supabase.functions.invoke('langgraph-process-resume', {
      body: {
        userId: `test-${scenario.id}`,
        resumeText: scenario.resume_text
      }
    });

    if (error) {
      console.error('❌ Resume analysis failed:', error);
      return null;
    }

    console.log('✅ Resume Analysis Results:');
    console.log(`📊 Climate Relevance Score: ${data.climate_analysis?.overall_score || 'N/A'}/100`);
    console.log(`🎯 Strengths: ${data.climate_analysis?.strengths?.join(', ') || 'None identified'}`);
    console.log(`📈 Growth Areas: ${data.climate_analysis?.gaps?.join(', ') || 'None identified'}`);
    console.log(`🏢 Partner Matches: ${data.partner_matches?.length || 0} found`);
    
    if (data.partner_matches?.length > 0) {
      console.log('\n🤝 Top Partner Matches:');
      data.partner_matches.slice(0, 3).forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.partner_name} (${match.relevance_score}% match)`);
        console.log(`     Type: ${match.match_type} | Reason: ${match.reasoning}`);
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Resume analysis error:', error);
    return null;
  }
}

async function testAgentConversation(scenario, resumeData) {
  console.log(`\n💬 Testing Agent Conversations: ${scenario.name}`);
  console.log('=' .repeat(60));

  const conversationId = `test-conv-${scenario.id}-${Date.now()}`;
  const userId = `test-${scenario.id}`;

  for (const [index, query] of scenario.test_queries.entries()) {
    console.log(`\n📝 Query ${index + 1}: "${query}"`);
    console.log('-'.repeat(40));

    try {
      // Simulate conversation history
      const messages = [
        { role: 'user', content: query }
      ];

      // Call the LangGraph agent response function
      const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
        body: {
          message: query,
          userId: userId,
          threadId: conversationId
        }
      });

      if (error) {
        console.error('❌ Agent response failed:', error);
        continue;
      }

      console.log(`🤖 Agent: ${data.agent_name || 'Unknown'}`);
      console.log(`💡 Response: ${data.response?.substring(0, 200)}...`);
      
      // Analyze response quality
      const response = data.response || '';
      const hasPartnerMentions = /Franklin Cummings|TPS Energy|Urban League|Headlamp|African Bridge|MassHire|MassCEC|ACT/i.test(response);
      const hasSkillTranslation = /experience|skills|background|transition/i.test(response);
      const hasActionableSteps = /step|action|recommend|program|training/i.test(response);

      console.log(`✅ Quality Metrics:`);
      console.log(`   Partner Mentions: ${hasPartnerMentions ? '✓' : '✗'}`);
      console.log(`   Skills Translation: ${hasSkillTranslation ? '✓' : '✗'}`);
      console.log(`   Actionable Steps: ${hasActionableSteps ? '✓' : '✗'}`);

    } catch (error) {
      console.error('❌ Agent conversation error:', error);
    }

    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testSkillsTranslation(scenario) {
  console.log(`\n🔄 Testing Skills Translation: ${scenario.name}`);
  console.log('=' .repeat(60));

  const skillsToTest = scenario.profile.skills;
  
  for (const skill of skillsToTest) {
    console.log(`\n🛠️  Translating: "${skill}"`);
    
    const query = `How does my ${skill} experience translate to clean energy careers?`;
    
    try {
      const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
        body: {
          message: query,
          userId: `test-${scenario.id}`,
          threadId: `skills-test-${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ Skills translation failed:', error);
        continue;
      }

      const response = data.response || '';
      const hasSpecificTranslation = response.toLowerCase().includes(skill.toLowerCase());
      const hasCleanEnergyContext = /solar|wind|energy|renewable|clean|green|climate/i.test(response);
      const hasPartnerPrograms = /training|program|certification|course/i.test(response);

      console.log(`   Translation Quality:`);
      console.log(`   Specific to Skill: ${hasSpecificTranslation ? '✓' : '✗'}`);
      console.log(`   Clean Energy Context: ${hasCleanEnergyContext ? '✓' : '✗'}`);
      console.log(`   Training Programs: ${hasPartnerPrograms ? '✓' : '✗'}`);

    } catch (error) {
      console.error('❌ Skills translation error:', error);
    }
  }
}

async function testKnowledgeBaseIntegration() {
  console.log(`\n📚 Testing Knowledge Base Integration`);
  console.log('=' .repeat(60));

  const knowledgeQueries = [
    "What are the latest Massachusetts clean energy incentives?",
    "Tell me about MassCEC's workforce development programs",
    "What training programs are available for solar installation?",
    "How do I get certified for wind energy maintenance?",
    "What are the job prospects in energy storage in Massachusetts?"
  ];

  for (const query of knowledgeQueries) {
    console.log(`\n❓ Knowledge Query: "${query}"`);
    
    try {
      const { data, error } = await supabase.functions.invoke('langgraph-agent-response', {
        body: {
          message: query,
          userId: 'test-knowledge',
          threadId: `knowledge-test-${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ Knowledge base query failed:', error);
        continue;
      }

      const response = data.response || '';
      const hasSpecificInfo = response.length > 100;
      const hasMassachusettsContext = /massachusetts|ma\b|boston|cambridge/i.test(response);
      const hasPartnerInfo = /Franklin Cummings|TPS Energy|Urban League|Headlamp|African Bridge|MassHire|MassCEC|ACT/i.test(response);

      console.log(`   Knowledge Quality:`);
      console.log(`   Detailed Response: ${hasSpecificInfo ? '✓' : '✗'}`);
      console.log(`   Massachusetts Context: ${hasMassachusettsContext ? '✓' : '✗'}`);
      console.log(`   Partner Information: ${hasPartnerInfo ? '✓' : '✗'}`);

    } catch (error) {
      console.error('❌ Knowledge base error:', error);
    }
  }
}

async function generateTestReport(results) {
  console.log(`\n📊 COMPREHENSIVE TEST REPORT`);
  console.log('=' .repeat(80));
  
  const timestamp = new Date().toISOString();
  const reportPath = `test-reports/agent-test-report-${timestamp.split('T')[0]}.md`;
  
  // Ensure reports directory exists
  if (!fs.existsSync('test-reports')) {
    fs.mkdirSync('test-reports', { recursive: true });
  }

  let report = `# Agent System Test Report\n\n`;
  report += `**Date:** ${timestamp}\n`;
  report += `**Test Scenarios:** ${TEST_SCENARIOS.length}\n\n`;

  report += `## Test Summary\n\n`;
  report += `| Scenario | Resume Analysis | Agent Responses | Skills Translation | Overall |\n`;
  report += `|----------|----------------|-----------------|-------------------|----------|\n`;

  for (const result of results) {
    const resumeStatus = result.resumeAnalysis ? '✅' : '❌';
    const agentStatus = result.agentConversation ? '✅' : '❌';
    const skillsStatus = result.skillsTranslation ? '✅' : '❌';
    const overall = (result.resumeAnalysis && result.agentConversation && result.skillsTranslation) ? '✅' : '⚠️';
    
    report += `| ${result.scenario.name} | ${resumeStatus} | ${agentStatus} | ${skillsStatus} | ${overall} |\n`;
  }

  report += `\n## Detailed Results\n\n`;
  
  for (const result of results) {
    report += `### ${result.scenario.name}\n\n`;
    report += `**Background:** ${result.scenario.profile.background}\n\n`;
    
    if (result.resumeAnalysis) {
      report += `**Resume Analysis:**\n`;
      report += `- Climate Score: ${result.resumeAnalysis.climate_analysis?.overall_score || 'N/A'}/100\n`;
      report += `- Partner Matches: ${result.resumeAnalysis.partner_matches?.length || 0}\n`;
    }
    
    report += `\n`;
  }

  fs.writeFileSync(reportPath, report);
  console.log(`📄 Test report saved to: ${reportPath}`);
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Agent System Tests');
  console.log('=' .repeat(80));

  const results = [];

  // Test each scenario
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n🎯 Testing Scenario: ${scenario.name}`);
    
    const result = {
      scenario,
      resumeAnalysis: null,
      agentConversation: false,
      skillsTranslation: false
    };

    // 1. Test resume analysis
    result.resumeAnalysis = await testResumeAnalysis(scenario);
    
    // 2. Test agent conversations
    try {
      await testAgentConversation(scenario, result.resumeAnalysis);
      result.agentConversation = true;
    } catch (error) {
      console.error('Agent conversation test failed:', error);
    }

    // 3. Test skills translation
    try {
      await testSkillsTranslation(scenario);
      result.skillsTranslation = true;
    } catch (error) {
      console.error('Skills translation test failed:', error);
    }

    results.push(result);
    
    // Delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 4. Test knowledge base integration
  await testKnowledgeBaseIntegration();

  // 5. Generate comprehensive report
  await generateTestReport(results);

  console.log('\n✅ All tests completed!');
  console.log('Check the test-reports directory for detailed results.');
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}

export { runComprehensiveTests, TEST_SCENARIOS }; 