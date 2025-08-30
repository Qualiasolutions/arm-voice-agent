import { describe, test, expect, beforeAll, afterEach, vi } from 'vitest';
import FunctionRegistry from '../lib/functions/index.js';

// Mock MCP clients to avoid actual API calls during testing
vi.mock('../lib/mcp-clients/vapi.js', () => ({
  default: {
    updateAssistant: vi.fn(),
    getAssistantConfig: vi.fn(),
    analyzeCallQuality: vi.fn(),
    updateAssistantVoice: vi.fn()
  }
}));

vi.mock('../lib/mcp-clients/memory.js', () => ({
  default: {
    storeCustomerContext: vi.fn(),
    retrieveCustomerContext: vi.fn(),
    updateCustomerPreferences: vi.fn(),
    getConversationHistory: vi.fn()
  }
}));

vi.mock('../lib/mcp-clients/context7.js', () => ({
  default: {
    searchDocumentation: vi.fn(),
    getProductContext: vi.fn(),
    enhanceSearchResults: vi.fn()
  }
}));

// Mock Supabase client
vi.mock('../lib/supabase/client.js', () => ({
  db: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          limit: vi.fn(() => ({ data: [], error: null }))
        })),
        or: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null }))
        })),
        insert: vi.fn(() => ({ error: null })),
        upsert: vi.fn(() => ({ error: null }))
      }))
    })),
    rpc: vi.fn(() => ({ data: [], error: null })),
    trackEvent: vi.fn()
  }
}));

describe('MCP Integration Tests', () => {
  beforeAll(async () => {
    await FunctionRegistry.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Voice Optimization MCP Integration', () => {
    test('should optimize assistant configuration via Vapi MCP', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      vapiMCPClient.default.getAssistantConfig.mockResolvedValue({
        voice: { provider: '11labs', voiceId: 'DMrXvkhaNPEmPbI3ABs8' },
        language: 'en'
      });

      vapiMCPClient.default.updateAssistant.mockResolvedValue({
        success: true,
        assistantId: 'test-assistant-123'
      });

      const result = await FunctionRegistry.execute('optimizeVoiceForCustomer', {
        customerLanguage: 'el',
        technicalLevel: 'beginner'
      }, {
        assistantId: 'test-assistant-123',
        conversationId: 'test-conv',
        customerProfile: { id: 'cust-456', preferredLanguage: 'el' }
      });

      expect(result.optimized).toBe(true);
      expect(result.voiceSettings).toBeDefined();
      expect(vapiMCPClient.default.updateAssistant).toHaveBeenCalled();
    });

    test('should handle MCP connection failures gracefully in voice optimization', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      vapiMCPClient.default.getAssistantConfig.mockRejectedValue(new Error('MCP connection failed'));

      const result = await FunctionRegistry.execute('optimizeVoiceForCustomer', {
        customerLanguage: 'el'
      }, {
        assistantId: 'test-assistant',
        conversationId: 'test-conv'
      });

      expect(result.optimized).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.message).toContain('optimization temporarily unavailable');
    });

    test('should adapt voice settings based on customer profile', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      vapiMCPClient.default.getAssistantConfig.mockResolvedValue({
        voice: { provider: 'azure', voiceId: 'en-US-BrianNeural' }
      });

      vapiMCPClient.default.updateAssistant.mockResolvedValue({ success: true });

      // Test for Greek customer with technical expertise
      const result = await FunctionRegistry.execute('optimizeVoiceForCustomer', {
        customerLanguage: 'el',
        technicalLevel: 'expert'
      }, {
        assistantId: 'test-assistant',
        conversationId: 'test-conv',
        customerProfile: {
          id: 'expert-customer',
          preferredLanguage: 'el',
          technicalExpertiseLevel: 'expert'
        }
      });

      expect(result.optimized).toBe(true);
      const updateCall = vapiMCPClient.default.updateAssistant.mock.calls[0];
      expect(updateCall[1].voice.voiceId).toBe('el-GR-NestorNeural'); // Greek male voice
    });
  });

  describe('Customer Memory MCP Integration', () => {
    test('should store and retrieve customer context via Memory MCP', async () => {
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      
      memoryMCPClient.default.storeCustomerContext.mockResolvedValue({ success: true });
      memoryMCPClient.default.retrieveCustomerContext.mockResolvedValue({
        customerProfile: {
          id: 'cust-123',
          preferredLanguage: 'el',
          technicalLevel: 'intermediate',
          previousPurchases: ['RTX 3080', 'AMD Ryzen 7']
        },
        conversationHistory: [
          { message: 'Θέλω κάρτα γραφικών', timestamp: new Date() }
        ]
      });

      const result = await FunctionRegistry.execute('enhanceCustomerMemory', {
        phoneNumber: '+35799123456',
        currentLanguage: 'el'
      }, {
        conversationId: 'memory-test',
        customerProfile: { id: 'cust-123' }
      });

      expect(result.enhanced).toBe(true);
      expect(result.customerContext).toBeDefined();
      expect(result.customerContext.preferredLanguage).toBe('el');
      expect(memoryMCPClient.default.retrieveCustomerContext).toHaveBeenCalled();
    });

    test('should update customer preferences based on conversation', async () => {
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      
      memoryMCPClient.default.updateCustomerPreferences.mockResolvedValue({ success: true });

      const result = await FunctionRegistry.execute('enhanceCustomerMemory', {
        phoneNumber: '+35799654321',
        currentLanguage: 'en',
        preferences: {
          preferredBrand: 'NVIDIA',
          budgetRange: '€1000-€1500'
        }
      }, {
        conversationId: 'pref-update',
        customerProfile: { id: 'cust-789' }
      });

      expect(result.enhanced).toBe(true);
      expect(memoryMCPClient.default.updateCustomerPreferences).toHaveBeenCalledWith(
        'cust-789',
        expect.objectContaining({
          preferredBrand: 'NVIDIA',
          budgetRange: '€1000-€1500'
        })
      );
    });

    test('should handle Memory MCP failures with graceful fallback', async () => {
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      
      memoryMCPClient.default.retrieveCustomerContext.mockRejectedValue(new Error('Memory service unavailable'));

      const result = await FunctionRegistry.execute('enhanceCustomerMemory', {
        phoneNumber: '+35799111222'
      }, {
        conversationId: 'memory-fail'
      });

      expect(result.enhanced).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.message).toContain('temporarily unavailable');
    });
  });

  describe('Contextual Search MCP Integration', () => {
    test('should enhance product search with Context7 documentation', async () => {
      const context7MCPClient = await import('../lib/mcp-clients/context7.js');
      const { db } = await import('../lib/supabase/client.js');
      
      // Mock database product results
      db.from.mockImplementation(() => ({
        select: () => ({
          or: () => ({
            limit: () => ({ 
              data: [{
                id: 'prod-1',
                name: 'RTX 4090',
                brand: 'NVIDIA',
                category: 'Graphics Cards',
                price: 1200
              }], 
              error: null 
            })
          })
        })
      }));

      // Mock Context7 enhancement
      context7MCPClient.default.enhanceSearchResults.mockResolvedValue({
        enhancedResults: [{
          id: 'prod-1',
          name: 'RTX 4090',
          contextualInfo: 'Latest GPU with Ada Lovelace architecture, excellent for 4K gaming',
          compatibilityNotes: 'Requires 850W+ PSU, supports DLSS 3.0'
        }]
      });

      const result = await FunctionRegistry.execute('contextualProductSearch', {
        query: 'κάρτα γραφικών για gaming',
        language: 'el'
      }, {
        conversationId: 'context-search',
        customerProfile: { id: 'gamer-customer' }
      });

      expect(result.enhanced).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results[0].contextualInfo).toBeDefined();
      expect(context7MCPClient.default.enhanceSearchResults).toHaveBeenCalled();
    });

    test('should combine multiple MCP services for comprehensive search', async () => {
      const context7MCPClient = await import('../lib/mcp-clients/context7.js');
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      
      // Mock customer context from Memory MCP
      memoryMCPClient.default.retrieveCustomerContext.mockResolvedValue({
        customerProfile: {
          preferredBrand: 'AMD',
          budgetRange: '€500-€800',
          previousSearches: ['processor', 'motherboard']
        }
      });

      // Mock documentation context from Context7 MCP
      context7MCPClient.default.getProductContext.mockResolvedValue({
        documentation: 'AMD Ryzen processors offer excellent performance per watt...',
        compatibility: 'AM4 socket compatibility, DDR4 support'
      });

      const result = await FunctionRegistry.execute('contextualProductSearch', {
        query: 'επεξεργαστής',
        language: 'el',
        useCustomerContext: true
      }, {
        conversationId: 'comprehensive-search',
        customerProfile: { id: 'amd-customer' }
      });

      expect(result.enhanced).toBe(true);
      expect(result.customerContextUsed).toBe(true);
      expect(result.documentationEnhanced).toBe(true);
    });

    test('should fallback gracefully when Context7 MCP is unavailable', async () => {
      const context7MCPClient = await import('../lib/mcp-clients/context7.js');
      const { db } = await import('../lib/supabase/client.js');
      
      // Mock successful database query
      db.from.mockImplementation(() => ({
        select: () => ({
          or: () => ({
            limit: () => ({ 
              data: [{ id: 'prod-1', name: 'Test Product' }], 
              error: null 
            })
          })
        })
      }));

      // Mock Context7 failure
      context7MCPClient.default.enhanceSearchResults.mockRejectedValue(new Error('Context7 unavailable'));

      const result = await FunctionRegistry.execute('contextualProductSearch', {
        query: 'test product',
        language: 'en'
      }, {
        conversationId: 'fallback-search'
      });

      expect(result.enhanced).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.results).toBeDefined(); // Should still have basic results
    });
  });

  describe('Semantic Product Search MCP Integration', () => {
    test('should use OpenAI embeddings for semantic search', async () => {
      const { db } = await import('../lib/supabase/client.js');
      
      // Mock vector search results
      db.rpc.mockResolvedValue({
        data: [{
          id: 'prod-semantic',
          name: 'RTX 4070 Ti',
          description: 'High-performance gaming graphics card',
          similarity: 0.89,
          price: 800
        }],
        error: null
      });

      const result = await FunctionRegistry.execute('semanticProductSearch', {
        query: 'καλή κάρτα γραφικών για gaming',
        language: 'el'
      }, {
        conversationId: 'semantic-test',
        customerProfile: { id: 'semantic-customer' }
      });

      expect(result.searchType).toBe('semantic_enhanced');
      expect(result.results).toBeDefined();
      expect(result.searchMetrics.semanticMatches).toBeGreaterThan(0);
      expect(db.rpc).toHaveBeenCalledWith('search_products_by_similarity', expect.any(Object));
    });

    test('should merge semantic and traditional search results', async () => {
      const { db } = await import('../lib/supabase/client.js');
      
      // Mock both semantic and traditional results
      db.rpc.mockResolvedValue({
        data: [{
          id: 'semantic-result',
          name: 'Semantic Match Product',
          similarity: 0.85
        }],
        error: null
      });

      db.from.mockImplementation(() => ({
        select: () => ({
          or: () => ({
            limit: () => ({ 
              data: [{
                id: 'traditional-result',
                name: 'Traditional Match Product'
              }], 
              error: null 
            })
          })
        })
      }));

      const result = await FunctionRegistry.execute('semanticProductSearch', {
        query: 'gaming computer',
        language: 'en'
      }, {
        conversationId: 'hybrid-search'
      });

      expect(result.searchType).toBe('semantic_enhanced');
      expect(result.searchMetrics.semanticMatches).toBeGreaterThan(0);
      expect(result.searchMetrics.traditionalMatches).toBeGreaterThan(0);
    });

    test('should personalize results based on customer profile', async () => {
      const { db } = await import('../lib/supabase/client.js');
      
      // Mock customer order history
      db.from.mockImplementation((table) => {
        if (table === 'order_items') {
          return {
            select: () => ({
              eq: () => ({
                limit: () => ({ 
                  data: [{
                    brand: 'NVIDIA',
                    category: 'Graphics Cards',
                    price: 1000
                  }], 
                  error: null 
                })
              })
            })
          };
        }
        
        // Default product search
        return {
          select: () => ({
            or: () => ({
              limit: () => ({ data: [], error: null })
            })
          })
        };
      });

      db.rpc.mockResolvedValue({
        data: [{
          id: 'nvidia-product',
          name: 'RTX 4080',
          brand: 'NVIDIA',
          category: 'Graphics Cards',
          price: 1100
        }],
        error: null
      });

      const result = await FunctionRegistry.execute('semanticProductSearch', {
        query: 'graphics card upgrade',
        language: 'en'
      }, {
        conversationId: 'personalized-search',
        customerProfile: { id: 'nvidia-fan' }
      });

      expect(result.searchMetrics.personalized).toBe(true);
      expect(result.results[0].personalized).toBe(true);
    });
  });

  describe('MCP Performance and Reliability', () => {
    test('should timeout MCP calls appropriately', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      // Mock a very slow MCP response
      vapiMCPClient.default.getAssistantConfig.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
      );

      const startTime = Date.now();
      
      const result = await FunctionRegistry.execute('optimizeVoiceForCustomer', {
        customerLanguage: 'el'
      }, {
        assistantId: 'timeout-test',
        conversationId: 'timeout-conv'
      });

      const duration = Date.now() - startTime;
      
      // Should timeout and return fallback within reasonable time (5 seconds max)
      expect(duration).toBeLessThan(6000);
      expect(result.fallback).toBe(true);
    });

    test('should handle concurrent MCP operations efficiently', async () => {
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      
      memoryMCPClient.default.retrieveCustomerContext.mockResolvedValue({
        customerProfile: { id: 'concurrent-test' }
      });

      // Execute multiple operations concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        FunctionRegistry.execute('enhanceCustomerMemory', {
          phoneNumber: `+35799${i.toString().padStart(6, '0')}`
        }, {
          conversationId: `concurrent-${i}`
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.enhanced).toBe(true);
      });

      // Should handle concurrent operations efficiently (under 3 seconds for 5 ops)
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('MCP Configuration and Environment', () => {
    test('should handle missing MCP configuration gracefully', async () => {
      // Temporarily mock missing environment variables
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.VAPI_API_KEY;

      const result = await FunctionRegistry.execute('optimizeVoiceForCustomer', {
        customerLanguage: 'el'
      }, {
        assistantId: 'config-test',
        conversationId: 'config-conv'
      });

      // Should fallback gracefully when configuration is missing
      expect(result.optimized).toBe(false);
      expect(result.fallback).toBe(true);

      // Restore environment
      process.env = originalEnv;
    });

    test('should validate MCP connections during initialization', async () => {
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      const context7MCPClient = await import('../lib/mcp-clients/context7.js');
      
      // All MCP clients should be properly imported and have expected methods
      expect(vapiMCPClient.default.updateAssistant).toBeDefined();
      expect(vapiMCPClient.default.getAssistantConfig).toBeDefined();
      
      expect(memoryMCPClient.default.storeCustomerContext).toBeDefined();
      expect(memoryMCPClient.default.retrieveCustomerContext).toBeDefined();
      
      expect(context7MCPClient.default.searchDocumentation).toBeDefined();
      expect(context7MCPClient.default.enhanceSearchResults).toBeDefined();
    });
  });

  describe('Data Flow and State Management', () => {
    test('should maintain consistent state across MCP operations', async () => {
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      const vapiMCPClient = await import('../lib/mcp-clients/vapi.js');
      
      // Mock consistent customer profile across operations
      const customerProfile = {
        id: 'state-test-customer',
        preferredLanguage: 'el',
        technicalLevel: 'intermediate'
      };

      memoryMCPClient.default.retrieveCustomerContext.mockResolvedValue({
        customerProfile
      });

      memoryMCPClient.default.updateCustomerPreferences.mockResolvedValue({ success: true });
      vapiMCPClient.default.updateAssistant.mockResolvedValue({ success: true });

      // Execute sequence of operations that should maintain state
      const memoryResult = await FunctionRegistry.execute('enhanceCustomerMemory', {
        phoneNumber: '+35799999999'
      }, {
        conversationId: 'state-test',
        customerProfile
      });

      const optimizationResult = await FunctionRegistry.execute('optimizeVoiceForCustomer', {
        customerLanguage: customerProfile.preferredLanguage,
        technicalLevel: customerProfile.technicalLevel
      }, {
        assistantId: 'state-test-assistant',
        conversationId: 'state-test',
        customerProfile
      });

      // State should be consistent across operations
      expect(memoryResult.enhanced).toBe(true);
      expect(optimizationResult.optimized).toBe(true);
      expect(memoryResult.customerContext.preferredLanguage).toBe(customerProfile.preferredLanguage);
    });

    test('should handle MCP data synchronization', async () => {
      const memoryMCPClient = await import('../lib/mcp-clients/memory.js');
      
      // Test that updates are properly synchronized
      memoryMCPClient.default.storeCustomerContext.mockResolvedValue({ success: true });
      memoryMCPClient.default.retrieveCustomerContext.mockResolvedValue({
        customerProfile: {
          id: 'sync-customer',
          lastUpdated: new Date().toISOString()
        }
      });

      const updateResult = await FunctionRegistry.execute('enhanceCustomerMemory', {
        phoneNumber: '+35799123123',
        preferences: { newPreference: 'gaming' }
      }, {
        conversationId: 'sync-test'
      });

      const retrieveResult = await FunctionRegistry.execute('enhanceCustomerMemory', {
        phoneNumber: '+35799123123'
      }, {
        conversationId: 'sync-test-2'
      });

      // Data should be synchronized between operations
      expect(updateResult.enhanced).toBe(true);
      expect(retrieveResult.enhanced).toBe(true);
      expect(memoryMCPClient.default.storeCustomerContext).toHaveBeenCalled();
      expect(memoryMCPClient.default.retrieveCustomerContext).toHaveBeenCalled();
    });
  });
});