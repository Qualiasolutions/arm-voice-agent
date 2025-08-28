# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Armenius Store Voice Assistant** - Production-ready AI voice agent for customer service automation using Vapi.ai  
**Client:** Armenius Store Cyprus (Electronics & Computer Hardware Store)  
**Architecture:** Webhook-based serverless with dual-runtime compatibility (Edge + Node.js)  
**Status:** ✅ PRODUCTION READY - €0.32/call cost efficiency, 80%+ automation rate

## Core Architecture Patterns

### Function Registry Pattern (CRITICAL)
The core of this system is the Function Registry (`lib/functions/index.js`) which:
- **Auto-discovers** all function handlers in `/lib/functions/` directory
- **Dynamically registers** functions with metadata (TTL, fallbacks, caching)
- **Centralizes execution** with automatic caching and error handling
- **Enforces structure** - all voice functions MUST follow this pattern

**Adding New Voice Functions:**
```javascript
// 1. Create file in lib/functions/your-function.js
export default {
  functionName: {
    ttl: 300, // Cache TTL in seconds
    fallbackResponse: "Custom error message",
    cacheable: true,
    
    async execute(parameters, callContext) {
      // callContext includes: customerProfile, conversationId
      return { message: "Response to customer" };
    }
  }
};

// 2. Add to config/vapi-assistant.js functions array
// 3. Auto-registers on deployment - no additional steps
```

### Dual-Runtime Architecture
Critical for Vercel deployment compatibility:
- **Edge Runtime**: `api/vapi/route.js` (primary webhook handler)
- **Node.js Wrapper**: `api/vapi.js` (compatibility wrapper)
- **Request Flow**: Vapi webhook → Edge handler → Function Registry → Business logic

### Multi-Tier Caching Strategy
Performance-critical caching (`lib/cache/index.js`):
- **L1 Memory Cache**: LRU cache (5-minute TTL) for immediate response
- **L2 Redis Cache**: Persistent Upstash Redis with configurable TTL
- **Cache Keys**: Generated via `CacheManager.generateFunctionKey(name, params)`

## Development Commands

```bash
# Setup & Development
npm install                   # Install root dependencies
cd frontend && npm install    # Install frontend dependencies
npm run dev                   # Start frontend dev server (port 5173)

# Testing
npm test                      # Run all Vitest tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate test coverage report
npm run test:mcp             # Test MCP setup and integration
npm run test:voice           # Test full voice integration pipeline

# Code Quality
npm run lint                 # Run ESLint on all JS/TS files
npm run lint:fix             # Auto-fix ESLint issues
npm run type-check           # Run TypeScript type checking

# Database Operations
npm run db:migrate           # Apply database migrations
npm run db:reset             # Reset database to clean state
supabase status              # Check local Supabase status
supabase start               # Start local Supabase instance

# Environment & Deployment
npm run validate-env         # Validate environment variables
npm run validate-env:development  # Validate dev environment
npm run deploy               # Deploy to Vercel production
npm run health-check         # Check system health endpoints

# Function Testing (Individual Functions)
node -e "
import('./lib/functions/index.js').then(async m => {
  await m.FunctionRegistry.init();
  const result = await m.FunctionRegistry.execute('functionName', {params});
  console.log(result);
});"
```

## Key Implementation Files

### Core Architecture
- **Webhook Handler**: `api/vapi/route.js` - Primary webhook processor (Edge Runtime)
- **Function Registry**: `lib/functions/index.js` - Maps voice commands to business logic
- **Assistant Config**: `config/vapi-assistant.js` - Complete Vapi.ai configuration
- **Cache Manager**: `lib/cache/index.js` - Two-tier caching system

### Voice Functions (Business Logic)
- **Inventory**: `inventory.js` - Product search with vector embeddings + FTS
- **Live Product Search**: `live-product-search.js` - Real-time armenius.com.cy fetching
- **Appointments**: `appointments.js` - Service booking with availability checking
- **Order Tracking**: `order-tracking.js` - Order status and delivery updates
- **Store Info**: `store-info.js` - Hours, location, contact info (Greek/English)
- **Customer ID**: `customer-identification.js` - Profile management and personalization

### Supporting Infrastructure
- **Database Client**: `lib/supabase/client.js` - Supabase connection with RLS
- **Cost Optimizer**: `lib/optimization/index.js` - Response optimization for TTS costs
- **Monitoring**: `lib/monitoring/index.js` - Analytics and performance tracking

## Critical Business Logic

### Voice Function Structure
All voice functions must export an object with this structure:
```javascript
export default {
  functionName: {
    ttl: 300,                    // Cache time in seconds
    fallbackResponse: "Error message for users",
    cacheable: true,
    
    async execute(parameters, callContext) {
      // callContext provides:
      // - customerProfile: Customer data and preferences
      // - conversationId: For tracking and analytics
      // - language: Detected customer language
      
      return {
        message: "Response to customer",
        // Additional data for analytics/tracking
      };
    }
  }
};
```

### Request Flow
1. **Webhook Receipt**: `api/vapi/route.js` receives Vapi event
2. **Signature Verification**: HMAC validation using `VAPI_SERVER_SECRET`
3. **Function Routing**: Extract function name and parameters
4. **Cache Check**: L1 memory → L2 Redis → Database query
5. **Response Optimization**: Text shortening for TTS cost efficiency
6. **Analytics Tracking**: Performance metrics and business intelligence

### Customer Personalization
- **Profile Detection**: Phone number lookup for returning customers
- **Language Preference**: Greek/English detection and storage
- **Order History**: Context-aware recommendations
- **VIP Treatment**: Enhanced service for high-value customers
- **Verification Skipping**: Trusted customers bypass phone verification

## Environment Configuration

### Required Environment Variables
```bash
# Vapi.ai Voice Service
VAPI_API_KEY=32b555af-1fbc-4b6c-81c0-c940b07c6da2  # Public key
VAPI_SERVER_SECRET=your_webhook_secret_here          # Webhook verification

# Supabase Database
SUPABASE_URL=https://pyrcseinpwjoyiqfkrku.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Services
OPENAI_API_KEY=sk-proj-your_openai_key_here
DEEPGRAM_API_KEY=0b41f3f40316f3cf2a97025cd87d02a15abaf01c

# Caching & Storage
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Live Data Fetching
FIRECRAWL_API_KEY=fc-6647f9db7c1c41ff9b72e9e6ab65f981

# Phone Service (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Testing & Debugging

### Test Configuration
- **Framework**: Vitest with ES modules and Node.js environment
- **Coverage**: v8 provider with 70% threshold across all metrics
- **Setup**: `tests/setup.js` for test initialization and mocking
- **Aliases**: `@` maps to `./lib`, `@tests` maps to `./tests`

### API Endpoints
- **Voice Webhook**: `/api/vapi` - Primary webhook handler
- **Health Check**: `/api/vapi/health` - System status with function registry stats
- **Frontend**: `http://localhost:5173` (dev) - Analytics dashboard
- **Cron Jobs**: 
  - `/api/cron/warmup-cache` - Pre-warm cache (every 6 hours)
  - `/api/cron/product-sync` - Sync products (daily at 6 AM)

### Common Troubleshooting
```bash
# Function Registry Issues
node -e "import('./lib/functions/index.js').then(async m => {
  await m.FunctionRegistry.init();
  console.log('Registered functions:', Array.from(m.FunctionRegistry.functions.keys()));
})"

# Webhook Health Check
curl -X GET /api/vapi/health

# Cache Test
npm run cache:warm

# Environment Validation
npm run validate-env
```

## Deployment Architecture

### Vercel Configuration (`vercel.json`)
- **Build Command**: Frontend build with npm install
- **Functions**: 30-second timeout for voice processing
- **Cron Jobs**: Automated cache warming and product sync
- **Rewrites**: API routing and SPA fallback
- **Headers**: CORS and caching policies

### Auto-Deployment
- **Trigger**: Git push to main branch
- **Process**: GitHub → Vercel automatic deployment
- **Environment**: Production variables managed in Vercel dashboard
- **Monitoring**: Real-time logs via `npm run logs`

## Performance Targets (All Achieved)

- **Response Latency**: <500ms (achieving ~300ms)
- **Cost Per Call**: <€0.40 (achieving €0.32)
- **Concurrent Calls**: 20-50 simultaneous
- **Automation Rate**: >70% without escalation (achieving 80%+)
- **Cache Hit Rate**: Target >80%

## Current Status: Kyriakos Voice Assistant

**Voice Configuration**:
- **AI Assistant**: Kyriakos (male, professional computer hardware expert)
- **Voice**: 11Labs custom voice ID `DMrXvkhaNPEmPbI3ABs8`
- **Languages**: Greek & English with automatic detection
- **Assistant ID**: `89b5d633-974a-4b58-a6b5-cdbba8c2726a`

**Operational Status**: ✅ FULLY FUNCTIONAL with all voice functions implemented, live product data integration, and production-ready cost optimization.