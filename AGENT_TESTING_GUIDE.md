# Agent System Testing Guide

This guide provides comprehensive testing tools for the Climate Economy Assistant (CEA) agent system, including resume analysis, skills translation, and agent conversations.

## 🚀 Quick Start

### Available Test Commands

```bash
# Comprehensive automated testing (all scenarios)
npm run test-agents

# Interactive testing tool (manual testing)
npm run test-agents-interactive

# Quick predefined scenarios
npm run test-agents-quick
```

## 📋 Test Scenarios

The testing suite includes 5 comprehensive scenarios covering different user backgrounds:

### 1. Traditional Engineer → Clean Energy Transition
- **Background**: Mechanical Engineer with 8 years in automotive industry
- **Skills**: CAD Design, Project Management, Manufacturing, Quality Control
- **Goal**: Transition to renewable energy sector (wind/solar)
- **Tests**: Skills translation from automotive to clean energy

### 2. Military Veteran → Clean Energy Career
- **Background**: Navy veteran with electrical systems and leadership experience
- **Skills**: Electrical Systems, Leadership, Safety Protocols, Training
- **Goal**: Civilian career in electrical grid modernization
- **Tests**: Military-to-civilian skill translation

### 3. International Professional → US Clean Energy Market
- **Background**: Environmental engineer from India with renewable energy experience
- **Skills**: Environmental Engineering, Solar Design, Data Analysis
- **Goal**: Establish career in US clean energy market
- **Tests**: International credential recognition and market entry

### 4. Career Changer → Environmental Justice Focus
- **Background**: Former teacher interested in environmental justice
- **Skills**: Education, Community Outreach, Public Speaking, Bilingual
- **Goal**: Work in environmental justice and community clean energy
- **Tests**: Non-technical to technical career transition

### 5. Recent Graduate → Clean Energy Entry Level
- **Background**: Environmental studies graduate with internship experience
- **Skills**: Research, Data Analysis, Sustainability, Writing
- **Goal**: Entry-level position in clean energy policy
- **Tests**: Entry-level career guidance and skill development

## 🔍 Testing Components

### Resume Analysis Testing
Tests the LangGraph-based resume processing system:

- **Climate Relevance Scoring**: 0-100 scale assessment
- **Skills Extraction**: Identification and categorization of skills
- **Experience Translation**: Converting background to clean energy context
- **Partner Matching**: Connecting profiles to partner organizations
- **Gap Analysis**: Identifying areas for improvement

### Agent Conversation Testing
Tests the multi-agent system responses:

- **Agent Routing**: Supervisor analysis and specialist delegation
- **Response Quality**: Partner mentions, actionable steps, skill translation
- **Context Awareness**: User profile integration and memory management
- **Specialist Expertise**: Career, Veterans, International, EJ specialists

### Skills Translation Testing
Tests the ability to translate skills across industries:

- **Technical Skills**: Engineering, programming, analysis
- **Soft Skills**: Leadership, communication, project management
- **Industry-Specific**: Military, education, international experience
- **Clean Energy Context**: Renewable energy applications

### Knowledge Base Integration
Tests the system's ability to draw from knowledge resources:

- **Massachusetts Programs**: MassCEC, MassHire, ACT initiatives
- **Partner Information**: Training programs, job opportunities
- **Current Information**: Latest policies and incentives
- **Contextual Relevance**: Location and user-specific recommendations

## 🛠️ Interactive Testing Tool

### Usage
```bash
npm run test-agents-interactive
```

### Features
- **Menu-Driven Interface**: Easy navigation through test options
- **Real-Time Testing**: Immediate agent responses
- **Quality Analysis**: Automatic response quality assessment
- **Multiple Profiles**: Switch between different user types
- **Custom Queries**: Test with your own questions

### Test Types
1. **Resume Analysis**: Upload and analyze sample resumes
2. **Agent Conversation**: Direct chat with agents
3. **Skills Translation**: Test specific skill translations
4. **Custom Query**: Free-form testing
5. **Quit**: Exit the tool

### Sample Interactions

#### Skills Translation Example
```
🛠️ Translating: "Project Management"
Query: "How does my Project Management experience translate to clean energy careers?"

🤖 Agent: career_specialist
💡 Response: Your project management experience is highly valuable in clean energy...

✅ Quality Analysis:
   Partner Mentions: ✓
   Skills Translation: ✓
   Actionable Steps: ✓
```

#### Resume Analysis Example
```
🔍 Testing Resume Analysis: Traditional Engineer

✅ Resume Analysis Results:
📊 Climate Relevance Score: 75/100
🎯 Strengths: Technical expertise, Project management, Manufacturing experience
📈 Growth Areas: Renewable energy knowledge, Clean energy certifications
🏢 Partner Matches: 3 found

🤝 Top Partner Matches:
  1. Franklin Cummings Tech (85% match)
     Type: training | Reason: Technical background aligns with clean energy programs
```

## 📊 Automated Testing Suite

### Usage
```bash
npm run test-agents
```

### Features
- **Comprehensive Coverage**: All 5 scenarios tested automatically
- **Resume Processing**: Full LangGraph resume analysis
- **Agent Conversations**: Multiple queries per scenario
- **Skills Translation**: Individual skill testing
- **Knowledge Base**: General knowledge queries
- **Test Reports**: Detailed markdown reports generated

### Report Generation
Test reports are automatically generated in `test-reports/` directory:

```
test-reports/
├── agent-test-report-2024-01-15.md
└── ...
```

### Report Contents
- **Test Summary**: Pass/fail status for each scenario
- **Detailed Results**: Climate scores, partner matches, response quality
- **Quality Metrics**: Partner mentions, skills translation, actionable steps
- **Recommendations**: Areas for improvement

## 🎯 Quick Testing

### Usage
```bash
npm run test-agents-quick
```

### Features
- **Predefined Scenarios**: 4 key test cases
- **Fast Execution**: Quick validation of core functionality
- **Quality Assessment**: Automatic response analysis
- **No Interaction Required**: Fully automated

### Test Cases
1. Engineer transition query
2. Veteran opportunities query
3. International credential recognition
4. Teacher environmental justice transition

## 📈 Quality Metrics

### Resume Analysis Quality
- **Climate Relevance Score**: 0-100 assessment accuracy
- **Skills Extraction**: Completeness and accuracy
- **Partner Matching**: Relevance and quantity
- **Gap Analysis**: Actionable recommendations

### Agent Response Quality
- **Partner Mentions**: References to verified partners only
- **Skills Translation**: Specific experience-to-clean-energy mapping
- **Actionable Steps**: Concrete next steps and recommendations
- **Context Awareness**: User profile and background integration

### System Performance
- **Response Time**: Agent response latency
- **Error Handling**: Graceful failure management
- **Consistency**: Repeatable results across tests
- **Scalability**: Performance under load

## 🔧 Troubleshooting

### Common Issues

#### Resume Analysis Fails
```bash
❌ Resume analysis failed: Function not found
```
**Solution**: Ensure Supabase Edge Functions are deployed
```bash
supabase functions deploy langgraph-process-resume
```

#### Agent Response Timeout
```bash
❌ Agent response failed: Timeout
```
**Solution**: Check OpenAI API key and rate limits

#### Missing Partner Data
```bash
✅ Quality Analysis:
   Partner Mentions: ✗
```
**Solution**: Verify partner data in Supabase database

### Environment Setup
Ensure these environment variables are set:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### Database Requirements
- Partner organizations table populated
- Job opportunities and training programs available
- User profiles and skills tables accessible

## 📝 Test Development

### Adding New Scenarios
1. **Define Profile**: Add to `TEST_SCENARIOS` in test scripts
2. **Create Resume**: Add sample resume text
3. **Define Queries**: Add relevant test questions
4. **Update Documentation**: Add scenario description

### Custom Test Queries
Examples of effective test queries:

#### Skills Translation
- "How does my [SKILL] experience translate to clean energy careers?"
- "What clean energy roles use my [SKILL] background?"
- "I have [SKILL] experience - what training do I need for clean energy?"

#### Career Guidance
- "I want to work in [CLEAN ENERGY AREA] - what's my pathway?"
- "What opportunities exist for [BACKGROUND] in Massachusetts clean energy?"
- "How can I transition from [INDUSTRY] to clean energy?"

#### Partner Information
- "What training programs are available for [SKILL AREA]?"
- "Which organizations help with [SPECIFIC NEED]?"
- "I need help with [CHALLENGE] - who can assist?"

## 🎯 Best Practices

### Testing Strategy
1. **Start with Quick Tests**: Validate basic functionality
2. **Use Interactive Tool**: Deep dive into specific scenarios
3. **Run Comprehensive Suite**: Full system validation
4. **Review Reports**: Analyze quality metrics and trends

### Quality Assurance
- **Partner-Only Policy**: Ensure only verified partners mentioned
- **Skills Translation**: Verify specific experience mapping
- **Actionable Guidance**: Check for concrete next steps
- **Massachusetts Focus**: Confirm local context and relevance

### Continuous Testing
- **Regular Validation**: Run tests after system changes
- **Scenario Updates**: Keep test cases current with market changes
- **Performance Monitoring**: Track response times and quality
- **User Feedback Integration**: Update tests based on real user needs

## 📚 Additional Resources

- **Agent System Documentation**: `LANGGRAPH_INTEGRATION_COMPLETE.md`
- **Prompt Engineering Guide**: `ENHANCED_PROMPT_ENGINEERING_IMPLEMENTATION.md`
- **Skills Translation Guide**: `DUCKDUCKGO_SEARCH_INTEGRATION.md`
- **Database Schema**: `SCHEMA_CONSISTENCY_FINAL_SUMMARY.md`

---

**Happy Testing! 🚀**

The CEA agent system is designed to provide personalized, actionable guidance for clean energy career transitions. These testing tools ensure the system maintains high quality and relevance for all user types. 