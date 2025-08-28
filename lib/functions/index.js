import CacheManager from '../cache/index.js';
import { db } from '../supabase/client.js';

export class FunctionRegistry {
  static functions = new Map();
  static initialized = false;

  static register(name, handler) {
    if (!handler.execute || typeof handler.execute !== 'function') {
      throw new Error(`Function ${name} must have an execute method`);
    }

    // Set defaults
    const fullHandler = {
      ttl: 300, // 5 minutes default cache
      fallbackResponse: `I'm having trouble with ${name}. Please try again or contact us directly.`,
      cacheable: true,
      async: false,
      ...handler
    };

    this.functions.set(name, fullHandler);
    console.log(`Registered function: ${name}`);
  }

  static get(name) {
    return this.functions.get(name);
  }

  static async execute(name, parameters, callContext = {}) {
    const handler = this.get(name);
    if (!handler) {
      throw new Error(`Function ${name} not found`);
    }

    const startTime = Date.now();

    try {
      // Generate cache key
      const cacheKey = CacheManager.generateFunctionKey(name, parameters);
      
      // Check cache first (if cacheable)
      if (handler.cacheable) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          await db.trackEvent('cache_hit', {
            function: name,
            parameters: parameters,
            cacheKey: cacheKey
          }, callContext.conversationId);
          
          return cached;
        }
      }

      // Execute function
      const result = await handler.execute(parameters, callContext);

      // Cache result (if cacheable and successful)
      if (handler.cacheable && result && !result.error) {
        await CacheManager.set(cacheKey, result, handler.ttl);
      }

      // Track execution
      const duration = Date.now() - startTime;
      await db.trackEvent('function_call', {
        function: name,
        duration: duration,
        success: true,
        parameters: parameters
      }, callContext.conversationId);

      return result;

    } catch (error) {
      console.error(`Function ${name} failed:`, error);

      // Track error
      const duration = Date.now() - startTime;
      await db.trackEvent('function_error', {
        function: name,
        duration: duration,
        error: error.message,
        parameters: parameters
      }, callContext.conversationId);

      // Return fallback
      return {
        error: true,
        message: handler.fallbackResponse,
        fallback: true
      };
    }
  }

  static async init() {
    if (this.initialized) return;

    // Import and register all functions
    const { default: inventoryFunctions } = await import('./inventory.js');
    const { default: appointmentFunctions } = await import('./appointments.js');
    const { default: orderFunctions } = await import('./orders.js');
    const { default: storeInfoFunctions } = await import('./store-info.js');
    const { default: liveProductFunctions } = await import('./live-product-search.js');
    const { default: customPCFunctions } = await import('./custom-pc-builder.js');
    const { default: trackingFunctions } = await import('./order-tracking.js');

    // Register all functions
    Object.entries(inventoryFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    Object.entries(appointmentFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    Object.entries(orderFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    Object.entries(storeInfoFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    Object.entries(liveProductFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    Object.entries(customPCFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    Object.entries(trackingFunctions).forEach(([name, handler]) => {
      this.register(name, handler);
    });

    this.initialized = true;
    console.log(`Function Registry initialized with ${this.functions.size} functions`);
  }

  static list() {
    return Array.from(this.functions.keys());
  }

  static getStats() {
    return {
      totalFunctions: this.functions.size,
      functionNames: this.list(),
      initialized: this.initialized
    };
  }
}

export default FunctionRegistry;