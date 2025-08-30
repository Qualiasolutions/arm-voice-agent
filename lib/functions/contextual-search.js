import { mcp__context7__get_library_docs } from '../mcp-clients/context7.js';
import { db } from '../supabase/client.js';

export default {
  contextualProductSearch: {
    ttl: 300, // 5-minute cache
    cacheable: true,
    
    async execute(parameters, callContext) {
      try {
        const { productQuery, language } = parameters;
        const { customerProfile } = callContext;
        
        // Get enhanced documentation for product categories
        const productContext = await this.getProductContext(productQuery);
        
        // Combine with existing inventory search
        const inventoryResults = await this.checkInventoryWithContext(productQuery, productContext);
        
        // Personalize based on customer history
        const personalizedResults = await this.personalizeResults(inventoryResults, customerProfile);
        
        return {
          message: language === 'el' 
            ? `Βρήκα ${personalizedResults.length} προϊόντα που ταιριάζουν με αυτό που ψάχνετε`
            : `I found ${personalizedResults.length} products that match what you're looking for`,
          products: personalizedResults,
          contextEnhanced: true,
          searchMethod: 'contextual_enhanced'
        };
      } catch (error) {
        console.error('Contextual search failed:', error);
        
        // Fallback to regular inventory search
        const fallbackResults = await this.fallbackInventorySearch(parameters.productQuery);
        
        return {
          message: parameters.language === 'el'
            ? `Βρήκα ${fallbackResults.length} προϊόντα (βασική αναζήτηση)`
            : `I found ${fallbackResults.length} products (basic search)`,
          products: fallbackResults,
          contextEnhanced: false,
          searchMethod: 'fallback',
          error: error.message
        };
      }
    },

    async getProductContext(productQuery) {
      try {
        // Determine the most relevant library based on query
        const libraryMap = {
          'graphics': '/computer-hardware/graphics-cards',
          'processor': '/computer-hardware/processors', 
          'gaming': '/computer-hardware/gaming',
          'laptop': '/computer-hardware/laptops',
          'desktop': '/computer-hardware/desktops',
          'memory': '/computer-hardware/memory',
          'storage': '/computer-hardware/storage'
        };

        const queryLower = productQuery.toLowerCase();
        let libraryId = '/computer-hardware/general';
        
        for (const [key, value] of Object.entries(libraryMap)) {
          if (queryLower.includes(key)) {
            libraryId = value;
            break;
          }
        }

        // Get context from Context7 MCP
        const productContext = await mcp__context7__get_library_docs(libraryId, {
          topic: productQuery,
          tokens: 2000
        });

        return productContext;
      } catch (error) {
        console.warn('Failed to get product context:', error);
        return null;
      }
    },

    async checkInventoryWithContext(productQuery, context) {
      try {
        // Enhanced search using context keywords
        const contextKeywords = context ? this.extractKeywords(context) : [];
        const searchTerms = [productQuery, ...contextKeywords].join(' ');
        
        // Use existing inventory function but with enhanced search terms
        const results = await db.searchProducts(searchTerms, {
          limit: 10,
          includeSpecs: true,
          fuzzyMatch: true
        });

        return results.map(product => ({
          ...product,
          contextEnhanced: true,
          relevanceScore: this.calculateRelevance(product, productQuery, contextKeywords)
        }));
      } catch (error) {
        console.error('Inventory search with context failed:', error);
        return [];
      }
    },

    async personalizeResults(results, customerProfile) {
      if (!customerProfile || !results.length) {
        return results;
      }

      try {
        // Get customer's previous orders to understand preferences
        const customerHistory = await db.getCustomerOrderHistory(customerProfile.id);
        const preferredBrands = this.extractPreferredBrands(customerHistory);
        const priceRange = this.calculatePreferredPriceRange(customerHistory);

        // Score and sort results based on personalization
        return results.map(product => ({
          ...product,
          personalizedScore: this.calculatePersonalizedScore(product, preferredBrands, priceRange),
          personalized: true
        })).sort((a, b) => b.personalizedScore - a.personalizedScore);
      } catch (error) {
        console.warn('Personalization failed:', error);
        return results;
      }
    },

    extractKeywords(context) {
      if (!context || typeof context !== 'string') return [];
      
      // Simple keyword extraction - in production, use more sophisticated NLP
      const keywords = context
        .toLowerCase()
        .match(/\b\w+\b/g)
        .filter(word => word.length > 3)
        .filter(word => ['graphics', 'processor', 'memory', 'storage', 'gaming', 'professional'].includes(word));
      
      return [...new Set(keywords)]; // Remove duplicates
    },

    calculateRelevance(product, query, contextKeywords) {
      let score = 0;
      const queryLower = query.toLowerCase();
      const productText = (product.name + ' ' + (product.description || '')).toLowerCase();
      
      // Direct query match
      if (productText.includes(queryLower)) score += 10;
      
      // Context keyword matches
      contextKeywords.forEach(keyword => {
        if (productText.includes(keyword)) score += 5;
      });
      
      // Brand/model matches
      if (productText.includes(product.brand?.toLowerCase() || '')) score += 3;
      
      return score;
    },

    extractPreferredBrands(orderHistory) {
      if (!orderHistory || !orderHistory.length) return [];
      
      const brandCounts = {};
      orderHistory.forEach(order => {
        order.items?.forEach(item => {
          const brand = item.brand;
          if (brand) {
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
          }
        });
      });
      
      return Object.entries(brandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([brand]) => brand);
    },

    calculatePreferredPriceRange(orderHistory) {
      if (!orderHistory || !orderHistory.length) return { min: 0, max: Infinity };
      
      const prices = orderHistory.flatMap(order => 
        order.items?.map(item => item.price) || []
      ).filter(price => price > 0);
      
      if (prices.length === 0) return { min: 0, max: Infinity };
      
      prices.sort((a, b) => a - b);
      const q1 = prices[Math.floor(prices.length * 0.25)];
      const q3 = prices[Math.floor(prices.length * 0.75)];
      
      return { min: q1 * 0.8, max: q3 * 1.2 };
    },

    calculatePersonalizedScore(product, preferredBrands, priceRange) {
      let score = 0;
      
      // Brand preference
      if (preferredBrands.includes(product.brand)) {
        score += 20;
      }
      
      // Price range preference
      if (product.price >= priceRange.min && product.price <= priceRange.max) {
        score += 10;
      } else if (product.price < priceRange.min) {
        score += 5; // Slightly prefer cheaper than usual
      }
      
      // Availability
      if (product.stock > 0) score += 5;
      
      return score;
    },

    async fallbackInventorySearch(productQuery) {
      try {
        return await db.searchProducts(productQuery, {
          limit: 5,
          includeSpecs: false
        });
      } catch (error) {
        console.error('Fallback search failed:', error);
        return [];
      }
    }
  }
};