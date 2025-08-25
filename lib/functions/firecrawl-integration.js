// Firecrawl Integration for Armenius Store Product Data
// Handles automated web scraping of armenius.com.cy for product updates

import { db } from '../supabase/client.js';
import { generateFirecrawlScrapingConfig } from '../../config/mcp-config.js';

// Main function to scrape and update product data from armenius.com.cy
export async function scrapeArmeniusProducts(options = {}) {
  console.log('🔍 Starting Firecrawl product scraping for armenius.com.cy...');
  
  try {
    const scrapingConfig = generateFirecrawlScrapingConfig();
    const { armenius } = scrapingConfig;
    
    // If running in MCP context, use firecrawl tools directly
    if (global.mcpTools && global.mcpTools.firecrawl_batch_scrape) {
      return await scrapeWithFirecrawlMCP(armenius, options);
    }
    
    // Fallback: Direct API approach (requires FIRECRAWL_API_KEY)
    return await scrapeWithDirectAPI(armenius, options);
    
  } catch (error) {
    console.error('❌ Firecrawl product scraping failed:', error);
    return {
      success: false,
      error: error.message,
      productsScraped: 0,
      productsUpdated: 0
    };
  }
}

// Scrape using Firecrawl MCP tools
async function scrapeWithFirecrawlMCP(config, options) {
  console.log('🔗 Using Firecrawl MCP tools for scraping...');
  
  // Generate URLs to scrape
  const urlsToScrape = config.productPages.map(page => 
    `${config.baseUrl}${page}`
  );
  
  try {
    // Use batch scraping for efficiency
    const scrapeResult = await global.mcpTools.firecrawl_batch_scrape({
      urls: urlsToScrape,
      options: config.scrapingOptions
    });
    
    if (!scrapeResult.success) {
      throw new Error(`Batch scraping failed: ${scrapeResult.error}`);
    }
    
    console.log(`✅ Scraped ${scrapeResult.results.length} pages`);
    
    // Extract structured product data
    const productData = [];
    for (const result of scrapeResult.results) {
      if (result.success && result.content) {
        const products = await extractProductsFromContent(result.content, config);
        productData.push(...products);
      }
    }
    
    // Update database with new product data
    const updateResult = await updateProductDatabase(productData, options);
    
    return {
      success: true,
      productsScraped: productData.length,
      productsUpdated: updateResult.updated,
      productsCreated: updateResult.created,
      scrapingMethod: 'firecrawl_mcp',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ MCP scraping failed:', error);
    throw error;
  }
}

// Fallback: Direct Firecrawl API approach
async function scrapeWithDirectAPI(config, options) {
  console.log('🌐 Using direct Firecrawl API...');
  
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable not set');
  }
  
  // Implementation would use Firecrawl's REST API
  // This is a placeholder for the direct API approach
  console.log('⚠️  Direct API scraping not yet implemented');
  console.log('💡 Please use Firecrawl MCP integration for best results');
  
  return {
    success: false,
    error: 'Direct API scraping not implemented. Use Firecrawl MCP instead.',
    productsScraped: 0,
    productsUpdated: 0
  };
}

// Extract product information from scraped content
async function extractProductsFromContent(content, config) {
  const products = [];
  
  try {
    // Use Firecrawl's extract tool if available
    if (global.mcpTools && global.mcpTools.firecrawl_extract) {
      const extractResult = await global.mcpTools.firecrawl_extract({
        content: content,
        schema: config.extractionSchema,
        prompt: "Extract product information including name, price, description, SKU, category, and stock quantity from this electronics store page"
      });
      
      if (extractResult.success && extractResult.data) {
        products.push(...extractResult.data);
      }
    } else {
      // Fallback: Basic regex-based extraction
      products.push(...extractProductsWithRegex(content));
    }
    
  } catch (error) {
    console.error('Error extracting products from content:', error);
  }
  
  return products;
}

// Basic product extraction using regex patterns
function extractProductsWithRegex(content) {
  const products = [];
  
  // This is a simplified extraction - real implementation would be more sophisticated
  const productPatterns = {
    name: /product[_-]name["\s]*:?\s*["']([^"']+)["']/gi,
    price: /price["\s]*:?\s*["']?([0-9,.]+ ?€?)["']?/gi,
    sku: /sku["\s]*:?\s*["']([A-Z0-9-]+)["']/gi
  };
  
  // Extract basic product info using patterns
  let nameMatch, priceMatch, skuMatch;
  let index = 0;
  
  while ((nameMatch = productPatterns.name.exec(content)) && index < 50) {
    const product = {
      name: nameMatch[1].trim(),
      price: null,
      sku: null,
      description: null,
      category: 'Electronics',
      stock_quantity: 1
    };
    
    // Try to find corresponding price
    priceMatch = productPatterns.price.exec(content);
    if (priceMatch) {
      product.price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''));
    }
    
    // Try to find corresponding SKU
    skuMatch = productPatterns.sku.exec(content);
    if (skuMatch) {
      product.sku = skuMatch[1];
    }
    
    if (product.name && product.price) {
      products.push(product);
    }
    
    index++;
  }
  
  return products;
}

// Update product database with scraped data
async function updateProductDatabase(products, options = {}) {
  let created = 0;
  let updated = 0;
  
  console.log(`📊 Updating database with ${products.length} products...`);
  
  for (const productData of products) {
    try {
      // Check if product already exists
      const existingProduct = await db.searchProducts(productData.name, { limit: 1 });
      
      if (existingProduct.length > 0) {
        // Update existing product
        const result = await db.supabase
          .from('products')
          .update({
            price: productData.price,
            description: productData.description || existingProduct[0].description,
            stock_quantity: productData.stock_quantity || existingProduct[0].stock_quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct[0].id);
        
        if (!result.error) {
          updated++;
        }
      } else if (!options.updateOnly) {
        // Create new product
        const result = await db.supabase
          .from('products')
          .insert({
            name: productData.name,
            name_el: productData.name, // Greek translation would be added here
            price: productData.price,
            description: productData.description || `Product from armenius.com.cy: ${productData.name}`,
            description_el: productData.description || `Προϊόν από armenius.com.cy: ${productData.name}`,
            sku: productData.sku || `ARM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            category: productData.category || 'Electronics',
            category_el: productData.category || 'Ηλεκτρονικά',
            stock_quantity: productData.stock_quantity || 1,
            is_active: true,
            created_at: new Date().toISOString()
          });
        
        if (!result.error) {
          created++;
        }
      }
      
    } catch (error) {
      console.error(`Error updating product ${productData.name}:`, error);
    }
  }
  
  console.log(`✅ Database updated: ${created} created, ${updated} updated`);
  
  return { created, updated };
}

// Schedule regular product updates
export async function scheduleProductUpdates() {
  console.log('⏰ Setting up scheduled product updates...');
  
  // This would typically be called by a cron job
  // For now, it's a manual trigger function
  
  const result = await scrapeArmeniusProducts({
    updateOnly: false, // Allow creating new products
    maxProducts: 100   // Limit to avoid overwhelming the system
  });
  
  // Log the results to analytics
  if (db.trackEvent) {
    await db.trackEvent({
      event_type: 'product_scraping_completed',
      properties: result,
      timestamp: new Date().toISOString()
    });
  }
  
  return result;
}

export default {
  scrapeArmeniusProducts,
  scheduleProductUpdates,
  // Export for use in voice functions
  execute: async (params, context) => {
    const { action = 'scrape', ...options } = params;
    
    switch (action) {
      case 'scrape':
        return await scrapeArmeniusProducts(options);
      case 'schedule':
        return await scheduleProductUpdates();
      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use 'scrape' or 'schedule'.`
        };
    }
  },
  
  // Caching configuration
  ttl: 3600, // 1 hour - product data doesn't change too frequently
  cacheable: true,
  fallbackResponse: "I'm having trouble updating our product information right now. Let me check our current inventory instead."
};