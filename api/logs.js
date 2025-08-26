/**
 * API endpoint for receiving frontend logs
 * Processes and stores log entries from the React frontend
 */

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logEntry = req.body;
    
    // Validate log entry structure
    if (!logEntry || !logEntry.level || !logEntry.message) {
      return res.status(400).json({ error: 'Invalid log entry format' });
    }

    // In production, you would:
    // 1. Send to logging service (e.g., Winston, Sentry, etc.)
    // 2. Store in database if needed
    // 3. Apply log filtering/routing based on level
    
    // For now, just log to console (visible in Vercel logs)
    const timestamp = new Date().toISOString();
    const logLevel = logEntry.level.toUpperCase();
    const source = logEntry.source || 'frontend';
    
    console.log(`[${timestamp}] [${logLevel}] [${source}] ${logEntry.message}`, {
      data: logEntry.data,
      timestamp: logEntry.timestamp,
      userAgent: logEntry.data?.userAgent
    });

    // For error level logs, you might want to alert or store differently
    if (logEntry.level === 'error') {
      console.error('FRONTEND ERROR:', {
        message: logEntry.message,
        timestamp,
        data: logEntry.data,
        stack: logEntry.data?.error?.stack
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Log entry received',
      timestamp 
    });

  } catch (error) {
    console.error('Failed to process log entry:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process log entry' 
    });
  }
}