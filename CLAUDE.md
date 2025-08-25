# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Armenius Store Voice Assistant** - Production-ready AI voice agent for customer service automation using Vapi.ai  
**Client:** Armenius Store Cyprus (Electronics & Computer Hardware Store)  
**Developer:** Qualia Solutions  
**Architecture:** Webhook-based serverless with dual-runtime compatibility (Edge + Node.js)
**Status:** ✅ PRODUCTION READY - Database complete, all functions implemented, cost target achieved (€0.32/call)

## Critical Architecture Patterns

### Function Registry Pattern
The core of this system is the Function Registry (`lib/functions/index.js`) which:
- **Dynamically loads** all function handlers from `/lib/functions/` directory
- **Auto-registers** functions with metadata (TTL, fallback responses, caching config)
- **Provides centralized execution** with automatic caching, error handling, and performance tracking
- **Ensures fallbacks** for every function with customizable error messages

**Key Insight:** When adding new voice functions, they MUST follow this pattern or the system will fail silently.

### Dual-Runtime Architecture Pattern
Critical for Vercel deployment:
- **Edge Runtime**: `api/vapi/route.js` (primary webhook handler)
- **Node.js Wrapper**: `api/vapi.js` (compatibility wrapper)
- All handlers MUST support both runtimes for production reliability

### Multi-Tier Caching Strategy
Performance-critical caching system (`lib/cache/index.js`):
- **L1 Memory Cache**: LRU cache (5-minute TTL) for immediate response
- **L2 Redis Cache**: Persistent cache with configurable TTL per function
- **Cache Warming**: Pre-populated via `CacheManager.warmup()`
- Cache keys are generated via `CacheManager.generateFunctionKey(name, params)`

## Core Tech Stack

- **Voice Pipeline:** Vapi.ai (Deepgram STT + GPT-4o-mini + 11Labs TTS)
- **Compute:** Vercel Edge Functions with Node.js wrapper
- **Database:** Supabase PostgreSQL with vector embeddings + FTS
- **Phone:** Twilio SIP Trunking
- **Cache:** Two-tier (Upstash Redis + LRU memory cache)
- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui
- **AI Models:** OpenAI GPT-4o-mini, 11Labs TTS (Rachel voice), Deepgram Nova-2

## Project Structure

```
/
├── api/
│   ├── vapi/                  # Main webhook handlers (Edge Runtime)
│   │   ├── route.js          # Primary webhook handler
│   │   ├── health.js         # Health check endpoint
│   │   ├── init.js           # Initialization endpoint  
│   │   └── index.js          # Fallback handler
│   ├── vapi.js               # Node.js wrapper for compatibility
│   ├── cron/                 # Scheduled tasks
│   │   ├── cost-analysis.js  # Cost monitoring cron job
│   │   ├── daily-report.js   # Daily analytics report
│   │   └── warmup-cache.js   # Cache pre-warming
│   └── config.js             # API configuration
├── config/
│   ├── vapi-assistant.js     # Complete Vapi assistant configuration
│   └── mcp-config.js         # MCP integration settings
├── lib/
│   ├── functions/            # Function registry for voice commands
│   │   ├── index.js          # Registry and execution engine
│   │   ├── inventory.js      # Product search and availability
│   │   ├── appointments.js   # Service booking system
│   │   ├── orders.js         # Order status and tracking
│   │   ├── store-info.js     # Store information (hours, location)
│   │   └── customer-identification.js # Customer profile management
│   ├── cache/index.js        # Two-tier caching (LRU + Redis)
│   ├── supabase/client.js    # Database client and queries
│   ├── optimization/index.js # Cost optimization utilities
│   └── monitoring/index.js   # Analytics and alerting
├── frontend/                 # React dashboard for call analytics
│   ├── src/
│   │   ├── pages/            # Dashboard pages (Analytics, Customers, etc.)
│   │   ├── components/       # Reusable UI components (shadcn/ui)
│   │   └── lib/              # Frontend utilities (Supabase client, utils)
│   └── package.json          # Frontend dependencies
├── tests/                    # Test suites
│   ├── webhook.test.js       # Webhook handler tests
│   └── mcp-integration.test.js # MCP integration tests
├── migrations/               # Database schema migrations (SQL files)
└── supabase/                 # Supabase configuration and migrations
    ├── config.toml          # Local Supabase configuration
    └── migrations/          # Supabase migration files
```

## Development Commands

```bash
# Project Setup
npm install                   # Install root dependencies
cd frontend && npm install    # Install frontend dependencies

# Development
npm run dev                   # Start frontend development server (Vite)
cd frontend && npm run dev    # Alternative frontend startup

# Testing
npm test                      # Run all Vitest tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate test coverage report
npm test tests/webhook.test.js     # Test webhook handlers only
npm test tests/mcp-integration.test.js # Test MCP integration only

# Code Quality & Type Checking
npm run lint                 # Run ESLint on all JS/TS files
npm run lint:fix             # Auto-fix ESLint issues
npm run type-check           # Run TypeScript type checking
cd frontend && npm run build # Build frontend for production

# Database Operations
npm run db:migrate           # Apply database migrations (supabase db push)
npm run db:reset             # Reset database to clean state
supabase status              # Check Supabase local development status
supabase start               # Start local Supabase instance
supabase stop                # Stop local Supabase instance

# Cache & Data Management
npm run cache:warm           # Pre-warm cache with common queries
curl /api/cron/product-sync  # Manually sync products from armenius.com.cy
npm run test:mcp             # Test MCP configuration and connectivity
npm run test:voice           # Test complete voice agent + live data integration

# Deployment & Monitoring
npm run deploy               # Deploy to Vercel production
npm run logs                 # Follow Vercel deployment logs
vercel --prod                # Manual production deployment

# Function Development Testing
# To test a specific function locally:
node -e "
import('./lib/functions/index.js').then(async m => {
  await m.FunctionRegistry.init();
  const result = await m.FunctionRegistry.execute('functionName', {params});
  console.log(result);
});"

# Advanced Operations
node -e "import('./lib/functions/firecrawl-integration.js').then(m => m.scrapeArmeniusProducts())" # Direct product scraping
node scripts/test-mcp-setup.js      # Test MCP server connectivity
node scripts/test-voice-integration.js # Test voice agent integration
```

## Key Implementation Files

### Core Architecture
- **Webhook Handler:** `api/vapi/route.js` - Edge Runtime webhook processor with dual-runtime support
- **Node Wrapper:** `api/vapi.js` - Node.js compatibility wrapper for Vercel serverless functions
- **Assistant Config:** `config/vapi-assistant.js` - Complete Vapi.ai assistant configuration (voice, model, prompts)
- **Function Registry:** `lib/functions/index.js` - Maps voice commands to business logic handlers with caching integration
- **Cache Manager:** `lib/cache/index.js` - Two-tier caching (LRU memory + Redis)

### Business Functions
- **Inventory:** `lib/functions/inventory.js` - Product availability and search with vector embeddings
- **Appointments:** `lib/functions/appointments.js` - Service booking system with availability checking
- **Orders:** `lib/functions/orders.js` - Order status and tracking
- **Store Info:** `lib/functions/store-info.js` - Location, hours, contact info
- **Customer ID:** `lib/functions/customer-identification.js` - Customer profile management and personalization
- **Custom PC Builder:** `lib/functions/custom-pc-builder.js` - Interactive PC configuration and custom build orders
- **Order Tracking:** `lib/functions/order-tracking.js` - Advanced order tracking with live delivery updates
- **Firecrawl Integration:** `lib/functions/firecrawl-integration.js` - Automated product data scraping from armenius.com.cy

### Database & Utils
- **Supabase Client:** `lib/supabase/client.js` - Database connection and queries with RLS
- **Cost Optimizer:** `lib/optimization/index.js` - Response optimization for TTS costs
- **Monitoring:** `lib/monitoring/index.js` - Analytics and performance tracking

### Frontend Dashboard
- **Main App:** `frontend/src/App.tsx` - React application with routing
- **Pages:** `frontend/src/pages/` - Dashboard, Analytics, Customers, Operations, etc.
- **Components:** `frontend/src/components/` - Reusable UI components using shadcn/ui
- **Utilities:** `frontend/src/lib/` - Supabase client and utility functions

## Critical Business Logic

### Function Registry Pattern (MUST UNDERSTAND)
The Function Registry (`lib/functions/index.js`) is the core architectural pattern:

```javascript
// How to add a new function:
// 1. Create handler in lib/functions/your-function.js
export default {
  functionName: {
    ttl: 300, // Cache TTL in seconds
    fallbackResponse: "Custom error message for users",
    cacheable: true, // Whether to cache results
    
    async execute(parameters, callContext) {
      // Your business logic here
      // callContext includes: customerProfile, conversationId, etc.
      return {
        message: "Response to customer",
        // other data...
      };
    }
  }
};

// 2. The registry auto-discovers and registers functions
// 3. Functions are called via FunctionRegistry.execute(name, params, context)
```

**Critical Voice Functions:**
- `checkInventory` - Product availability with semantic search (inventory.js:202)
- `getProductPrice` - Pricing with quantity discounts (inventory.js:245)
- `bookAppointment` - Service scheduling with availability checking (appointments.js:257)
- `checkOrderStatus` - Order tracking with customer verification (orders.js:178)
- `getStoreInfo` - Hours, location, contact info in Greek/English (store-info.js:89)
- `buildCustomPC` - Interactive PC configuration with component guidance (custom-pc-builder.js:12)
- `trackOrderByNumber` - Advanced order tracking with real-time delivery updates (order-tracking.js:12)

### Dual-Runtime Architecture
The system uses a sophisticated dual-runtime setup:
- **Edge Runtime:** `api/vapi/route.js` provides optimal performance for webhook processing
- **Node.js Compatibility:** `api/vapi.js` wraps Edge functions for Vercel serverless compatibility  
- **Request Transformation:** Automatic conversion between runtime request/response formats
- **Fallback Handling:** Graceful degradation when Edge Runtime is unavailable

### Multi-Tier Caching Strategy
- **L1 Memory Cache:** LRU cache (5-minute TTL) for immediate response to frequent queries
- **L2 Redis Cache:** Persistent Upstash Redis cache with configurable TTL per function type
- **Cache Warming:** Pre-populate common queries via cron jobs (`api/cron/warmup-cache.js`)
- **Smart Invalidation:** Context-aware cache expiration based on data freshness requirements

### Cost Optimization System
- **Dynamic model selection:** GPT-3.5-turbo for simple queries, GPT-4o-mini for complex reasoning
- **Response text optimization:** Automatically shortens responses to reduce TTS character costs
- **Aggressive caching:** Predictable queries cached for 24+ hours (store hours, contact info)
- **Call duration limits:** 15-minute maximum with graceful handoff to human support
- **Real-time cost tracking:** Each call's cost monitored with €2.00 alert thresholds

## Environment Configuration

### Required Environment Variables
```bash
# Vapi.ai Voice Service
VAPI_API_KEY=32b555af-1fbc-4b6c-81c0-c940b07c6da2
VAPI_SERVER_SECRET=your_webhook_secret_here

# Supabase Database (Production Ready)
SUPABASE_URL=https://pyrcseinpwjoyiqfkrku.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here

# AI Services
OPENAI_API_KEY=sk-proj-your_openai_key_here
DEEPGRAM_API_KEY=0b41f3f40316f3cf2a97025cd87d02a15abaf01c

# Caching & Storage
UPSTASH_REDIS_REST_URL=redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=redis_token_here

# Phone Service
TWILIO_ACCOUNT_SID=account_sid_here
TWILIO_AUTH_TOKEN=auth_token_here

# Deployment
NODE_ENV=production
MAX_CALL_DURATION_MINUTES=15

# MCP Integration - Global config at ~/.config/vapi/.env.mcp
MCP_SERVER_URL=https://mcp.zapier.com/api/mcp/s/YOUR_ZAPIER_MCP_TOKEN/mcp
VAPI_MCP_GLOBAL_CONFIG=true    # Use global MCP configuration
FIRECRAWL_API_KEY=fc-YOUR_FIRECRAWL_API_KEY  # For product scraping

# Additional MCP servers in global config
# Zapier MCP for workflow automation
# Firecrawl MCP for web scraping armenius.com.cy products
```

### Testing URLs and Endpoints
- **Frontend Dashboard:** http://localhost:5173 (dev) / your-production-url (prod)
- **Test Interface:** `public/test.html` (quick voice testing)
- **Health Check:** `/api/vapi/health` - Returns function registry stats and system status
- **Webhook Endpoint:** `/api/vapi` (primary) or `/api/vapi/route` (direct Edge)
- **Cron Jobs:** `/api/cron/warmup-cache`, `/api/cron/daily-report`, `/api/cron/cost-analysis`, `/api/cron/product-sync`
- **MCP Validation:** `npm run test:mcp` or `node scripts/test-mcp-setup.js`

### Key API Responses
The webhook handler (`api/vapi/route.js`) responds to these Vapi.ai event types:
- `function-call` → Executes business logic via FunctionRegistry
- `call-started` → Identifies customer and sets up personalized context  
- `call-ended` → Calculates costs and updates conversation records
- `conversation-update` → Stores transcript and detects language
- `transfer-destination-request` → Routes to human support

### Database Schema Overview
The system uses Supabase PostgreSQL with optimized schema:
- **products:** 22 products with vector embeddings for semantic search + full-text search
- **conversations:** Call logs with cost tracking and performance metrics
- **appointments:** Service booking with availability management
- **analytics_events:** Real-time event tracking for monitoring and business intelligence
- **orders:** Order management with status tracking
- **customers:** Customer profiles with personalization data

## Testing Approach

```bash
# Run all tests
npm test                       # Run all Vitest tests

# Test specific files
npm test webhook.test.js       # Test webhook handlers and function registry
npm test mcp-integration.test.js # Test MCP integration

# Watch mode and coverage
npm run test:watch            # Watch mode tests
npm run test:coverage         # Generate coverage report
```

### Test Configuration
- **Test Framework:** Vitest with ES modules support
- **Mocking Strategy:** vi.mock() for external dependencies (Supabase, function registry)
- **Environment:** Isolated test environment with mock secrets
- **Coverage:** Tracks webhook handlers, function execution, and MCP integration

Test files cover:
- **Webhook processing:** Request validation, function execution, error handling
- **Function registry:** Dynamic loading, caching integration, fallback responses
- **MCP integration:** External service connections and tool validation
- **Database operations:** Query performance and data integrity

## Architecture Patterns

### Function Registry with Automatic Registration
```javascript
// Functions self-register with metadata
export default {
  checkInventory: {
    execute: async (params, context) => { /* implementation */ },
    ttl: 300, // 5-minute cache
    cacheable: true,
    fallbackResponse: "I'm having trouble checking inventory..."
  }
};
```

### Webhook Request Flow
1. **Request Validation:** HMAC signature verification for Vapi webhooks
2. **Runtime Detection:** Automatic Edge/Node.js compatibility handling  
3. **Function Routing:** Extract function name and parameters from Vapi request
4. **Cache Check:** L1 memory → L2 Redis → Database query
5. **Response Optimization:** Text shortening for TTS cost efficiency
6. **Analytics Tracking:** Performance metrics and business intelligence

### Customer Personalization System
- **Profile Detection:** Phone number lookup for returning customers
- **Language Preference:** Automatic Greek/English detection and storage
- **Order History:** Context-aware recommendations based on purchase history
- **VIP Treatment:** Enhanced service for high-value customers (€1000+ spent)
- **Verification Skipping:** Trusted customers (3+ orders) bypass phone verification

## Performance Targets & Current Status

- **Response Latency:** <500ms (currently ~300ms) ✅
- **Concurrent Calls:** 20-50 simultaneous (tested) ✅
- **Cost per Call:** <€0.40 (achieving €0.32) ✅
- **Cache Hit Rate:** Target >80% (monitor via analytics)
- **Automation Rate:** >70% without escalation ✅

## Monitoring & Debugging

### Real-time Monitoring
- **Platform Logs:** Monitor through your chosen deployment platform's interface
- **Vapi Dashboard:** https://dashboard.vapi.ai for call management
- **Supabase Studio:** Database performance and query optimization
- **Custom Analytics:** Real-time dashboard at `/analytics` with call metrics

### Automated Alerting
- **Cost Alerts:** Immediate notification when individual call >€2.00
- **Error Rate Monitoring:** Alert when error rate >5% over 15-minute window  
- **Performance Degradation:** Response time alerts when p95 >500ms
- **Database Health:** RLS policy performance monitoring

### Key Performance Indicators
- **Call Volume:** Daily/hourly call patterns and seasonality
- **Function Usage:** Which voice functions are most/least used
- **Language Distribution:** Greek vs English usage patterns  
- **Customer Satisfaction:** Resolution rates and escalation patterns
- **Cost Efficiency:** Per-call cost trends and optimization opportunities

## Common Development Patterns

### Adding a New Voice Function (CRITICAL PROCESS)
1. **Create Handler File:** `lib/functions/your-feature.js`
   ```javascript
   export default {
     yourFunctionName: {
       ttl: 300, // Cache time in seconds
       fallbackResponse: "Sorry, I'm having trouble with that request.",
       cacheable: true,
       
       async execute(parameters, callContext) {
         // Access customer info: callContext.customerProfile
         // Access database: import { db } from '../supabase/client.js'
         return { message: "Your response" };
       }
     }
   };
   ```

2. **Add to Vapi Config:** Update `config/vapi-assistant.js` functions array:
   ```javascript
   {
     name: "yourFunctionName",
     description: "What this function does",
     parameters: {
       type: "object",
       properties: {
         param1: { type: "string", description: "Parameter description" }
       },
       required: ["param1"]
     }
   }
   ```

3. **Test Function:** Use the test command pattern:
   ```bash
   node -e "
   import('./lib/functions/index.js').then(async m => {
     await m.FunctionRegistry.init();
     const result = await m.FunctionRegistry.execute('yourFunctionName', {param1: 'test'});
     console.log(result);
   });"
   ```

4. **Deploy:** Function auto-registers on next deployment - no additional steps needed

### Implementing Customer Personalization
1. **Profile Lookup:** Use `customer-identification.js` for phone-based lookup
2. **Context Passing:** Include customer profile in `callContext` parameter
3. **Personalized Responses:** Modify responses based on order history and preferences
4. **Language Selection:** Automatically use customer's preferred language
5. **VIP Handling:** Provide enhanced service flows for high-value customers

### Cache Strategy Implementation  
1. **Cache Key Design:** Use function name + parameters hash for unique keys
2. **TTL Selection:** Static data (24h), dynamic data (5m), real-time data (no cache)
3. **Warming Strategy:** Pre-populate frequently accessed data via cron jobs
4. **Invalidation Rules:** Context-aware expiration (inventory changes, etc.)

## Production Considerations

### Security & Compliance
- **Webhook Security:** HMAC SHA-256 signature validation for all Vapi requests
- **Database Security:** Row Level Security policies with proper access controls
- **Input Validation:** All user inputs sanitized and validated before processing
- **PII Protection:** Customer phone numbers encrypted, call logs anonymized
- **Rate Limiting:** Built-in protection against abuse and DDoS attempts

### Scalability & Reliability  
- **Auto-scaling:** Vercel Edge Functions scale automatically with demand
- **Graceful Degradation:** Fallback responses when external services fail
- **Error Boundaries:** Comprehensive error handling with user-friendly messages
- **Circuit Breakers:** Automatic service isolation when error rates spike
- **Redundancy:** Multi-region deployment for high availability

### Cost Management
- **Real-time Tracking:** Per-call cost analysis with detailed breakdowns
- **Optimization Alerts:** Automatic notifications when costs exceed thresholds
- **Model Selection:** Dynamic switching between cost-optimized AI models
- **Response Optimization:** Automatic text shortening to reduce TTS costs
- **Cache Efficiency:** Aggressive caching to minimize API calls and database queries

### Known Issues & Maintenance Tasks
- **Database RLS Optimization:** Multiple permissive RLS policies need consolidation for performance
- **Cache Hit Rate Optimization:** Target >80% hit rate requires fine-tuning TTL settings
- **Greek Character Encoding:** Ensure proper UTF-8 handling across all system components  
- **Language Model Cost Balance:** Optimize GPT-3.5-turbo vs GPT-4o-mini selection logic

## MCP Integration Architecture

### Global MCP Configuration
The system uses Vapi's Global MCP configuration pattern:
- **Global Config File:** `~/.config/vapi/.env.mcp` stores MCP credentials
- **Project Integration:** `config/mcp-config.js` loads and validates global config
- **Assistant Config:** `config/vapi-assistant.js` automatically imports MCP utilities
- **Environment Detection:** Automatically detects local vs production MCP settings

### MCP Setup Process
1. **Global Environment Setup:** Configure `~/.config/vapi/.env.mcp` with Zapier MCP token
2. **Validation:** Run `node -e "import('./config/mcp-config.js').then(m => m.validateGlobalMcpConfig())"`
3. **Integration:** MCP tools automatically available to voice assistant
4. **Testing:** Use `npm test mcp-integration.test.js` to verify MCP connectivity

### Available MCP Capabilities
- **Zapier Integration:** 7000+ apps through Zapier MCP server
- **Firecrawl Integration:** Web scraping and content extraction for product updates
- **External Tool Access:** Dynamic tool discovery and execution
- **Webhook Automation:** Trigger external workflows from voice commands
- **Data Synchronization:** Sync customer data across business systems
- **Product Data Scraping:** Automated product catalog updates from armenius.com.cy

### Firecrawl MCP Integration
For automated product data updates:
- **Setup:** Add Firecrawl MCP alongside Vapi MCP in global configuration
- **Usage:** Scrape armenius.com.cy for product updates
- **Integration:** Products automatically sync to Supabase database
- **Commands:** `firecrawl_scrape`, `firecrawl_batch_scrape`, `firecrawl_extract`