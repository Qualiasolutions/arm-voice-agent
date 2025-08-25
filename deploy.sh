#!/bin/bash

# Armenius Voice Assistant - Deployment Script
echo "🚀 Deploying Armenius Voice Assistant..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Run type checking
echo "🔍 Running type checks..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "❌ Type checking failed. Please fix errors before deploying."
    exit 1
fi

# Run tests if they exist
if [ -f "tests/webhook.test.js" ]; then
    echo "🧪 Running tests..."
    npm test
    
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Please fix before deploying."
        exit 1
    fi
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your application is now live:"
    echo "   - Main site: https://armenius.vercel.app"
    echo "   - Test interface: https://armenius.vercel.app/test"
    echo "   - Health check: https://armenius.vercel.app/api/vapi/health"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update your Vapi assistant with the webhook URL"
    echo "   2. Test the voice functions at /test"
    echo "   3. Check the setup guide at /vapi-setup.md"
    echo ""
    echo "📊 Monitor your deployment:"
    echo "   vercel logs --follow"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi