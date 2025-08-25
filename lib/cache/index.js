import { Redis } from '@upstash/redis';
import { LRUCache } from 'lru-cache';

export class CacheManager {
  static redis = null;
  static memory = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes default
    allowStale: true
  });

  static initialized = false;

  static async init() {
    if (this.initialized) return;

    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.redis = Redis.fromEnv();
        console.log('Redis cache initialized');
      } else {
        console.warn('Redis not configured, using memory cache only');
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }

    this.initialized = true;
  }

  static async get(key) {
    await this.init();

    // L1: Memory cache
    const memCached = this.memory.get(key);
    if (memCached) {
      await this.trackCacheHit('memory', key);
      return memCached;
    }

    // L2: Redis cache
    if (this.redis) {
      try {
        const redisCached = await this.redis.get(key);
        if (redisCached) {
          // Store in memory for faster access
          this.memory.set(key, redisCached);
          await this.trackCacheHit('redis', key);
          return redisCached;
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    await this.trackCacheMiss(key);
    return null;
  }

  static async set(key, value, ttl = 300) {
    await this.init();

    // Set in both caches
    this.memory.set(key, value, { ttl: ttl * 1000 });

    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
  }

  static async del(key) {
    await this.init();

    this.memory.delete(key);

    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }
  }

  // Cache key generators
  static generateFunctionKey(functionName, parameters) {
    const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
    return `func:${functionName}:${Buffer.from(paramStr).toString('base64')}`;
  }

  static generateProductKey(query) {
    return `product:${query.toLowerCase().replace(/\s+/g, '-')}`;
  }

  static generateAppointmentKey(date, serviceType) {
    return `appointment:${date}:${serviceType}`;
  }

  // Pre-cache common responses
  static async warmup() {
    console.log('Warming up cache...');

    const commonResponses = [
      {
        key: 'store:hours:en',
        value: {
          message: 'We are open Monday to Friday 9am-7pm, Saturday 9am-2pm.',
          cached: true
        },
        ttl: 86400 // 24 hours
      },
      {
        key: 'store:hours:el',
        value: {
          message: 'Είμαστε ανοιχτά Δευτέρα έως Παρασκευή 9π.μ.-7μ.μ., Σάββατο 9π.μ.-2μ.μ.',
          cached: true
        },
        ttl: 86400
      },
      {
        key: 'store:location:en',
        value: {
          message: 'We are located at 171 Makarios Avenue in Nicosia, Cyprus.',
          cached: true
        },
        ttl: 86400
      },
      {
        key: 'store:location:el',
        value: {
          message: 'Βρισκόμαστε στη Λεωφόρο Μακαρίου 171 στη Λευκωσία, Κύπρος.',
          cached: true
        },
        ttl: 86400
      },
      {
        key: 'store:phone:en',
        value: {
          message: 'You can also reach us at 77-111-104.',
          cached: true
        },
        ttl: 86400
      },
      {
        key: 'store:phone:el',
        value: {
          message: 'Μπορείτε επίσης να μας καλέσετε στο 77-111-104.',
          cached: true
        },
        ttl: 86400
      }
    ];

    for (const item of commonResponses) {
      await this.set(item.key, item.value, item.ttl);
    }

    console.log(`Cached ${commonResponses.length} common responses`);
  }

  // Analytics helpers
  static async trackCacheHit(layer, key) {
    // This would be imported from analytics module to avoid circular dependency
    console.log(`Cache hit (${layer}): ${key}`);
  }

  static async trackCacheMiss(key) {
    console.log(`Cache miss: ${key}`);
  }

  // Cache stats
  static getStats() {
    return {
      memory: {
        size: this.memory.size,
        max: this.memory.max,
        hits: this.memory.hits || 0,
        misses: this.memory.misses || 0
      },
      redis: {
        connected: !!this.redis,
        initialized: this.initialized
      }
    };
  }

  // Clean expired entries
  static async cleanup() {
    // LRU handles this automatically, but we can force it
    this.memory.purgeStale();
    
    if (this.redis) {
      // Redis handles expiration automatically
      console.log('Cache cleanup completed');
    }
  }
}

export default CacheManager;