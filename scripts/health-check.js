#!/usr/bin/env node

/**
 * Health check script for monitoring deployment status
 */

import https from 'https';
import http from 'http';

const BASE_URL = process.argv[2] || process.env.VERCEL_URL || 'https://armenius.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Health-Check-Script/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

async function checkEndpoint(name, path, expectedStatus = 200) {
  const url = `${BASE_URL}${path}`;
  
  try {
    console.log(`🔍 Checking ${name}: ${url}`);
    const startTime = Date.now();
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (response.statusCode === expectedStatus) {
      console.log(`   ✅ ${name} - OK (${response.statusCode}, ${duration}ms)`);
      return { success: true, duration, status: response.statusCode };
    } else {
      console.log(`   ❌ ${name} - Unexpected status: ${response.statusCode} (expected ${expectedStatus})`);
      return { success: false, duration, status: response.statusCode, expectedStatus };
    }
  } catch (error) {
    console.log(`   ❌ ${name} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runHealthChecks() {
  console.log(`🏥 Running health checks for: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  const checks = [
    { name: 'Frontend (Root)', path: '/' },
    { name: 'API Health Check', path: '/api/vapi/health' },
    { name: 'Webhook Endpoint', path: '/api/vapi', expectedStatus: 400 }, // Expected to fail without proper payload
    { name: 'Function Registry', path: '/api/vapi/health' }, // Re-check with different expectation
  ];
  
  const results = [];
  let totalDuration = 0;
  
  for (const check of checks) {
    const result = await checkEndpoint(
      check.name, 
      check.path, 
      check.expectedStatus
    );
    
    results.push({
      ...check,
      ...result
    });
    
    if (result.duration) {
      totalDuration += result.duration;
    }
    
    // Small delay between checks
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = ((successful / total) * 100).toFixed(1);
  
  console.log(`✅ Successful: ${successful}/${total} (${successRate}%)`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  if (successful === total) {
    console.log('\n🎉 All health checks passed! System is healthy.');
  } else {
    console.log('\n⚠️  Some health checks failed. Please investigate:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   • ${r.name}: ${r.error || `Status ${r.status} (expected ${r.expectedStatus})`}`);
      });
  }
  
  console.log('='.repeat(60));
  
  return {
    success: successful === total,
    successRate,
    total,
    successful,
    results,
    totalDuration
  };
}

// Continuous monitoring mode
async function monitor(interval = 60000) {
  console.log(`🔄 Starting continuous monitoring (${interval/1000}s intervals)`);
  console.log('Press Ctrl+C to stop\n');
  
  let consecutiveFailures = 0;
  const maxFailures = 3;
  
  while (true) {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Running health checks...`);
    
    try {
      const result = await runHealthChecks();
      
      if (result.success) {
        consecutiveFailures = 0;
        console.log('💚 System healthy');
      } else {
        consecutiveFailures++;
        console.log(`🔴 System unhealthy (${consecutiveFailures}/${maxFailures} consecutive failures)`);
        
        if (consecutiveFailures >= maxFailures) {
          console.log('🚨 ALERT: Maximum consecutive failures reached!');
          // In production, this would trigger alerts/notifications
        }
      }
    } catch (error) {
      console.error('❌ Health check error:', error.message);
      consecutiveFailures++;
    }
    
    console.log(`⏳ Waiting ${interval/1000}s for next check...`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

async function main() {
  const mode = process.argv[3] || 'check';
  
  if (mode === 'monitor') {
    const interval = parseInt(process.argv[4]) || 60000;
    await monitor(interval);
  } else {
    const result = await runHealthChecks();
    process.exit(result.success ? 0 : 1);
  }
}

// Export for use in other scripts
export { runHealthChecks, checkEndpoint };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}