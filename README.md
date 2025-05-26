# Climate Economy Assistant (CEA) 🌱

A comprehensive full-stack platform connecting job seekers with climate economy opportunities in Massachusetts, featuring AI-powered career guidance, skills translation, and ecosystem integration.

## 🚀 Features

### For Job Seekers
- **AI-Powered Career Guidance**: Multi-agent LangGraph system for personalized career recommendations
- **Resume Analysis**: Intelligent resume processing with climate relevance scoring
- **Skills Translation**: Cross-industry skill mapping to clean energy opportunities
- **Partner Matching**: Connect with training programs, employers, and support organizations
- **Interactive Dashboard**: Track progress, view recommendations, and access resources

### For Partners (Training Programs, Employers, Support Organizations)
- **Candidate Pipeline**: Access to qualified candidates with climate career interests
- **Program Integration**: Showcase training programs and job opportunities
- **Analytics Dashboard**: Track engagement and placement metrics
- **Resource Sharing**: Contribute to the knowledge base and resource library

### Technical Features
- **LangGraph Agent System**: Advanced multi-agent AI for complex career guidance
- **Real-time Chat Interface**: Interactive conversations with specialized agents
- **Secure Authentication**: Supabase-based auth with role-based access control
- **PII Encryption**: Advanced security for sensitive user data
- **Responsive Design**: Modern UI with DaisyUI and Tailwind CSS
- **Comprehensive Testing**: Automated agent testing with multiple scenarios

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, DaisyUI
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **AI/ML**: LangGraph, OpenAI GPT-4, Vector embeddings
- **Deployment**: Vercel (Frontend), Supabase (Backend)
- **Testing**: Custom agent testing suite with automated scenarios

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key
- Git

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/your-username/climate-economy-assistant.git
cd climate-economy-assistant
npm install
```

### 2. Environment Setup
Create `.env.local` with your Supabase and OpenAI credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup
```bash
# Run Supabase migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Deploy Edge Functions
```bash
# Deploy LangGraph agent functions to Supabase
supabase functions deploy langgraph-agent-response
supabase functions deploy langgraph-process-resume
```

### 5. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🧪 Testing

### Agent System Testing
The platform includes comprehensive testing for the AI agent system:

```bash
# Run full automated test suite
npm run test-agents

# Interactive testing tool
npm run test-agents-interactive

# Quick validation tests
npm run test-agents-quick
```

### Test Scenarios
- **Traditional Engineer → Clean Energy**: Automotive to renewable energy transition
- **Military Veteran → Clean Energy**: Military-to-civilian skill translation
- **International Professional → US Market**: Credential recognition and market entry
- **Career Changer → Environmental Justice**: Non-technical to technical transition
- **Recent Graduate → Entry Level**: New graduate career guidance

## 📁 Project Structure

```
climate-economy-assistant/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard and main app components
│   │   ├── onboarding/     # User onboarding flows
│   │   └── profile/        # Profile management
│   ├── pages/              # Page components and routing
│   ├── services/           # API services and business logic
│   ├── lib/                # Utilities and configurations
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # Edge Functions (LangGraph agents)
│   └── migrations/         # Database migrations
├── scripts/                # Testing and utility scripts
└── docs/                   # Documentation
```

## 🤖 Agent System

The CEA platform uses a sophisticated LangGraph-based multi-agent system:

### Agent Types
- **Career Guidance Agent**: Personalized career recommendations
- **Skills Translation Agent**: Cross-industry skill mapping
- **Partner Matching Agent**: Connect users with relevant organizations
- **Resource Recommendation Agent**: Curated learning and job resources

### Key Features
- **Context Awareness**: Maintains conversation history and user profile context
- **Dynamic Routing**: Intelligent agent selection based on query type
- **Knowledge Base Integration**: Access to Massachusetts climate programs and policies
- **Quality Metrics**: Automated evaluation of response quality and relevance

## 🔐 Security

- **PII Encryption**: Sensitive data encrypted at rest
- **Role-Based Access Control**: Granular permissions for different user types
- **Rate Limiting**: API protection against abuse
- **Secure Authentication**: Supabase Auth with email verification
- **Data Privacy**: GDPR-compliant data handling

## 🌍 Massachusetts Climate Ecosystem

The platform integrates with key Massachusetts organizations:

### Training Partners
- Franklin Cummings Tech
- TPS Energy
- Urban League of Eastern Massachusetts
- MassCEC Workforce Development

### Employer Partners
- Clean energy companies
- Environmental consulting firms
- Green technology startups
- Government agencies

### Support Organizations
- Career centers
- Community organizations
- Professional associations

## 📊 Analytics & Reporting

- **User Engagement Metrics**: Track platform usage and feature adoption
- **Career Progression Tracking**: Monitor user advancement through programs
- **Partner Performance**: Analyze training program and employer effectiveness
- **System Performance**: Monitor agent response quality and system health

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
npm run deploy

# Or use Vercel CLI
vercel --prod
```

### Supabase Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy langgraph-agent-response
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Testing**: Use the comprehensive agent testing suite for validation

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with additional training providers
- [ ] Multi-language support
- [ ] Enhanced AI capabilities
- [ ] Blockchain-based credential verification

---

**Built with ❤️ for the Massachusetts climate economy ecosystem**
