import CostOptimizer from '../../lib/optimization/index.js';
import Monitor from '../../lib/monitoring/index.js';
import { db } from '../../lib/supabase/client.js';

// Daily report generation cron job
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const reportDate = new Date();
  reportDate.setDate(reportDate.getDate() - 1); // Yesterday's report

  try {
    console.log(`Generating daily report for ${reportDate.toISOString().split('T')[0]}`);

    // Get cost analysis
    const costReport = await CostOptimizer.getDailyCostReport(reportDate);
    
    // Get dashboard metrics
    const metrics = await Monitor.getDashboardMetrics();
    
    // Get optimization suggestions
    const suggestions = await CostOptimizer.getOptimizationSuggestions();
    
    // System health check
    const health = await Monitor.checkSystemHealth();

    // Calculate key performance indicators
    const kpis = await calculateKPIs(reportDate);

    const report = {
      date: reportDate.toISOString().split('T')[0],
      summary: {
        totalCalls: metrics?.today?.totalCalls || 0,
        totalCost: costReport?.totalCost || 0,
        averageCost: costReport?.averageCost || 0,
        resolutionRate: metrics?.today?.resolutionRate || 0,
        customerSatisfaction: metrics?.today?.avgSatisfaction || 0
      },
      performance: {
        callVolume: {
          total: metrics?.today?.totalCalls || 0,
          change: metrics?.comparison?.callsChange || 0,
          trend: (metrics?.comparison?.callsChange || 0) >= 0 ? 'up' : 'down'
        },
        costs: costReport,
        systemHealth: health,
        kpis: kpis
      },
      insights: {
        topFunctions: await getTopFunctions(reportDate),
        peakHours: await getPeakHours(reportDate),
        languageBreakdown: await getLanguageBreakdown(reportDate),
        resolutionBreakdown: await getResolutionBreakdown(reportDate)
      },
      recommendations: suggestions,
      generatedAt: new Date().toISOString(),
      reportDuration: Date.now() - startTime
    };

    // Store report in database
    await db.trackEvent('daily_report_generated', {
      reportDate: report.date,
      summary: report.summary,
      recommendations: report.recommendations.length,
      duration: report.reportDuration
    });

    // In production, send report via email/slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackReport(report);
    }

    console.log(`Daily report generated successfully in ${report.reportDuration}ms`);

    return res.status(200).json({
      success: true,
      report: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Daily report generation failed:', error);

    await db.trackEvent('daily_report_error', {
      error: error.message,
      reportDate: reportDate.toISOString().split('T')[0],
      duration: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions
async function calculateKPIs(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: conversations } = await db.supabase
      .from('conversations')
      .select('*')
      .gte('started_at', startOfDay.toISOString())
      .lte('started_at', endOfDay.toISOString());

    if (!conversations || conversations.length === 0) {
      return {
        automationRate: 0,
        averageHandleTime: 0,
        firstCallResolution: 0,
        costEfficiency: 0
      };
    }

    const resolvedCalls = conversations.filter(c => c.resolution_status === 'resolved').length;
    const totalDuration = conversations.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
    const totalCost = conversations.reduce((sum, c) => sum + (c.cost || 0), 0);
    const avgCost = totalCost / conversations.length;

    return {
      automationRate: ((resolvedCalls / conversations.length) * 100).toFixed(1),
      averageHandleTime: Math.round(totalDuration / conversations.length),
      firstCallResolution: ((resolvedCalls / conversations.length) * 100).toFixed(1),
      costEfficiency: avgCost < 0.40 ? 'Good' : avgCost < 0.60 ? 'Fair' : 'Needs Improvement'
    };

  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return {};
  }
}

async function getTopFunctions(date) {
  try {
    const { data: events } = await db.supabase
      .from('analytics_events')
      .select('properties')
      .eq('event_type', 'function_execution')
      .gte('timestamp', date.toISOString())
      .lt('timestamp', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const functionCounts = {};
    events?.forEach(event => {
      const functionName = event.properties?.functionName;
      if (functionName) {
        functionCounts[functionName] = (functionCounts[functionName] || 0) + 1;
      }
    });

    return Object.entries(functionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

  } catch (error) {
    console.error('Error getting top functions:', error);
    return [];
  }
}

async function getPeakHours(date) {
  try {
    const { data: conversations } = await db.supabase
      .from('conversations')
      .select('started_at')
      .gte('started_at', date.toISOString())
      .lt('started_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const hourCounts = {};
    conversations?.forEach(conv => {
      const hour = new Date(conv.started_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

  } catch (error) {
    console.error('Error getting peak hours:', error);
    return [];
  }
}

async function getLanguageBreakdown(date) {
  try {
    const { data: conversations } = await db.supabase
      .from('conversations')
      .select('language_detected')
      .gte('started_at', date.toISOString())
      .lt('started_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const languageCounts = { en: 0, el: 0, unknown: 0 };
    conversations?.forEach(conv => {
      const lang = conv.language_detected || 'unknown';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    return languageCounts;

  } catch (error) {
    console.error('Error getting language breakdown:', error);
    return { en: 0, el: 0, unknown: 0 };
  }
}

async function getResolutionBreakdown(date) {
  try {
    const { data: conversations } = await db.supabase
      .from('conversations')
      .select('resolution_status')
      .gte('started_at', date.toISOString())
      .lt('started_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const statusCounts = {};
    conversations?.forEach(conv => {
      const status = conv.resolution_status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return statusCounts;

  } catch (error) {
    console.error('Error getting resolution breakdown:', error);
    return {};
  }
}

async function sendSlackReport(report) {
  // Mock Slack report - in production would send to actual webhook
  console.log('📊 Daily Report Summary:');
  console.log(`📞 Total Calls: ${report.summary.totalCalls}`);
  console.log(`💰 Total Cost: €${report.summary.totalCost}`);
  console.log(`✅ Resolution Rate: ${report.summary.resolutionRate}%`);
  console.log(`😊 Customer Satisfaction: ${report.summary.customerSatisfaction}/5`);
  
  if (report.recommendations.length > 0) {
    console.log(`💡 ${report.recommendations.length} optimization recommendations available`);
  }
}