import { db } from '../supabase/client.js';

export class Monitor {
  static alertThresholds = {
    responseTime: 1000, // ms
    errorRate: 0.05, // 5%
    costPerCall: parseFloat(process.env.COST_ALERT_THRESHOLD || '2.0'),
    dailyCost: parseFloat(process.env.DAILY_COST_LIMIT || '50.0')
  };

  // Track events with multiple destinations
  static async trackEvent(eventType, properties = {}, conversationId = null) {
    const eventData = {
      event_type: eventType,
      conversation_id: conversationId,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    try {
      // Send to Supabase (primary storage)
      await this.sendToSupabase(eventData);

      // Send to external analytics (if configured)
      if (process.env.POSTHOG_API_KEY) {
        await this.sendToPostHog(eventType, properties, conversationId);
      }

      // Send to Vercel Analytics (if available)
      if (typeof window !== 'undefined' && window.va) {
        window.va('track', eventType, properties);
      }

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  static async sendToSupabase(eventData) {
    try {
      await db.trackEvent(
        eventData.event_type,
        eventData.properties,
        eventData.conversation_id
      );
    } catch (error) {
      console.error('Supabase event tracking error:', error);
    }
  }

  static async sendToPostHog(eventType, properties, conversationId) {
    try {
      // PostHog integration (would require actual implementation)
      const postHogData = {
        event: eventType,
        properties: {
          ...properties,
          conversation_id: conversationId,
          $timestamp: new Date().toISOString()
        },
        distinct_id: conversationId || `anonymous_${Date.now()}`
      };

      // In production, send to PostHog API
      console.log('PostHog event:', postHogData);

    } catch (error) {
      console.error('PostHog event tracking error:', error);
    }
  }

  // Performance monitoring
  static async checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };

    try {
      // Database connectivity
      const dbStart = Date.now();
      const { data, error } = await db.supabase.from('conversations').select('count').limit(1);
      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - dbStart,
        error: error?.message
      };

      // Recent error rate
      const errorRate = await this.getRecentErrorRate();
      health.checks.errorRate = {
        status: errorRate > this.alertThresholds.errorRate ? 'warning' : 'healthy',
        value: errorRate,
        threshold: this.alertThresholds.errorRate
      };

      // Average response time
      const avgResponseTime = await this.getAverageResponseTime();
      health.checks.responseTime = {
        status: avgResponseTime > this.alertThresholds.responseTime ? 'warning' : 'healthy',
        value: avgResponseTime,
        threshold: this.alertThresholds.responseTime
      };

      // Daily cost check
      const dailyCost = await this.getDailyCost();
      health.checks.dailyCost = {
        status: dailyCost > this.alertThresholds.dailyCost ? 'warning' : 'healthy',
        value: dailyCost,
        threshold: this.alertThresholds.dailyCost
      };

      // Determine overall status
      const hasUnhealthy = Object.values(health.checks).some(check => check.status === 'unhealthy');
      const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
      
      health.status = hasUnhealthy ? 'unhealthy' : hasWarnings ? 'warning' : 'healthy';

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  static async getRecentErrorRate(hoursBack = 1) {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hoursBack);

      const { data: events, error } = await db.supabase
        .from('analytics_events')
        .select('event_type')
        .gte('timestamp', since.toISOString())
        .in('event_type', ['function_execution', 'function_execution_error', 'webhook_error']);

      if (error) throw error;

      const totalEvents = events.length;
      const errorEvents = events.filter(e => 
        e.event_type.includes('error') || e.event_type.includes('fail')
      ).length;

      return totalEvents > 0 ? errorEvents / totalEvents : 0;

    } catch (error) {
      console.error('Error calculating error rate:', error);
      return 0;
    }
  }

  static async getAverageResponseTime(hoursBack = 1) {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hoursBack);

      const { data: events, error } = await db.supabase
        .from('analytics_events')
        .select('properties')
        .eq('event_type', 'function_execution')
        .gte('timestamp', since.toISOString());

      if (error) throw error;

      const responseTimes = events
        .map(e => e.properties?.processingTime)
        .filter(time => typeof time === 'number');

      if (responseTimes.length === 0) return 0;

      return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    } catch (error) {
      console.error('Error calculating average response time:', error);
      return 0;
    }
  }

  static async getDailyCost(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: conversations, error } = await db.supabase
        .from('conversations')
        .select('cost')
        .gte('started_at', startOfDay.toISOString())
        .lte('started_at', endOfDay.toISOString())
        .not('cost', 'is', null);

      if (error) throw error;

      return conversations.reduce((sum, conv) => sum + (conv.cost || 0), 0);

    } catch (error) {
      console.error('Error calculating daily cost:', error);
      return 0;
    }
  }

  // Real-time dashboard metrics
  static async getDashboardMetrics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Today's stats
      const { data: todayConversations, error: todayError } = await db.supabase
        .from('conversations')
        .select('*')
        .gte('started_at', today.toISOString());

      if (todayError) throw todayError;

      // Yesterday's stats for comparison
      const { data: yesterdayConversations, error: yesterdayError } = await db.supabase
        .from('conversations')
        .select('*')
        .gte('started_at', yesterday.toISOString())
        .lt('started_at', today.toISOString());

      if (yesterdayError) throw yesterdayError;

      const todayStats = this.calculateStats(todayConversations);
      const yesterdayStats = this.calculateStats(yesterdayConversations);

      return {
        today: todayStats,
        yesterday: yesterdayStats,
        comparison: {
          callsChange: todayStats.totalCalls - yesterdayStats.totalCalls,
          costChange: todayStats.totalCost - yesterdayStats.totalCost,
          satisfactionChange: todayStats.avgSatisfaction - yesterdayStats.avgSatisfaction
        },
        realtime: {
          activeCallsCount: await this.getActiveCallsCount(),
          systemHealth: await this.checkSystemHealth()
        }
      };

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return null;
    }
  }

  static calculateStats(conversations) {
    const totalCalls = conversations.length;
    const totalCost = conversations.reduce((sum, conv) => sum + (conv.cost || 0), 0);
    const avgDuration = conversations.length > 0 
      ? conversations.reduce((sum, conv) => sum + (conv.duration_seconds || 0), 0) / conversations.length 
      : 0;
    
    const resolvedCalls = conversations.filter(conv => conv.resolution_status === 'resolved').length;
    const resolutionRate = totalCalls > 0 ? resolvedCalls / totalCalls : 0;

    const satisfactionRatings = conversations
      .map(conv => conv.customer_satisfaction)
      .filter(rating => rating !== null && rating !== undefined);
    
    const avgSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;

    return {
      totalCalls,
      totalCost: parseFloat(totalCost.toFixed(2)),
      avgCost: totalCalls > 0 ? parseFloat((totalCost / totalCalls).toFixed(2)) : 0,
      avgDuration: Math.round(avgDuration),
      resolutionRate: parseFloat((resolutionRate * 100).toFixed(1)),
      avgSatisfaction: parseFloat(avgSatisfaction.toFixed(1))
    };
  }

  static async getActiveCallsCount() {
    try {
      const { data: activeCalls, error } = await db.supabase
        .from('conversations')
        .select('id')
        .is('ended_at', null)
        .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

      if (error) throw error;
      return activeCalls.length;

    } catch (error) {
      console.error('Error getting active calls count:', error);
      return 0;
    }
  }

  // Alert functions
  static async checkAndSendAlerts() {
    const health = await this.checkSystemHealth();
    
    if (health.status === 'unhealthy' || health.status === 'warning') {
      await this.sendAlert('system_health', health);
    }

    // Check for high-cost calls
    const recentHighCostCalls = await this.getHighCostCalls();
    if (recentHighCostCalls.length > 0) {
      await this.sendAlert('high_cost_calls', recentHighCostCalls);
    }
  }

  static async getHighCostCalls(hoursBack = 1) {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hoursBack);

      const { data: calls, error } = await db.supabase
        .from('conversations')
        .select('*')
        .gt('cost', this.alertThresholds.costPerCall)
        .gte('started_at', since.toISOString());

      if (error) throw error;
      return calls;

    } catch (error) {
      console.error('Error getting high cost calls:', error);
      return [];
    }
  }

  static async sendAlert(type, data) {
    console.warn(`🚨 Alert: ${type}`, data);

    // Track alert
    await this.trackEvent('alert_sent', {
      alertType: type,
      alertData: data,
      severity: this.getAlertSeverity(type, data)
    });

    // In production, send to actual alert channels
    if (process.env.SLACK_WEBHOOK_URL) {
      // await this.sendSlackAlert(type, data);
    }

    if (process.env.SENTRY_DSN) {
      // await this.sendSentryAlert(type, data);
    }
  }

  static getAlertSeverity(type, data) {
    if (type === 'system_health' && data.status === 'unhealthy') return 'critical';
    if (type === 'high_cost_calls' && data.length > 5) return 'high';
    return 'medium';
  }

  // Export dashboard URLs and configurations
  static getDashboardLinks() {
    const supabaseProject = process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0];
    
    return {
      supabase: `https://app.supabase.com/project/${supabaseProject}/editor`,
      analytics: process.env.POSTHOG_API_KEY ? 'https://posthog.com' : null,
      costs: 'https://platform.openai.com/usage',
      vapi: 'https://dashboard.vapi.ai/analytics',
      platform: 'https://your-platform.com/dashboard' // Update with your deployment platform
    };
  }
}

export default Monitor;