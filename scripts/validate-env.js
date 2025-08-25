#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are present
 */

const requiredEnvVars = {
  // Vapi.ai Voice Service
  VAPI_API_KEY: 'Vapi.ai API key for voice processing',
  VAPI_SERVER_SECRET: 'Secret for webhook validation',
  
  // Supabase Database
  SUPABASE_URL: 'Supabase project URL',
  SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key',
  
  // AI Services
  OPENAI_API_KEY: 'OpenAI API key for language models',
  DEEPGRAM_API_KEY: 'Deepgram API key for speech-to-text',
  
  // Caching & Storage
  UPSTASH_REDIS_REST_URL: 'Upstash Redis REST URL for caching',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis REST token'
};

const optionalEnvVars = {
  // Phone Service (optional for some deployments)
  TWILIO_ACCOUNT_SID: 'Twilio account SID for phone integration',
  TWILIO_AUTH_TOKEN: 'Twilio auth token',
  
  // MCP Integration
  MCP_SERVER_URL: 'MCP server URL for external integrations',
  FIRECRAWL_API_KEY: 'Firecrawl API key for web scraping',
  
  // Deployment
  NODE_ENV: 'Node environment (production/development)',
  MAX_CALL_DURATION_MINUTES: 'Maximum call duration in minutes'
};

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const missing = [];
  const present = [];
  const warnings = [];

  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, description]) => {
    if (process.env[key]) {
      present.push({ key, description, required: true });
    } else {
      missing.push({ key, description, required: true });
    }
  });

  // Check optional variables
  Object.entries(optionalEnvVars).forEach(([key, description]) => {
    if (process.env[key]) {
      present.push({ key, description, required: false });
    } else {
      warnings.push({ key, description, required: false });
    }
  });

  // Report results
  if (present.length > 0) {
    console.log('✅ Present environment variables:');
    present.forEach(({ key, description, required }) => {
      const badge = required ? '[REQUIRED]' : '[OPTIONAL]';
      console.log(`   ${badge} ${key} - ${description}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Missing optional environment variables:');
    warnings.forEach(({ key, description }) => {
      console.log(`   [OPTIONAL] ${key} - ${description}`);
    });
    console.log('');
  }

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(({ key, description }) => {
      console.log(`   [REQUIRED] ${key} - ${description}`);
    });
    console.log('');
    
    console.log('💡 To fix these issues:');
    console.log('   1. Add missing variables to your .env file (local development)');
    console.log('   2. Set them in your Vercel dashboard (production deployment)');
    console.log('   3. Configure them in your CI/CD pipeline secrets');
    console.log('');
    
    process.exit(1);
  }

  console.log('✅ All required environment variables are present!');
  
  if (warnings.length === 0) {
    console.log('✅ All optional environment variables are also configured!');
  }
  
  console.log('');
  console.log(`📊 Summary: ${present.length} configured, ${missing.length} missing, ${warnings.length} optional missing`);
  
  return {
    valid: missing.length === 0,
    present: present.length,
    missing: missing.length,
    warnings: warnings.length
  };
}

// Validate specific environment for different deployment targets
function validateForDeployment(target = 'production') {
  console.log(`🎯 Validating environment for ${target} deployment...\n`);
  
  const result = validateEnvironment();
  
  if (target === 'production') {
    // Additional production checks
    const productionChecks = [
      {
        key: 'NODE_ENV',
        expected: 'production',
        current: process.env.NODE_ENV,
        message: 'NODE_ENV should be set to "production" for production deployments'
      }
    ];
    
    let productionIssues = 0;
    
    productionChecks.forEach(({ key, expected, current, message }) => {
      if (current !== expected) {
        console.log(`⚠️  Production warning: ${message}`);
        console.log(`   Current: ${current || 'undefined'}, Expected: ${expected}`);
        productionIssues++;
      }
    });
    
    if (productionIssues > 0) {
      console.log(`\n📋 ${productionIssues} production environment warnings found`);
    }
  }
  
  return result;
}

// Export for use in other scripts
export { validateEnvironment, validateForDeployment };

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2] || 'production';
  validateForDeployment(target);
}