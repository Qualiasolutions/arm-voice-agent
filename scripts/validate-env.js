#!/usr/bin/env node

/**
 * Environment validation script for Armenius Voice Assistant
 * This script validates that all required environment variables are properly set
 */

import { createClient } from '@supabase/supabase-js';

const requiredEnvVars = {
  // Core Vapi.ai Configuration
  VAPI_API_KEY: 'Vapi.ai API key for voice services',
  VAPI_SERVER_SECRET: 'Webhook secret for Vapi.ai security',
  
  // Supabase Database
  SUPABASE_URL: 'Supabase project URL',
  SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (for admin operations)',
  
  // AI Services
  OPENAI_API_KEY: 'OpenAI API key for GPT models',
  DEEPGRAM_API_KEY: 'Deepgram API key for speech-to-text',
  
  // Caching & Performance
  UPSTASH_REDIS_REST_URL: 'Upstash Redis URL for caching',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis authentication token',
  
  // Optional: Phone Services
  TWILIO_ACCOUNT_SID: 'Twilio account SID (optional)',
  TWILIO_AUTH_TOKEN: 'Twilio auth token (optional)'
};

const optionalEnvVars = {
  NODE_ENV: 'Environment (development/production)',
  MAX_CALL_DURATION_MINUTES: 'Maximum call duration in minutes',
  VERCEL_REGION: 'Vercel deployment region'
};

console.log('🔍 Environment Validation for Armenius Voice Assistant\n');

let hasErrors = false;
let hasWarnings = false;

// Check required environment variables
console.log('📋 Required Environment Variables:');
for (const [varName, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN') 
    ? `${value.substring(0, 8)}...` 
    : value) : 'MISSING';
  
  console.log(`  ${status} ${varName}: ${display}`);
  if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN')) {
    console.log(`     └── ${description}`);
  }
  
  if (!value) {
    hasErrors = true;
  }
}

console.log('\n📋 Optional Environment Variables:');
for (const [varName, description] of Object.entries(optionalEnvVars)) {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const display = value || 'NOT SET';
  
  console.log(`  ${status} ${varName}: ${display}`);
  console.log(`     └── ${description}`);
  
  if (!value) {
    hasWarnings = true;
  }
}

// Test database connection if credentials are available
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  console.log('\n🗄️ Testing Database Connection...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ Database connection failed: ${error.message}`);
      hasErrors = true;
    } else {
      console.log(`  ✅ Database connection successful`);
      console.log(`  📊 Found ${data?.length || 0} product records`);
      if (data && data.length > 0) {
        console.log(`  🏷️ Sample products: ${data.map(p => p.name).join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Database connection error: ${error.message}`);
    hasErrors = true;
  }
} else {
  console.log('\n🗄️ Skipping database test (missing credentials)');
}

// Summary
console.log('\n📊 Validation Summary:');
if (hasErrors) {
  console.log('  ❌ CRITICAL: Missing required environment variables');
  console.log('  ⚠️  System will not function properly in production');
  process.exit(1);
} else {
  console.log('  ✅ All required environment variables are present');
  
  if (hasWarnings) {
    console.log('  ⚠️  Some optional variables are missing (system will still work)');
  }
  
  console.log('  🎉 Environment configuration looks good!');
}

console.log('\n💡 To set missing variables in Vercel:');
console.log('   1. Go to your Vercel dashboard');
console.log('   2. Navigate to Project Settings → Environment Variables');
console.log('   3. Add the missing variables with their proper values');
console.log('   4. Redeploy the application');