# Climate Ecosystem Assistant

## Project Overview

The Climate Ecosystem Assistant (CEA) is a comprehensive AI-powered platform designed to bridge the gap between job seekers and opportunities within the burgeoning Massachusetts climate economy. Leveraging advanced AI agents and a robust technology stack, the CEA aims to provide equitable access to resources, personalized career guidance, and seamless navigation of the clean energy sector for diverse user groups, including veterans, international professionals, and residents of Environmental Justice communities.

*Note: This project is currently under active development.*

## Features

- **AI-Powered Chat Interface**: Engage with specialized AI agents for personalized guidance
- **Resume Analysis**: Upload and analyze resumes for climate economy relevance
- **Career Pathway Recommendations**: Get personalized career development plans
- **Resource Connections**: Access training programs, funding opportunities, and more
- **Partner Portal**: For ecosystem partners to manage opportunities and resources

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, DaisyUI
- **Backend**: Python, LangGraph, LangChain, FastAPI
- **AI**: DeepSeek AI models
- **Database**: Supabase (PostgreSQL for relational data), AstraDB (Cassandra for vector data/knowledge base)
- **Caching**: Redis
- **Authentication**: JWT with Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.11+)
- Redis
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mass-climate-assistant.git
   cd mass-climate-assistant
   ```

2. Install frontend dependencies
   ```bash
   npm install
   ```

3. Install backend dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys and configuration
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
mass-climate-assistant/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── assistant/        # Assistant page
│   └── ...               # Other pages
├── components/           # React components
├── lib/                  # Shared libraries
│   ├── ai/               # AI agent definitions
│   ├── tools/            # Tool definitions
│   └── ...               # Other utilities
├── public/               # Static assets
├── scripts/              # Utility scripts
└── ...                   # Configuration files
```

## Multi-Agent Architecture

The Climate Ecosystem Assistant uses a hierarchical agent architecture:

- **Supervisor Agent (Pendo)**: Routes queries to specialized agents
- **Career Development Agent (Liv)**: Handles resume analysis and career guidance
- **Environmental Justice Agent (Jasmine)**: Focuses on equity and EJ community resources
- **Veterans Specialist (Marcus)**: Helps veterans translate military experience
- **International Professionals Agent (Miguel)**: Assists with credential evaluation and integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Alliance for Climate and Transportation (ACT)
- MassCEC
- Franklin Cummings Tech
- All ecosystem partners
