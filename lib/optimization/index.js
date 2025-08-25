import { db } from '../supabase/client.js';

export class CostOptimizer {
  static costAlertThreshold = parseFloat(process.env.COST_ALERT_THRESHOLD || '2.0');
  static monthlyBudget = parseFloat(process.env.MONTHLY_BUDGET || '330.0');

  // Cost per unit (in EUR)
  static costs = {
    ttsPerChar: 0.000018, // €0.18 per 1K characters (11Labs)
    sttPerSecond: 0.0004, // ~€0.024 per minute (Deepgram)
    llmPer1kTokens: 0.002, // GPT-4o-mini pricing
    vapiPerMinute: 0.05 // Vapi per-minute cost
  };

  // Response optimization patterns
  static responseOptimizations = {
    // Common long phrases to shorter equivalents
    'Thank you for calling Armenius Store': 'Thanks for calling Armenius',
    'Let me check that for you right away': 'Let me check that',
    'Is there anything else I can help you with today?': 'Anything else?',
    'I would be happy to assist you with': 'I can help with',
    'Please hold on for just a moment': 'One moment',
    'I apologize for the inconvenience': 'Sorry about that',
    'Your satisfaction is important to us': 'We value your business',

    // Greek equivalents
    'Ευχαριστώ που καλέσατε το Armenius Store': 'Ευχαριστώ που καλέσατε',
    'Περιμένετε λίγο να το ελέγξω': 'Μια στιγμή',
    'Μπορώ να σας βοηθήσω με κάτι άλλο;': 'Κάτι άλλο;'
  };

  static async optimizeResponse(text, language = 'en') {
    if (!process.env.ENABLE_COST_OPTIMIZATION === 'true') {
      return text;
    }

    let optimized = text;
    
    // Apply common optimizations
    for (const [long, short] of Object.entries(this.responseOptimizations)) {
      optimized = optimized.replace(new RegExp(long, 'gi'), short);
    }

    // Remove redundant phrases
    optimized = optimized
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/([.!?])\s*\1+/g, '$1') // Remove repeated punctuation
      .trim();

    // Track optimization savings
    if (optimized.length < text.length) {
      const savings = text.length - optimized.length;
      await db.trackEvent('response_optimization', {
        originalLength: text.length,
        optimizedLength: optimized.length,
        savings: savings,
        costSavings: savings * this.costs.ttsPerChar,
        language: language
      });
    }

    return optimized;
  }

  static async selectModel(queryComplexity, functionName) {
    if (!process.env.ENABLE_COST_OPTIMIZATION === 'true') {
      return 'gpt-4o-mini'; // Default model
    }

    const simplePatterns = [
      'store hours', 'location', 'phone', 'contact',
      'ώρες', 'τοποθεσία', 'τηλέφωνο', 'επικοινωνία'
    ];

    const isSimple = simplePatterns.some(pattern => 
      functionName.toLowerCase().includes(pattern)
    );

    // Use cheaper model for simple queries
    if (isSimple || queryComplexity === 'simple') {
      return 'gpt-3.5-turbo';
    }

    return 'gpt-4o-mini';
  }

  static async shouldUseCache(functionName, parameters) {
    // Static information should always be cached
    const alwaysCachePatterns = [
      'store', 'hours', 'location', 'contact', 'directions'
    ];

    if (alwaysCachePatterns.some(pattern => 
      functionName.toLowerCase().includes(pattern))) {
      return true;
    }

    // Time-sensitive functions with shorter cache
    const shortCachePatterns = [
      'inventory', 'price', 'stock'
    ];

    if (shortCachePatterns.some(pattern => 
      functionName.toLowerCase().includes(pattern))) {
      return true; // Will use function-specific TTL
    }

    // Never cache appointments and orders
    const noCachePatterns = [
      'appointment', 'order', 'booking'
    ];

    return !noCachePatterns.some(pattern => 
      functionName.toLowerCase().includes(pattern));
  }

  static async calculateCallCost(usage) {
    const costs = {
      tts: (usage.ttsCharacters || 0) * this.costs.ttsPerChar,
      stt: (usage.sttSeconds || 0) * this.costs.sttPerSecond,
      llm: (usage.llmTokens || 0) / 1000 * this.costs.llmPer1kTokens,
      vapi: (usage.vapiMinutes || 0) * this.costs.vapiPerMinute
    };

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return {
      breakdown: costs,
      total: parseFloat(totalCost.toFixed(4)),
      currency: 'EUR'
    };
  }

  static async trackCallCost(vapiCallId, usage) {
    try {
      const costData = await this.calculateCallCost(usage);
      
      // Update conversation with cost data
      await db.updateCallCost(vapiCallId, costData.total, costData.breakdown);

      // Check if cost exceeds threshold
      if (costData.total > this.costAlertThreshold) {
        await this.sendCostAlert(vapiCallId, costData);
      }

      // Track cost analytics
      await db.trackEvent('call_cost_calculated', {
        vapiCallId: vapiCallId,
        ...costData,
        usage: usage
      });

      return costData;

    } catch (error) {
      console.error('Error tracking call cost:', error);
      return null;
    }
  }

  static async sendCostAlert(vapiCallId, costData) {
    console.warn(`🚨 High cost call detected: ${vapiCallId} - €${costData.total}`);
    
    await db.trackEvent('cost_alert', {
      vapiCallId: vapiCallId,
      cost: costData.total,
      threshold: this.costAlertThreshold,
      breakdown: costData.breakdown
    });

    // In production, this would send actual alerts (Slack, email, etc.)
    if (process.env.SLACK_WEBHOOK_URL) {
      // await sendSlackAlert(vapiCallId, costData);
    }
  }

  static async getDailyCostReport(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: conversations, error } = await db.supabase
        .from('conversations')
        .select('cost, started_at, resolution_status')
        .gte('started_at', startOfDay.toISOString())
        .lte('started_at', endOfDay.toISOString())
        .not('cost', 'is', null);

      if (error) throw error;

      const totalCost = conversations.reduce((sum, conv) => sum + (conv.cost || 0), 0);
      const avgCost = conversations.length > 0 ? totalCost / conversations.length : 0;
      const highCostCalls = conversations.filter(conv => conv.cost > this.costAlertThreshold).length;

      return {
        date: date.toISOString().split('T')[0],
        totalCalls: conversations.length,
        totalCost: parseFloat(totalCost.toFixed(2)),
        averageCost: parseFloat(avgCost.toFixed(2)),
        highCostCalls: highCostCalls,
        monthlyProjection: parseFloat((totalCost * 30).toFixed(2)),
        budgetUsed: parseFloat((totalCost / this.monthlyBudget * 100).toFixed(1))
      };

    } catch (error) {
      console.error('Error generating cost report:', error);
      return null;
    }
  }

  static async getOptimizationSuggestions() {
    const suggestions = [];

    try {
      // Analyze recent high-cost calls
      const { data: highCostCalls } = await db.supabase
        .from('conversations')
        .select('cost, functions_called, duration_seconds')
        .gt('cost', this.costAlertThreshold)
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('cost', { ascending: false })
        .limit(10);

      if (highCostCalls && highCostCalls.length > 0) {
        const avgHighCost = highCostCalls.reduce((sum, call) => sum + call.cost, 0) / highCostCalls.length;
        
        suggestions.push({
          type: 'high_cost_calls',
          priority: 'high',
          description: `${highCostCalls.length} calls exceeded cost threshold in the last 7 days (avg €${avgHighCost.toFixed(2)})`,
          recommendation: 'Review conversation flows for optimization opportunities'
        });
      }

      // Check cache hit rate
      const { data: cacheEvents } = await db.supabase
        .from('analytics_events')
        .select('event_type')
        .in('event_type', ['cache_hit', 'cache_miss'])
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(1000);

      if (cacheEvents && cacheEvents.length > 0) {
        const cacheHits = cacheEvents.filter(e => e.event_type === 'cache_hit').length;
        const hitRate = (cacheHits / cacheEvents.length * 100).toFixed(1);
        
        if (hitRate < 60) {
          suggestions.push({
            type: 'low_cache_hit_rate',
            priority: 'medium',
            description: `Cache hit rate is ${hitRate}% (last 24h)`,
            recommendation: 'Consider increasing cache TTL for frequently requested data'
          });
        }
      }

      return suggestions;

    } catch (error) {
      console.error('Error getting optimization suggestions:', error);
      return [];
    }
  }
}

export default CostOptimizer;