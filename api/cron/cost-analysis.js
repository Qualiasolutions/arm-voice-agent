import CostOptimizer from '../../lib/optimization/index.js';
import { db } from '../../lib/supabase/client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const report = await CostOptimizer.getDailyCostReport(new Date());
    const suggestions = await CostOptimizer.getOptimizationSuggestions();

    await db.trackEvent('cost_analysis_run', {
      date: report?.date,
      totalCalls: report?.totalCalls ?? 0,
      totalCost: report?.totalCost ?? 0,
      suggestions: suggestions.length,
      duration: Date.now() - startTime
    });

    return res.status(200).json({
      success: true,
      report,
      suggestions,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    await db.trackEvent('cost_analysis_error', {
      error: error.message,
      duration: Date.now() - startTime
    });

    return res.status(500).json({ success: false, error: error.message });
  }
}
