import { OpenAI } from 'openai';
import { db } from '../supabase/client.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default {
  semanticProductSearch: {
    ttl: 600, // 10-minute cache
    cacheable: true,
    
    async execute(parameters, callContext) {
      try {
        const { query, language = 'en' } = parameters;
        
        if (!query || query.trim().length < 2) {
          return {
            message: language === 'el' 
              ? "Παρακαλώ δώστε μου περισσότερες λεπτομέρειες για το προϊόν που ψάχνετε"
              : "Please provide more details about the product you're looking for",
            results: [],
            searchType: 'invalid_query'
          };
        }

        // Generate embeddings for user query
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Search product database with vector similarity
        const semanticResults = await this.searchProductsBySimilarity(queryEmbedding, {
          threshold: 0.75,
          limit: 10,
          language: language
        });
        
        // Combine with traditional search for better coverage
        const traditionalResults = await this.traditionalProductSearch(query, language);
        
        // Merge and rank results
        const combinedResults = this.mergeAndRankResults(semanticResults, traditionalResults, query);
        
        // Apply personalization if customer context available
        const personalizedResults = callContext.customerProfile 
          ? await this.personalizeResults(combinedResults, callContext.customerProfile)
          : combinedResults;

        return {
          message: language === 'el'
            ? `Χρησιμοποιώ προηγμένη αναζήτηση για να βρω τα καλύτερα προϊόντα για εσάς`
            : `Using advanced search to find the best products for you`,
          results: personalizedResults.slice(0, 8), // Limit to top 8 results
          searchType: 'semantic_enhanced',
          totalFound: personalizedResults.length,
          searchMetrics: {
            semanticMatches: semanticResults.length,
            traditionalMatches: traditionalResults.length,
            personalized: !!callContext.customerProfile
          }
        };
      } catch (error) {
        console.error('Semantic search failed:', error);
        
        // Fallback to simple search
        return await this.fallbackSimpleSearch(parameters, callContext);
      }
    },

    async generateEmbedding(text) {
      try {
        const response = await openai.embeddings.create({
          model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
          input: text.trim(),
        });

        return response.data[0].embedding;
      } catch (error) {
        console.error('Embedding generation failed:', error);
        throw new Error('Failed to generate text embedding');
      }
    },

    async searchProductsBySimilarity(queryEmbedding, options = {}) {
      try {
        const { threshold = 0.75, limit = 10, language = 'en' } = options;
        
        // Check if we have embeddings table
        const hasEmbeddings = await this.checkEmbeddingsTable();
        
        if (!hasEmbeddings) {
          console.warn('Product embeddings table not available, skipping semantic search');
          return [];
        }

        // Vector similarity search using pgvector
        const { data, error } = await db.rpc('search_products_by_similarity', {
          query_embedding: queryEmbedding,
          similarity_threshold: threshold,
          match_count: limit,
          target_language: language
        });

        if (error) {
          console.error('Vector search failed:', error);
          return [];
        }

        return (data || []).map(item => ({
          ...item,
          searchType: 'semantic',
          similarity: item.similarity || 0,
          relevanceScore: (item.similarity || 0) * 100
        }));
      } catch (error) {
        console.error('Similarity search failed:', error);
        return [];
      }
    },

    async traditionalProductSearch(query, language) {
      try {
        // Use existing database search functionality
        const searchTerms = query.toLowerCase();
        
        let dbQuery = db
          .from('products')
          .select(`
            id, name, description, brand, model, price, stock,
            category, subcategory, specifications, image_url
          `)
          .or(`
            name.ilike.%${searchTerms}%,
            description.ilike.%${searchTerms}%,
            brand.ilike.%${searchTerms}%,
            model.ilike.%${searchTerms}%,
            category.ilike.%${searchTerms}%
          `)
          .limit(15);

        // Add language-specific search if Greek descriptions available
        if (language === 'el') {
          dbQuery = dbQuery.or(`description_el.ilike.%${searchTerms}%`);
        }

        const { data, error } = await dbQuery;
        
        if (error) {
          console.error('Traditional search failed:', error);
          return [];
        }

        return (data || []).map(item => ({
          ...item,
          searchType: 'traditional',
          relevanceScore: this.calculateTraditionalRelevance(item, query)
        }));
      } catch (error) {
        console.error('Traditional search failed:', error);
        return [];
      }
    },

    mergeAndRankResults(semanticResults, traditionalResults, query) {
      // Create a map to avoid duplicates
      const resultMap = new Map();
      
      // Add semantic results (higher priority)
      semanticResults.forEach(result => {
        resultMap.set(result.id, {
          ...result,
          finalScore: (result.relevanceScore || 0) + 20 // Semantic bonus
        });
      });
      
      // Add traditional results (don't overwrite semantic)
      traditionalResults.forEach(result => {
        if (!resultMap.has(result.id)) {
          resultMap.set(result.id, {
            ...result,
            finalScore: result.relevanceScore || 0
          });
        } else {
          // Boost score if found in both searches
          const existing = resultMap.get(result.id);
          existing.finalScore += 10; // Multi-search bonus
          existing.searchType = 'hybrid';
        }
      });
      
      // Convert to array and sort by final score
      return Array.from(resultMap.values())
        .sort((a, b) => b.finalScore - a.finalScore);
    },

    calculateTraditionalRelevance(product, query) {
      let score = 0;
      const queryLower = query.toLowerCase();
      const searchableText = [
        product.name || '',
        product.description || '',
        product.brand || '',
        product.model || '',
        product.category || ''
      ].join(' ').toLowerCase();
      
      // Exact matches get higher scores
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      
      queryWords.forEach(word => {
        if (searchableText.includes(word)) {
          // Check where the match occurs (name gets highest score)
          if ((product.name || '').toLowerCase().includes(word)) score += 15;
          else if ((product.brand || '').toLowerCase().includes(word)) score += 12;
          else if ((product.model || '').toLowerCase().includes(word)) score += 10;
          else if ((product.category || '').toLowerCase().includes(word)) score += 8;
          else score += 5; // Description match
        }
      });
      
      // Boost for exact phrase matches
      if (searchableText.includes(queryLower)) {
        score += 25;
      }
      
      // Stock availability bonus
      if (product.stock > 0) score += 5;
      
      return score;
    },

    async personalizeResults(results, customerProfile) {
      try {
        // Get customer's order history and preferences
        const { data: orderHistory } = await db
          .from('order_items')
          .select('product_id, brand, category, price')
          .eq('customer_id', customerProfile.id)
          .limit(50);

        if (!orderHistory || orderHistory.length === 0) {
          return results;
        }

        // Extract preferences
        const preferences = this.extractCustomerPreferences(orderHistory);
        
        // Score results based on preferences
        return results.map(result => ({
          ...result,
          personalizedScore: this.calculatePersonalizedScore(result, preferences),
          personalized: true
        })).sort((a, b) => b.personalizedScore - a.personalizedScore);
      } catch (error) {
        console.error('Personalization failed:', error);
        return results;
      }
    },

    extractCustomerPreferences(orderHistory) {
      const brandCounts = {};
      const categoryCounts = {};
      const prices = [];
      
      orderHistory.forEach(item => {
        // Brand preferences
        if (item.brand) {
          brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
        }
        
        // Category preferences
        if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
        
        // Price range
        if (item.price && item.price > 0) {
          prices.push(item.price);
        }
      });
      
      // Calculate preferred price range
      prices.sort((a, b) => a - b);
      const priceRange = prices.length > 0 ? {
        min: prices[Math.floor(prices.length * 0.25)],
        max: prices[Math.floor(prices.length * 0.75)],
        average: prices.reduce((sum, p) => sum + p, 0) / prices.length
      } : null;
      
      return {
        preferredBrands: Object.entries(brandCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([brand]) => brand),
        preferredCategories: Object.entries(categoryCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category),
        priceRange
      };
    },

    calculatePersonalizedScore(product, preferences) {
      let score = product.finalScore || 0;
      
      // Brand preference bonus
      if (preferences.preferredBrands.includes(product.brand)) {
        const brandIndex = preferences.preferredBrands.indexOf(product.brand);
        score += (3 - brandIndex) * 10; // 30, 20, or 10 bonus
      }
      
      // Category preference bonus
      if (preferences.preferredCategories.includes(product.category)) {
        const categoryIndex = preferences.preferredCategories.indexOf(product.category);
        score += (3 - categoryIndex) * 5; // 15, 10, or 5 bonus
      }
      
      // Price range preference
      if (preferences.priceRange && product.price) {
        const { min, max, average } = preferences.priceRange;
        
        if (product.price >= min && product.price <= max) {
          score += 15; // In preferred range
        } else if (product.price < average) {
          score += 5; // Cheaper than usual (might be attractive)
        }
      }
      
      return score;
    },

    async checkEmbeddingsTable() {
      try {
        const { data, error } = await db
          .from('product_embeddings')
          .select('id')
          .limit(1);
          
        return !error;
      } catch (error) {
        return false;
      }
    },

    async fallbackSimpleSearch(parameters, callContext) {
      try {
        const { query, language = 'en' } = parameters;
        
        const { data, error } = await db
          .from('products')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
          .limit(5);

        if (error) throw error;

        return {
          message: language === 'el'
            ? `Βρήκα ${(data || []).length} προϊόντα (βασική αναζήτηση)`
            : `Found ${(data || []).length} products (basic search)`,
          results: data || [],
          searchType: 'fallback_simple',
          totalFound: (data || []).length
        };
      } catch (error) {
        console.error('Fallback search failed:', error);
        return {
          message: parameters.language === 'el'
            ? "Δυστυχώς, δεν μπόρεσα να βρω προϊόντα αυτή τη στιγμή"
            : "Sorry, I couldn't find any products right now",
          results: [],
          searchType: 'failed',
          error: error.message
        };
      }
    }
  }
};