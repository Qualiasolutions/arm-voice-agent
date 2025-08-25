// Direct HTTP Search - Fallback when MCP tools aren't available
// Simple HTTP-based product search for armenius.com.cy

import https from 'https';

// Simple product search using basic HTTP requests with native https module
export async function searchArmeniusDirectly(query, maxResults = 3) {
  console.log(`🔍 Direct HTTP search for: "${query}"`);
  
  try {
    // Build search URL for armenius.com.cy (with /en/ path)
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://armenius.com.cy/en/search?q=${encodedQuery}`;
    
    console.log(`🌐 Searching URL: ${searchUrl}`);
    
    // Use native https module for better compatibility
    const html = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'armenius.com.cy',
        path: `/en/search?q=${encodedQuery}`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Armenius-Voice-Assistant/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          console.warn(`⚠️ HTTP ${res.statusCode}: ${res.statusMessage}`);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
    console.log(`✅ Retrieved ${html.length} characters of HTML`);
    
    // Parse HTML for product information
    const products = parseProductHTML(html, query, maxResults);
    
    if (products.length > 0) {
      console.log(`🎯 Found ${products.length} products via direct search`);
      return products;
    } else {
      console.log('❌ No products found in HTML parsing');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Direct HTTP search failed:', error.message);
    return null;
  }
}

// Simple HTML parsing for product information
function parseProductHTML(html, originalQuery, maxResults) {
  const products = [];
  
  try {
    // Simple regex patterns to extract product info
    // These patterns are generic and may need adjustment based on armenius.com.cy structure
    
    // Look for product titles using the exact pattern from armenius.com.cy
    const titlePatterns = [
      /product-title"[^>]*><a[^>]*>([^<]+(?:RTX[^<]*)?)/gi,
      /<h3[^>]*product-title[^>]*><a[^>]*>([^<]+)/gi,
      /href="[^"]*\/[^"]*"[^>]*>([^<]*(?:RTX|Gaming|PC|Laptop)[^<]*)/gi
    ];
    
    // Look for prices in armenius.com.cy structure
    const pricePatterns = [
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>€([0-9,]+\.?[0-9]*)</gi,
      /€\s*([0-9,]+\.?[0-9]*)/gi,
      /([0-9,]+\.?[0-9]*)\s*€/gi,
      /"price":[^}]*"amount":([0-9,]+\.?[0-9]*)/gi
    ];
    
    // Extract product titles with better filtering
    const foundTitles = [];
    const queryLower = originalQuery.toLowerCase();
    
    for (const pattern of titlePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && foundTitles.length < maxResults * 3) {
        const title = match[1].trim();
        if (title.length > 3 && !foundTitles.includes(title)) {
          // Prioritize products that contain the search query
          if (title.toLowerCase().includes(queryLower) || 
              title.toLowerCase().includes('rtx') || 
              title.toLowerCase().includes('gaming') ||
              title.toLowerCase().includes('pc') ||
              title.toLowerCase().includes('laptop')) {
            foundTitles.unshift(title); // Add to beginning for priority
          } else {
            foundTitles.push(title);
          }
        }
      }
    }
    
    // Extract prices
    const foundPrices = [];
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && foundPrices.length < maxResults * 2) {
        const priceStr = match[1].replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (price > 0 && price < 10000) { // Reasonable price range
          foundPrices.push(price);
        }
      }
    }
    
    // Combine titles and prices
    const minItems = Math.min(foundTitles.length, maxResults);
    for (let i = 0; i < minItems; i++) {
      const product = {
        name: foundTitles[i],
        price: foundPrices[i] || null,
        source: 'armenius_direct_http',
        inStock: true, // Assume in stock if found on page
        relevance: calculateSimpleRelevance(foundTitles[i], originalQuery),
        searchMethod: 'direct_http'
      };
      
      products.push(product);
    }
    
    // Sort by relevance
    products.sort((a, b) => b.relevance - a.relevance);
    
    // If we didn't find much, create a simple response
    if (products.length === 0 && (foundTitles.length > 0 || foundPrices.length > 0)) {
      products.push({
        name: `${originalQuery} related products`,
        price: foundPrices[0] || null,
        source: 'armenius_direct_http',
        inStock: true,
        relevance: 0.5,
        searchMethod: 'direct_http',
        note: 'Basic search results - call for details'
      });
    }
    
  } catch (error) {
    console.error('❌ HTML parsing error:', error);
  }
  
  return products.slice(0, maxResults);
}

// Simple relevance calculation
function calculateSimpleRelevance(productTitle, query) {
  const titleLower = productTitle.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (titleLower.includes(queryLower)) {
    return 1.0;
  }
  
  // Check individual query words
  const queryWords = queryLower.split(/\s+/);
  let matchCount = 0;
  
  for (const word of queryWords) {
    if (word.length > 2 && titleLower.includes(word)) {
      matchCount++;
    }
  }
  
  return matchCount / queryWords.length;
}

// Export for use in other functions
export default {
  searchArmeniusDirectly,
  parseProductHTML,
  calculateSimpleRelevance
};