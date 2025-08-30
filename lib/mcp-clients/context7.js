// Context7 MCP Client - For enhanced documentation and product context
// Temporary: Disable MCP imports for deployment
/*
import { 
  mcp__context7__resolve_library_id, 
  mcp__context7__get_library_docs 
} from '../../mcp-functions.js';

export { mcp__context7__resolve_library_id, mcp__context7__get_library_docs };
*/

export class Context7MCPClient {
  constructor() {
    this.initialized = false;
    this.libraryCache = new Map();
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Test connection by resolving a common library
      await mcp__context7__resolve_library_id('computer hardware');
      this.initialized = true;
      console.log('Context7 MCP client initialized successfully');
    } catch (error) {
      console.warn('Context7 MCP client initialization failed:', error.message);
      console.warn('Enhanced product context features will be limited');
    }
  }

  async getProductDocumentation(productQuery, maxTokens = 2000) {
    try {
      await this.init();
      
      if (!this.initialized) {
        console.warn('Context7 MCP not available, skipping documentation lookup');
        return null;
      }

      // Determine the best library for the product query
      const libraryId = await this.resolveProductLibrary(productQuery);
      
      if (!libraryId) {
        console.warn('No suitable library found for query:', productQuery);
        return null;
      }

      // Get documentation
      const docs = await mcp__context7__get_library_docs(libraryId, {
        topic: productQuery,
        tokens: maxTokens
      });

      return docs;
    } catch (error) {
      console.error('Failed to get product documentation:', error);
      return null;
    }
  }

  async resolveProductLibrary(productQuery) {
    try {
      const queryLower = productQuery.toLowerCase();
      
      // Define library mappings for common product categories
      const libraryMappings = {
        'graphics card': 'nvidia gpu documentation',
        'processor': 'intel amd cpu documentation', 
        'gaming': 'pc gaming hardware',
        'laptop': 'laptop computer specifications',
        'desktop': 'desktop computer hardware',
        'memory': 'computer memory ram specifications',
        'storage': 'storage ssd hdd specifications',
        'motherboard': 'motherboard specifications',
        'power supply': 'psu power supply specifications'
      };

      // Find the most relevant library
      let selectedLibrary = null;
      for (const [category, library] of Object.entries(libraryMappings)) {
        if (queryLower.includes(category)) {
          selectedLibrary = library;
          break;
        }
      }

      if (!selectedLibrary) {
        selectedLibrary = 'computer hardware general';
      }

      // Check cache first
      if (this.libraryCache.has(selectedLibrary)) {
        return this.libraryCache.get(selectedLibrary);
      }

      // Resolve library ID
      const resolution = await mcp__context7__resolve_library_id(selectedLibrary);
      
      if (resolution && resolution.length > 0) {
        const libraryId = resolution[0].id || resolution[0]['context7CompatibleLibraryID'];
        
        // Cache for future use
        this.libraryCache.set(selectedLibrary, libraryId);
        
        return libraryId;
      }

      return null;
    } catch (error) {
      console.error('Library resolution failed:', error);
      return null;
    }
  }

  async getSpecificationContext(productName, specs) {
    try {
      await this.init();
      
      if (!this.initialized) return null;

      const specQuery = `${productName} specifications ${Object.keys(specs || {}).join(' ')}`;
      return await this.getProductDocumentation(specQuery, 1500);
    } catch (error) {
      console.error('Specification context lookup failed:', error);
      return null;
    }
  }

  async getCompatibilityInfo(componentType, targetComponent) {
    try {
      await this.init();
      
      if (!this.initialized) return null;

      const compatibilityQuery = `${componentType} compatibility with ${targetComponent}`;
      return await this.getProductDocumentation(compatibilityQuery, 1000);
    } catch (error) {
      console.error('Compatibility info lookup failed:', error);
      return null;
    }
  }

  async getTroubleshootingInfo(productName, issue) {
    try {
      await this.init();
      
      if (!this.initialized) return null;

      const troubleshootingQuery = `${productName} troubleshooting ${issue} fix solution`;
      return await this.getProductDocumentation(troubleshootingQuery, 1500);
    } catch (error) {
      console.error('Troubleshooting info lookup failed:', error);
      return null;
    }
  }

  clearCache() {
    this.libraryCache.clear();
    console.log('Context7 library cache cleared');
  }
}

export default new Context7MCPClient();