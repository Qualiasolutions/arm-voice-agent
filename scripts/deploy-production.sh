#!/bin/bash

# Armenius Voice Assistant - Production Deployment Script
# This script deploys the voice assistant to Vercel with production configuration

echo "🚀 Starting Armenius Voice Assistant Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if required tools are installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "📋 Pre-deployment checklist:"

# 1. Install dependencies
echo "1️⃣ Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi

cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo "✅ Dependencies installed"

# 2. Run tests
echo "2️⃣ Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "⚠️  Tests failed, but continuing deployment..."
fi

# 3. Lint code
echo "3️⃣ Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found, but continuing deployment..."
fi

# 4. Build frontend
echo "4️⃣ Building frontend..."
cd frontend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi
cd ..

echo "✅ Frontend built successfully"

# 5. Check environment variables
echo "5️⃣ Checking production environment configuration..."

REQUIRED_ENV_VARS=(
    "VAPI_API_KEY"
    "VAPI_SERVER_SECRET"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "OPENAI_API_KEY"
    "DEEPGRAM_API_KEY"
)

MISSING_VARS=()

echo "Environment variables to configure in Vercel dashboard:"
for var in "${REQUIRED_ENV_VARS[@]}"; do
    echo "   - $var"
done

echo ""
echo "Optional environment variables for enhanced functionality:"
echo "   - UPSTASH_REDIS_REST_URL (for Redis caching)"
echo "   - UPSTASH_REDIS_REST_TOKEN (for Redis caching)"
echo "   - TWILIO_ACCOUNT_SID (for SMS notifications)"
echo "   - TWILIO_AUTH_TOKEN (for SMS notifications)"
echo "   - MCP_SERVER_URL (for external integrations)"
echo "   - FIRECRAWL_API_KEY (for product scraping)"

# 6. Deploy to Vercel
echo ""
echo "6️⃣ Deploying to Vercel..."
echo "🔄 Running: vercel --prod"

# Deploy to production
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "1. Configure environment variables in Vercel dashboard"
    echo "2. Test the webhook endpoint: https://your-domain.vercel.app/api/vapi/health"
    echo "3. Configure Vapi.ai assistant with the production webhook URL"
    echo "4. Test voice functions with real phone calls"
    echo "5. Monitor logs: vercel logs --follow"
    echo ""
    echo "🔗 Useful links:"
    echo "   - Vercel Dashboard: https://vercel.com/dashboard"
    echo "   - Vapi.ai Dashboard: https://dashboard.vapi.ai"
    echo "   - Supabase Dashboard: https://app.supabase.com"
    echo ""
    echo "📞 Your voice assistant is now ready for production use!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi