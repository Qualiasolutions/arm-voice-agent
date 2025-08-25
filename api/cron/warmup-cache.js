import CacheManager from '../../lib/cache/index.js';
import { db } from '../../lib/supabase/client.js';

// Cron job to warm up cache with common responses
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('Starting cache warmup...');
    
    // Initialize cache manager
    await CacheManager.init();
    
    // Warm up common responses
    await CacheManager.warmup();
    
    // Pre-cache frequently requested products
    const popularProducts = [
      'RTX 4090',
      'RTX 4080', 
      'Intel i9',
      'AMD Ryzen 9',
      'RTX 4070'
    ];

    let productsCached = 0;
    for (const product of popularProducts) {
      try {
        const products = await db.searchProducts(product, 3);
        if (products && products.length > 0) {
          const cacheKey = CacheManager.generateProductKey(product);
          await CacheManager.set(cacheKey, products, 1800); // 30 minutes
          productsCached++;
        }
      } catch (error) {
        console.error(`Failed to cache product ${product}:`, error.message);
      }
    }

    // Cache business hours in both languages
    const businessHours = {
      en: 'We are open Monday to Friday 9am-7pm, Saturday 9am-2pm, closed Sunday',
      el: 'Είμαστε ανοιχτά Δευτέρα έως Παρασκευή 9π.μ.-7μ.μ., Σάββατο 9π.μ.-2μ.μ., Κυριακή κλειστά'
    };

    for (const [lang, hours] of Object.entries(businessHours)) {
      await CacheManager.set(`store:hours:${lang}`, { message: hours }, 86400); // 24 hours
    }

    const duration = Date.now() - startTime;
    
    // Track cache warmup
    await db.trackEvent('cache_warmup', {
      duration: duration,
      productsCached: productsCached,
      success: true
    });

    console.log(`Cache warmup completed in ${duration}ms. Cached ${productsCached} popular products.`);

    return res.status(200).json({
      success: true,
      duration: duration,
      productsCached: productsCached,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache warmup failed:', error);

    // Track failure
    await db.trackEvent('cache_warmup_error', {
      error: error.message,
      duration: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}