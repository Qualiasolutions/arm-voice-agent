// Automated Product Synchronization Cron Job
// Scrapes armenius.com.cy using Firecrawl MCP and updates product database

import { scrapeArmeniusProducts } from '../../lib/functions/firecrawl-integration.js';
import { db } from '../../lib/supabase/client.js';

export async function GET(request) {
  console.log('🔄 Starting automated product synchronization...');
  
  const startTime = Date.now();
  
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Run the product scraping
    const scrapeResult = await scrapeArmeniusProducts({
      updateOnly: false,          // Allow creating new products
      maxProducts: 200,           // Reasonable limit
      batchSize: 10,             // Process in batches
      respectRateLimit: true      // Be gentle with armenius.com.cy
    });
    
    const duration = Date.now() - startTime;
    
    // Log the results
    console.log('✅ Product sync completed:', {
      success: scrapeResult.success,
      productsScraped: scrapeResult.productsScraped,
      productsUpdated: scrapeResult.productsUpdated,
      productsCreated: scrapeResult.productsCreated,
      duration: `${duration}ms`,
      method: scrapeResult.scrapingMethod
    });
    
    // Track the sync event in analytics
    await db.trackEvent({
      event_type: 'automated_product_sync',
      properties: {
        ...scrapeResult,
        duration_ms: duration,
        triggered_by: 'cron_job'
      },
      timestamp: new Date().toISOString()
    });
    
    // Send success response
    return new Response(JSON.stringify({
      success: true,
      message: `Product sync completed successfully`,
      results: {
        productsScraped: scrapeResult.productsScraped,
        productsUpdated: scrapeResult.productsUpdated,
        productsCreated: scrapeResult.productsCreated,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('❌ Product sync failed:', error);
    
    // Track the failure
    await db.trackEvent({
      event_type: 'automated_product_sync_failed',
      properties: {
        error: error.message,
        duration_ms: Date.now() - startTime,
        triggered_by: 'cron_job'
      },
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Support POST requests as well (for manual triggering)
export async function POST(request) {
  return GET(request);
}

export const config = {
  runtime: 'edge'
};