// Firecrawl Client for Armenius Store Live Product Fetching
// Direct API integration for real-time product data from armenius.com.cy

import FirecrawlApp from '@mendable/firecrawl-js';

class ArmeniusFirecrawlClient {
  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY;
    this.client = null;
    this.initialized = false;
    
    if (!this.apiKey) {
      console.warn('⚠️ FIRECRAWL_API_KEY not found in environment variables');
    }
  }

  async init() {
    if (this.initialized) return true;

    if (!this.apiKey) {
      console.error('❌ Cannot initialize Firecrawl client: API key missing');
      return false;
    }

    try {
      this.client = new FirecrawlApp({ apiKey: this.apiKey });
      this.initialized = true;
      console.log('✅ Firecrawl client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firecrawl client:', error);
      return false;
    }
  }

  async searchArmeniusProducts(query, maxResults = 5) {
    await this.init();
    
    if (!this.initialized) {
      throw new Error('Firecrawl client not initialized');
    }

    try {
      console.log(`🔍 Firecrawl search: "${query}" on armenius.com.cy`);
      
      // Use site-specific search with optimized query
      const searchQuery = `"${query}" OR ${query} site:armenius.com.cy graphics card GPU computer`;
      
      const searchResult = await this.client.search(searchQuery, {
        limit: maxResults,
        scrapeOptions: {
          formats: ['markdown', 'links'],
          onlyMainContent: true,
          waitFor: 1000,
          timeout: 15000
        }
      });

      if (!searchResult.success) {
        throw new Error(`Search failed: ${searchResult.error}`);
      }

      console.log(`✅ Found ${searchResult.data?.length || 0} results from Firecrawl`);
      
      // Parse and format results for voice assistant
      const products = this.parseSearchResults(searchResult.data, query);
      
      return {
        success: true,
        products: products,
        source: 'firecrawl_live',
        totalResults: searchResult.data?.length || 0
      };

    } catch (error) {
      console.error('❌ Firecrawl search error:', error);
      
      return {
        success: false,
        products: [],
        error: error.message,
        source: 'firecrawl_failed'
      };
    }
  }

  async scrapeProductPage(url) {
    await this.init();
    
    if (!this.initialized) {
      throw new Error('Firecrawl client not initialized');
    }

    try {
      console.log(`🕷️ Scraping product page: ${url}`);
      
      const scrapeResult = await this.client.scrapeUrl(url, {
        formats: ['markdown', 'json'],
        onlyMainContent: true,
        waitFor: 2000,
        timeout: 20000,
        jsonOptions: {
          prompt: `Extract product information including:
          - Product name and model
          - Price in EUR (€)
          - Availability/stock status
          - Key specifications
          - Product category`
        }
      });

      if (!scrapeResult.success) {
        throw new Error(`Scrape failed: ${scrapeResult.error}`);
      }

      console.log('✅ Successfully scraped product page');
      
      return {
        success: true,
        data: scrapeResult.data,
        source: 'firecrawl_scrape'
      };

    } catch (error) {
      console.error('❌ Firecrawl scrape error:', error);
      
      return {
        success: false,
        error: error.message,
        source: 'firecrawl_scrape_failed'
      };
    }
  }

  parseSearchResults(results, originalQuery) {
    if (!results || !Array.isArray(results)) {
      return [];
    }

    const products = [];
    
    for (const result of results) {
      try {
        // Extract product information from markdown content
        const product = this.extractProductFromMarkdown(result, originalQuery);
        
        if (product) {
          products.push(product);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse search result:', error);
      }
    }

    return products;
  }

  extractProductFromMarkdown(result, originalQuery) {
    const { url, title, markdown } = result;
    
    // Only process armenius.com.cy URLs
    if (!url || !url.includes('armenius.com.cy')) {
      return null;
    }

    // Skip non-product pages
    if (url.includes('/category/') || url.includes('/search') || url.includes('/page/')) {
      return null;
    }

    try {
      // Extract price from markdown
      const priceMatches = markdown?.match(/€\s*([0-9,]+\.?[0-9]*)|([0-9,]+\.?[0-9]*)\s*€/gi);
      let price = null;
      
      if (priceMatches) {
        const priceStr = priceMatches[0].replace(/[€,\s]/g, '');
        price = parseFloat(priceStr);
      }

      // Determine availability from markdown content
      const lowerContent = (markdown || '').toLowerCase();
      const inStock = !lowerContent.includes('out of stock') && 
                     !lowerContent.includes('εξαντλημένο') &&
                     !lowerContent.includes('μη διαθέσιμο');

      // Extract relevant specs or features
      const specs = this.extractSpecsFromContent(markdown, originalQuery);

      return {
        name: title || 'Unknown Product',
        price: price,
        url: url,
        inStock: inStock,
        source: 'armenius_live',
        specs: specs,
        relevanceScore: this.calculateRelevance(title + ' ' + markdown, originalQuery)
      };

    } catch (error) {
      console.warn('⚠️ Error extracting product data:', error);
      return null;
    }
  }

  extractSpecsFromContent(content, query) {
    if (!content) return [];
    
    const specs = [];
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Look for common computer hardware specs
    const specPatterns = [
      { pattern: /(\d+gb|\d+tb)\s*(ram|memory|storage|ssd|hdd)/gi, type: 'storage' },
      { pattern: /(rtx|gtx|radeon|rx)\s*\d+/gi, type: 'gpu' },
      { pattern: /(intel|amd|ryzen|core)\s*[^\s,]*/gi, type: 'cpu' },
      { pattern: /\d+\s*(inch|"|hz|mhz|ghz)/gi, type: 'display' },
      { pattern: /(gaming|workstation|laptop|desktop|pc)/gi, type: 'category' }
    ];

    for (const { pattern, type } of specPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        specs.push(...matches.slice(0, 3).map(match => ({ type, value: match.trim() })));
      }
    }

    return specs.slice(0, 5); // Limit to top 5 specs
  }

  calculateRelevance(content, query) {
    if (!content || !query) return 0;
    
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 2);
    
    let score = 0;
    
    for (const word of queryWords) {
      const occurrences = (lowerContent.match(new RegExp(word, 'g')) || []).length;
      score += occurrences;
    }
    
    return score;
  }
}

// Export singleton instance
export const firecrawlClient = new ArmeniusFirecrawlClient();
export default firecrawlClient;