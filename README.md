# Hylo Travel AI Platform

![Hylo Logo](https://img.shields.io/badge/Hylo-Travel%20AI%20Platform-blue)
![Version](https://img.shields.io/badge/version-2.0.0-green)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)

Hylo is an intelligent travel planning platform that leverages multi-agent AI orchestration to create personalized itineraries. Built with React + TypeScript frontend and Vercel Edge Functions backend, Hylo provides sophisticated travel planning through AI-powered recommendations and real-time web data integration.

## 🌟 Key Features

- **Multi-Agent AI Workflow**: Sophisticated 4-agent system for comprehensive travel planning
- **Real-Time Data Integration**: Live web scraping and information gathering
- **Streaming Progress Tracking**: Real-time workflow execution with agent status updates
- **Personalized Recommendations**: AI-powered itinerary generation based on user preferences
- **Responsive Design**: Mobile-first approach with Tailwind CSS styling
- **Edge-First Architecture**: All APIs run on Vercel Edge Runtime for optimal performance

## 🏗️ Architecture

### Multi-Agent System Overview

Hylo uses a sophisticated multi-agent AI workflow orchestrated by LangGraph StateGraph:

1. **Content Planner**: Analyzes user requirements and identifies information needs
2. **Website Info Gatherer**: Collects real-time web data using Groq compound models
3. **Planning Strategist**: Processes gathered information for strategic recommendations
4. **Content Compiler**: Assembles final structured itinerary output

### Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.5.3, Vite, Tailwind CSS 3.4.1
- **Backend**: Vercel Edge Functions, LangGraph StateGraph
- **AI/LLM**: Cerebras, Google Gemini, Groq SDK integrations
- **Forms**: React Hook Form 7.62.0 + Zod 3.25.76 validation
- **Vector Database**: Upstash Vector/Qdrant with Jina embeddings
- **Testing**: Vitest 3.2.4 + React Testing Library 16.3.0
- **Observability**: LangSmith tracing for workflow monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Vercel CLI (for deployment)
- Environment variables configured

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/cbanluta2700/hylo.git
cd hylo
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Configure your API keys and settings
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

### Environment Variables

Create a `.env.local` file with the following required variables:

```env
# AI Provider Keys
CEREBRAS_API_KEY=your_cerebras_key
GOOGLE_GENAI_API_KEY=your_google_key
GROQ_API_KEY=your_groq_key

# Vector Database
UPSTASH_VECTOR_REST_URL=your_upstash_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token

# Workflow Configuration
LANGGRAPH_API_URL=your_langgraph_url
LANGSMITH_API_KEY=your_langsmith_key

# Feature Flags
ENABLE_AI_WORKFLOW=true
ENABLE_STREAMING=true
```

## 🎯 Usage

### Basic Travel Planning

1. **Fill out the trip details form**:
   - Destination and travel dates
   - Number of travelers (adults/children)
   - Budget and accommodation preferences
   - Travel style and interests

2. **Submit for AI processing**:
   - Multi-agent workflow begins automatically
   - Real-time progress updates show agent status
   - Streaming results appear as they're generated

3. **Review your personalized itinerary**:
   - Daily activities with timeframes
   - Travel tips and recommendations
   - Budget breakdown and cost estimates

### Advanced Features

#### AI Workflow Integration

The platform automatically determines when to use the advanced multi-agent workflow based on:
- Trip complexity (duration, number of travelers)
- Destination requirements (visa, language, currency)
- User preferences (detailed vs. simple planning)

#### Streaming Progress Tracking

Watch your itinerary being created in real-time:
- Agent status indicators
- Progress percentage updates
- Live result streaming
- Cancellation support

## 🧪 Testing

### Run Test Suite

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Categories

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API endpoints and workflow orchestration
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Response times and resource usage

## 🏗️ Development

### Project Structure

```
hylo/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── WorkflowProgress/     # AI workflow UI components
│   │   └── TripDetails/         # Form and input components
│   ├── services/                # API service layers
│   ├── hooks/                   # Custom React hooks
│   └── types/                   # TypeScript definitions
├── api/                         # Vercel Edge Functions
│   ├── workflow/               # Multi-agent orchestration
│   ├── llm/                    # LLM provider integrations
│   └── rag/                    # Traditional RAG system
├── tests/                      # Test suites
├── specs/                      # Feature specifications
└── database/                   # Database migrations
```

### Code Style & Patterns

- **TDD Mandatory**: Write failing tests first
- **TypeScript Strict**: No `any` types, proper interfaces
- **Component Patterns**: Functional components with hooks
- **Tailwind CSS**: Utility-first styling approach
- **Edge-First**: Optimized for Vercel Edge Runtime

### Building

```bash
# Development build
npm run build

# Production build with optimizations
npm run build:prod

# Analyze bundle
npm run analyze
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
```bash
vercel login
vercel
```

2. **Configure environment variables** in Vercel dashboard

3. **Deploy**
```bash
vercel --prod
```

### Environment-Specific Configurations

- **Development**: Full logging, debug mode enabled
- **Staging**: Production-like with enhanced monitoring
- **Production**: Optimized build, minimal logging, error tracking

## 📊 Monitoring & Observability

### Built-in Monitoring

- **LangSmith Tracing**: Complete workflow visibility
- **Error Boundaries**: Graceful error handling
- **Performance Metrics**: Response time tracking
- **Cost Monitoring**: LLM usage and budget tracking

### Health Checks

```bash
# System health
curl https://your-app.vercel.app/api/health/system

# LLM providers status
curl https://your-app.vercel.app/api/providers/status

# Workflow system health
curl https://your-app.vercel.app/api/workflow/health
```

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Write tests first** (TDD approach)
```bash
npm run test -- --watch your-component
```

3. **Implement feature** following TypeScript patterns

4. **Validate implementation**
```bash
npm run test
npm run build
npm run lint
```

5. **Submit pull request** with comprehensive description

### Coding Standards

- **Constitutional Requirements**: TDD, TypeScript strict mode, performance-first
- **Testing**: Minimum 80% coverage, integration tests required
- **Documentation**: JSDoc comments, README updates
- **Accessibility**: WCAG 2.1 AA compliance

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### AI Workflow Issues
- Check environment variables are set
- Verify API key permissions
- Review LangSmith traces for errors
- Ensure feature flags are enabled

#### Performance Issues
- Monitor bundle size with `npm run analyze`
- Check for memory leaks in streaming components
- Validate Edge Function timeout settings

### Debug Mode

Enable debug logging:
```env
DEBUG=true
VERBOSE_LOGGING=true
```

### Getting Help

- 📋 **Issues**: [GitHub Issues](https://github.com/cbanluta2700/hylo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/cbanluta2700/hylo/discussions)
- 📖 **Documentation**: [Project Wiki](https://github.com/cbanluta2700/hylo/wiki)

## 📋 Feature Roadmap

### Completed ✅
- Multi-agent AI workflow integration
- Streaming progress tracking
- Real-time web data collection
- Comprehensive testing framework
- Production deployment pipeline

### In Progress 🚧
- Advanced personalization features
- Mobile app development
- API rate limiting improvements
- Enhanced error recovery

### Planned 📅
- Multi-language support
- Offline mode capabilities
- Third-party integrations
- Advanced analytics dashboard

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LangGraph**: Multi-agent orchestration framework
- **Context7**: Latest LangGraph patterns and implementations
- **Vercel**: Edge deployment platform
- **Tailwind CSS**: Utility-first CSS framework
- **React Community**: Component patterns and best practices

---

**Built with ❤️ by the Hylo Team**

*Last Updated: September 20, 2025 | Version 2.0.0 | AI Workflow Integration Complete*