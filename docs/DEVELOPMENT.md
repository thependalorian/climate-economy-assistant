# Development Guide

## 🚀 Development Environment Setup

### Quick Start
```bash
# Install dependencies
npm install

# Run health check
npm run health-check

# Start development server with full tracing
npm run dev

# Start with verbose logging
npm run dev:trace

# Start without tracing (quiet mode)
npm run dev:quiet

# Build for production
npm run build

# Run linting
npm run lint
```

## 📊 Build & Lint Status

### ✅ Build Status: **PASSING**
- Production build completes successfully
- All modules transformed without errors
- Bundle size: ~704KB (gzipped: ~172KB)
- Build time: ~2.5 seconds

### ⚠️ Lint Status: **22 ISSUES REMAINING**
- **21 Errors** | **1 Warning**
- Major React Hooks issues **RESOLVED** ✅
- Remaining issues are mostly TypeScript `any` types and unused variables

#### Critical Issues Fixed:
- ✅ React Hooks rules violations in onboarding components
- ✅ Conditional hook calls in PartnerStep1 and JobSeekerStep1
- ✅ Missing dependencies in useEffect hooks
- ✅ Unused imports and variables cleanup

#### Remaining Issues:
- TypeScript `any` types in tracing utilities (13 issues)
- Unused variables in some components (8 issues)
- Missing dependency in ProtectedRoute useEffect (1 warning)

### 🎯 Recent Improvements
- **Enhanced Package Scripts**: Added comprehensive development commands
- **Health Check System**: Automated validation of environment and dependencies
- **Advanced Tracing**: Comprehensive logging and debugging capabilities
- **Development Startup**: Automatic health checks and system initialization
- **React Hooks Compliance**: Fixed all critical hooks rule violations
- **Build Optimization**: Successful production builds with performance warnings

## 🔍 Tracing & Debugging System

### Tracing Features
- **Comprehensive Logging**: All API calls, database operations, auth flows
- **Performance Monitoring**: Component render times, network latency
- **Error Tracking**: JavaScript errors, promise rejections, network failures
- **User Journey Tracking**: Navigation, form submissions, auth state changes

### Tracing Categories
- `auth` - Authentication and user management
- `api` - Network requests and responses
- `database` - Database operations and queries
- `ai` - AI agent interactions and responses
- `navigation` - Route changes and navigation
- `performance` - Performance metrics and timing
- `errors` - Error tracking and debugging

### Development Console Commands
```javascript
// Available in browser console during development

// View all traces
tracer.getTraces()

// Export traces to file
tracer.exportTraces()

// Clear all traces
tracer.clearTraces()

// Access dev tools
window.devTools

// Clear all development data
window.devTools.clearAll()

// Run health check
window.devTools.runHealthCheck()
```

## 🏥 Health Check System

### Automatic Health Checks
The development environment automatically checks:
- ✅ Environment variables configuration
- ✅ Supabase connection and authentication
- ✅ OpenAI API key validation
- ✅ Database table accessibility
- ✅ Browser feature support
- ✅ Network connectivity
- ✅ LocalStorage functionality

### Manual Health Check
```bash
npm run health-check
```

### Health Check Results
- **PASS** ✅ - Feature working correctly
- **WARN** ⚠️ - Feature has issues but not critical
- **FAIL** ❌ - Feature not working, needs attention

## 🛠️ Development Tools

### Environment Variables
```bash
# Required for development
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret

# Development-specific
DEBUG=true
VITE_TRACE_ENABLED=true
VITE_VERBOSE=true
```

### Development Scripts
```bash
# Development server with tracing
npm run dev

# Verbose development mode
npm run dev:trace

# Quiet development mode (no tracing)
npm run dev:quiet

# Health check
npm run health-check

# Database checks
npm run check-supabase
npm run check-schema
npm run check-auth

# Test utilities
npm run test-auth
npm run test-connection
npm run register-test
```

## 📊 Performance Monitoring

### Automatic Monitoring
- **Page Load Times**: DOM content loaded, full page load
- **Resource Loading**: Scripts, stylesheets, images
- **Network Requests**: API call timing and status
- **Component Rendering**: React component performance
- **Memory Usage**: JavaScript heap size monitoring

### Performance Metrics
```javascript
// View performance data
tracer.getTraces().filter(t => t.category === 'performance')

// Export performance report
tracer.exportTraces()
```

## 🔧 API Monitoring

### Network Request Tracing
All network requests are automatically traced with:
- Request URL and method
- Request headers and body
- Response status and timing
- Error details if failed

### API Health Monitoring
- Supabase connection status
- OpenAI API accessibility
- Response time monitoring
- Error rate tracking

## 🐛 Error Tracking

### Automatic Error Capture
- JavaScript runtime errors
- Unhandled promise rejections
- Network request failures
- Component rendering errors

### Error Analysis
```javascript
// View all errors
tracer.getTraces().filter(t => t.level === 'error')

// Export error report
tracer.exportTraces()
```

## 🔐 Authentication Debugging

### Auth Flow Tracing
- Login/logout events
- Session refresh attempts
- Profile loading
- Onboarding redirects

### Auth Debugging Tools
```javascript
// Check current auth state
window.devTools.authState

// Clear auth data
localStorage.removeItem('sb-kvtkpguwoaqokcylzpic-auth-token')
sessionStorage.clear()
```

## 📱 Browser Developer Tools

### Console Styling
Development logs use color-coded styling:
- 🔵 **Blue**: API and network operations
- 🟢 **Green**: Authentication and success states
- 🟡 **Yellow**: Warnings and non-critical issues
- 🔴 **Red**: Errors and failures
- 🟣 **Purple**: Database operations
- 🟠 **Orange**: AI and agent operations

### Network Tab
Monitor all API calls in the Network tab:
- Supabase REST API calls
- OpenAI API requests
- Static resource loading
- WebSocket connections

### Application Tab
Check stored data:
- LocalStorage: User preferences, cached data
- SessionStorage: Temporary session data
- IndexedDB: Offline data storage

## 🚨 Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Clear auth cache
localStorage.clear()
sessionStorage.clear()

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Run auth test
npm run test-auth
```

#### Database Connection Issues
```bash
# Test Supabase connection
npm run check-supabase

# Check database schema
npm run check-schema

# Test specific tables
npm run test-connection
```

#### API Key Issues
```bash
# Verify OpenAI API key
curl -H "Authorization: Bearer $VITE_OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check Supabase keys
npm run check-supabase
```

### Debug Mode
```bash
# Enable comprehensive debugging
DEBUG=true npm run dev

# View detailed logs
VITE_VERBOSE=true npm run dev

# Monitor specific categories
tracer.trace('auth', 'Custom debug message', { data: 'example' })
```

## 📈 Development Metrics

### Key Performance Indicators
- Page load time < 3 seconds
- API response time < 500ms
- Error rate < 1%
- User session duration
- Feature usage analytics

### Monitoring Dashboard
Access real-time development metrics:
```javascript
// View system health
window.devTools.healthChecks

// Performance summary
tracer.getTraces()
  .filter(t => t.category === 'performance')
  .reduce((acc, t) => ({ ...acc, [t.message]: t.duration }), {})
```

## 🔄 Hot Reload & Development Workflow

### File Watching
- Automatic reload on file changes
- Component hot replacement
- Style injection without page reload
- State preservation during development

### Development Workflow
1. Start development server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Open browser developer tools
4. Monitor console for health checks and tracing
5. Use `window.devTools` for debugging utilities

## 📝 Development Best Practices

### Logging Guidelines
- Use appropriate trace categories
- Include relevant context data
- Avoid logging sensitive information
- Use structured logging format

### Performance Optimization
- Monitor component render times
- Optimize API call patterns
- Use React.memo for expensive components
- Implement proper error boundaries

### Testing Strategy
- Run health checks before development
- Test authentication flows regularly
- Verify API integrations
- Monitor error rates and performance
