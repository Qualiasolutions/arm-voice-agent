#!/usr/bin/env node

// Test script to validate MCP setup for Armenius Store
// This script tests both Vapi MCP (Zapier) and Firecrawl MCP integrations

import { validateGlobalMcpConfig, generateFirecrawlScrapingConfig } from '../config/mcp-config.js';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

console.log('🧪 Testing MCP Setup for Armenius Store Voice Assistant');
console.log('=' .repeat(60));

// Test 1: Validate Global MCP Configuration
console.log('\n1️⃣  Testing Global MCP Configuration...');
try {
  await validateGlobalMcpConfig();
} catch (error) {
  console.error('❌ Global MCP config test failed:', error.message);
}

// Test 2: Check if Firecrawl MCP is installed and accessible
console.log('\n2️⃣  Testing Firecrawl MCP Installation...');
try {
  const firecrawlTest = spawn('npx', ['-y', 'firecrawl-mcp', '--version'], {
    stdio: 'pipe',
    env: { ...process.env, FIRECRAWL_API_KEY: 'test-key' }
  });
  
  let output = '';
  firecrawlTest.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  firecrawlTest.on('close', (code) => {
    if (code === 0 || output.includes('firecrawl')) {
      console.log('✅ Firecrawl MCP is available via npx');
    } else {
      console.log('⚠️  Firecrawl MCP may have issues, but npx can install it on-demand');
    }
  });
  
  // Give it a moment to respond
  setTimeout(() => {
    try {
      firecrawlTest.kill();
    } catch (e) {
      // Ignore kill errors
    }
  }, 3000);
  
} catch (error) {
  console.log('⚠️  Could not test Firecrawl MCP directly, but npx should handle installation');
}

// Test 3: Validate Firecrawl scraping configuration
console.log('\n3️⃣  Testing Firecrawl Scraping Configuration...');
try {
  const scrapingConfig = generateFirecrawlScrapingConfig();
  console.log('✅ Firecrawl scraping config generated successfully');
  console.log(`   📝 Target site: ${scrapingConfig.armenius.baseUrl}`);
  console.log(`   📋 Pages to scrape: ${scrapingConfig.armenius.productPages.length} pages`);
  console.log(`   🔧 Extract schema: ${Object.keys(scrapingConfig.armenius.extractionSchema.properties).length} properties`);
} catch (error) {
  console.error('❌ Firecrawl config generation failed:', error.message);
}

// Test 4: Check MCP integration in Vapi assistant config
console.log('\n4️⃣  Testing Vapi Assistant MCP Integration...');
try {
  const vapiConfigPath = './config/vapi-assistant.js';
  if (existsSync(vapiConfigPath)) {
    const { default: vapiConfig } = await import('../config/vapi-assistant.js');
    
    // Check if MCP tools are configured
    const hasMcpTools = vapiConfig.tools && vapiConfig.tools.some(tool => tool.type === 'mcp');
    
    if (hasMcpTools) {
      console.log('✅ Vapi assistant has MCP tools configured');
      const mcpTools = vapiConfig.tools.filter(tool => tool.type === 'mcp');
      console.log(`   🔧 MCP tools configured: ${mcpTools.length}`);
    } else {
      console.log('⚠️  Vapi assistant may not have MCP tools configured yet');
    }
  } else {
    console.log('⚠️  Vapi assistant config not found');
  }
} catch (error) {
  console.error('❌ Vapi config test failed:', error.message);
}

// Test 5: Validate project dependencies
console.log('\n5️⃣  Testing Project Dependencies...');
try {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const hasMcpSdk = packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk'];
  
  if (hasMcpSdk) {
    console.log('✅ MCP SDK dependency found');
    console.log(`   📦 Version: ${packageJson.dependencies['@modelcontextprotocol/sdk']}`);
  } else {
    console.log('⚠️  MCP SDK not found in dependencies (may use global installation)');
  }
} catch (error) {
  console.error('❌ Package.json validation failed:', error.message);
}

// Summary and Next Steps
console.log('\n📋 Summary and Next Steps:');
console.log('=' .repeat(60));

const globalConfigPath = join(homedir(), '.config', 'vapi', '.env.mcp');
if (existsSync(globalConfigPath)) {
  const configContent = readFileSync(globalConfigPath, 'utf8');
  
  if (configContent.includes('ZAPIER_MCP_TOKEN')) {
    console.log('✅ Zapier MCP: Ready to use');
  } else {
    console.log('⚠️  Zapier MCP: Add ZAPIER_MCP_TOKEN to ~/.config/vapi/.env.mcp');
  }
  
  if (configContent.includes('FIRECRAWL_API_KEY')) {
    console.log('✅ Firecrawl MCP: Ready to scrape armenius.com.cy');
  } else {
    console.log('⚠️  Firecrawl MCP: Add FIRECRAWL_API_KEY to ~/.config/vapi/.env.mcp');
    console.log('   💡 Get your key from: https://www.firecrawl.dev/app/api-keys');
  }
} else {
  console.log('❌ Global MCP config not found');
  console.log('   💡 Create ~/.config/vapi/.env.mcp with:');
  console.log('      ZAPIER_MCP_TOKEN=your_zapier_token');
  console.log('      FIRECRAWL_API_KEY=fc-your_firecrawl_key');
}

console.log('\n🚀 To test product scraping:');
console.log('   1. Add FIRECRAWL_API_KEY to ~/.config/vapi/.env.mcp');
console.log('   2. Run: npm test mcp-integration.test.js');
console.log('   3. Or manual test: curl /api/cron/product-sync');

console.log('\n✨ MCP Setup Test Complete');

// Exit after a brief pause to let async operations complete
setTimeout(() => {
  process.exit(0);
}, 1000);