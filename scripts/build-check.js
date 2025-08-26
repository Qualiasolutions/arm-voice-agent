#!/usr/bin/env node

/**
 * Build verification script for Armenius Voice Assistant
 * Ensures all components are ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔍 Build Verification for Armenius Voice Assistant\n');

let hasErrors = false;
let hasWarnings = false;

// Check root package.json
console.log('📦 Checking Root Package Configuration...');
const rootPackageJson = path.join(rootDir, 'package.json');
if (fs.existsSync(rootPackageJson)) {
  const pkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
  console.log(`  ✅ Root package: ${pkg.name}@${pkg.version}`);
  
  // Check for required dependencies
  const requiredDeps = ['@supabase/supabase-js', 'openai', '@upstash/redis'];
  for (const dep of requiredDeps) {
    if (pkg.dependencies?.[dep]) {
      console.log(`  ✅ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`  ❌ Missing dependency: ${dep}`);
      hasErrors = true;
    }
  }
} else {
  console.log('  ❌ Missing root package.json');
  hasErrors = true;
}

// Check frontend package.json
console.log('\n📦 Checking Frontend Package Configuration...');
const frontendPackageJson = path.join(rootDir, 'frontend', 'package.json');
if (fs.existsSync(frontendPackageJson)) {
  const pkg = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
  console.log(`  ✅ Frontend package: ${pkg.name}@${pkg.version}`);
  
  // Check for Vapi SDK
  if (pkg.dependencies?.['@vapi-ai/web']) {
    console.log(`  ✅ @vapi-ai/web: ${pkg.dependencies['@vapi-ai/web']}`);
  } else {
    console.log('  ❌ Missing @vapi-ai/web dependency');
    hasErrors = true;
  }
  
  // Check for React and TypeScript
  const frontendDeps = ['react', 'react-dom', 'typescript', 'vite'];
  for (const dep of frontendDeps) {
    if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
      const version = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
      console.log(`  ✅ ${dep}: ${version}`);
    } else {
      console.log(`  ❌ Missing dependency: ${dep}`);
      hasErrors = true;
    }
  }
} else {
  console.log('  ❌ Missing frontend/package.json');
  hasErrors = true;
}

// Check if frontend is built
console.log('\n🏗️ Checking Frontend Build...');
const frontendDist = path.join(rootDir, 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  const indexHtml = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('  ✅ Frontend build exists (dist/index.html)');
    
    // Check for JavaScript assets
    const assetsDir = path.join(frontendDist, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assets = fs.readdirSync(assetsDir);
      const jsAssets = assets.filter(f => f.endsWith('.js'));
      const cssAssets = assets.filter(f => f.endsWith('.css'));
      
      console.log(`  ✅ Found ${jsAssets.length} JavaScript assets`);
      console.log(`  ✅ Found ${cssAssets.length} CSS assets`);
      
      if (jsAssets.length === 0) {
        console.log('  ⚠️  No JavaScript assets found - this might indicate a build issue');
        hasWarnings = true;
      }
    } else {
      console.log('  ⚠️  No assets directory found');
      hasWarnings = true;
    }
  } else {
    console.log('  ❌ Frontend build incomplete (no index.html)');
    hasErrors = true;
  }
} else {
  console.log('  ⚠️  Frontend not built yet - run `npm run build` first');
  hasWarnings = true;
}

// Check API structure
console.log('\n🔌 Checking API Structure...');
const apiDir = path.join(rootDir, 'api');
if (fs.existsSync(apiDir)) {
  console.log('  ✅ API directory exists');
  
  // Check main webhook handler
  const webhookHandler = path.join(apiDir, 'vapi.js');
  if (fs.existsSync(webhookHandler)) {
    console.log('  ✅ Main webhook handler exists (api/vapi.js)');
  } else {
    console.log('  ❌ Missing main webhook handler');
    hasErrors = true;
  }
  
  // Check health endpoint
  const healthCheck = path.join(apiDir, 'vapi', 'health.js');
  if (fs.existsSync(healthCheck)) {
    console.log('  ✅ Health check endpoint exists');
  } else {
    console.log('  ❌ Missing health check endpoint');
    hasErrors = true;
  }
} else {
  console.log('  ❌ Missing API directory');
  hasErrors = true;
}

// Check function registry
console.log('\n🔧 Checking Function Registry...');
const functionsDir = path.join(rootDir, 'lib', 'functions');
if (fs.existsSync(functionsDir)) {
  const functionRegistry = path.join(functionsDir, 'index.js');
  if (fs.existsSync(functionRegistry)) {
    console.log('  ✅ Function registry exists');
    
    // Count function files
    const functionFiles = fs.readdirSync(functionsDir).filter(f => 
      f.endsWith('.js') && f !== 'index.js'
    );
    console.log(`  ✅ Found ${functionFiles.length} function modules`);
    
    if (functionFiles.length < 5) {
      console.log('  ⚠️  Expected at least 5 voice functions');
      hasWarnings = true;
    }
  } else {
    console.log('  ❌ Missing function registry (lib/functions/index.js)');
    hasErrors = true;
  }
} else {
  console.log('  ❌ Missing functions directory');
  hasErrors = true;
}

// Check Vercel configuration
console.log('\n⚡ Checking Vercel Configuration...');
const vercelConfig = path.join(rootDir, 'vercel.json');
if (fs.existsSync(vercelConfig)) {
  const config = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
  console.log('  ✅ vercel.json exists');
  
  if (config.outputDirectory === 'frontend/dist') {
    console.log('  ✅ Output directory correctly set to frontend/dist');
  } else {
    console.log(`  ❌ Wrong output directory: ${config.outputDirectory}`);
    hasErrors = true;
  }
  
  if (config.buildCommand?.includes('frontend')) {
    console.log('  ✅ Build command includes frontend build');
  } else {
    console.log('  ❌ Build command missing frontend build');
    hasErrors = true;
  }
} else {
  console.log('  ❌ Missing vercel.json');
  hasErrors = true;
}

// Summary
console.log('\n📊 Build Verification Summary:');
if (hasErrors) {
  console.log('  ❌ CRITICAL: Build verification failed');
  console.log('  ⚠️  Deployment will likely fail');
  process.exit(1);
} else {
  console.log('  ✅ Build verification passed');
  
  if (hasWarnings) {
    console.log('  ⚠️  Some warnings detected (deployment should still work)');
  }
  
  console.log('  🎉 Ready for deployment!');
}

console.log('\n💡 Next steps:');
console.log('   1. Run `npm run build` to build the frontend');
console.log('   2. Run `npm run validate-env` to check environment variables');
console.log('   3. Deploy with `vercel --prod` or `git push origin main`');