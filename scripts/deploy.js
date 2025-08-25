#!/usr/bin/env node

/**
 * Automated deployment script with comprehensive checks
 */

import { execSync } from 'child_process';
import { validateForDeployment } from './validate-env.js';

const TARGET_ENV = process.argv[2] || 'production';

function logStep(step, message) {
  console.log(`\n🚀 [${step.toUpperCase()}] ${message}`);
}

function runCommand(command, description) {
  try {
    console.log(`   Running: ${description}`);
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    console.log(`   ✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`   ❌ ${description} failed:`);
    console.error(`   Error: ${error.message}`);
    if (error.stdout) console.log(`   stdout: ${error.stdout}`);
    if (error.stderr) console.error(`   stderr: ${error.stderr}`);
    process.exit(1);
  }
}

async function deployToVercel() {
  console.log('🎯 Starting deployment to Vercel...\n');

  // Step 1: Environment validation
  logStep('VALIDATION', 'Validating environment variables');
  const envResult = validateForDeployment(TARGET_ENV);
  if (!envResult.valid) {
    console.error('❌ Environment validation failed. Please fix the issues above.');
    process.exit(1);
  }

  // Step 2: Code quality checks
  logStep('QUALITY', 'Running code quality checks');
  runCommand('npm run lint', 'ESLint check');
  runCommand('npm run type-check', 'TypeScript check');

  // Step 3: Testing
  logStep('TESTING', 'Running test suite');
  runCommand('npm run test tests/simple.test.js', 'Basic tests');

  // Step 4: Build verification  
  logStep('BUILD', 'Verifying build process');
  runCommand('cd frontend && npm run build', 'Frontend build');

  // Step 5: Security audit
  logStep('SECURITY', 'Running security audit');
  try {
    runCommand('npm audit --audit-level=moderate', 'Security audit');
  } catch (error) {
    console.log('⚠️  Security audit found issues, but continuing deployment...');
  }

  // Step 6: Deploy to Vercel
  logStep('DEPLOYMENT', `Deploying to ${TARGET_ENV}`);
  
  let deployCommand = 'vercel deploy';
  if (TARGET_ENV === 'production') {
    deployCommand += ' --prod';
  }

  const deployOutput = runCommand(deployCommand, 'Vercel deployment');
  
  // Extract deployment URL
  const deployUrl = deployOutput.trim().split('\n').pop();
  console.log(`\n🎉 Deployment successful!`);
  console.log(`📍 Deployment URL: ${deployUrl}`);

  // Step 7: Health check
  logStep('VERIFICATION', 'Running post-deployment health check');
  
  // Wait a bit for deployment to be ready
  console.log('   Waiting 30 seconds for deployment to be ready...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    runCommand(`curl -f ${deployUrl}/api/vapi/health`, 'Health check');
    console.log('\n✅ All checks passed! Deployment is healthy.');
  } catch (error) {
    console.log('\n⚠️  Health check failed, but deployment completed.');
    console.log('   Please manually verify the deployment at:', deployUrl);
  }

  return deployUrl;
}

async function main() {
  try {
    console.log(`🚀 Automated Deployment Script for ${TARGET_ENV.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const deploymentUrl = await deployToVercel();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Environment: ${TARGET_ENV}`);
    console.log(`URL: ${deploymentUrl}`);
    console.log(`Health Check: ${deploymentUrl}/api/vapi/health`);
    console.log(`Dashboard: ${deploymentUrl}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { deployToVercel };