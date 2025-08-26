/**
 * Production-ready logging utility for Armenius Voice Assistant
 * Handles different log levels and environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  source: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      source: 'frontend'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warn and error
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    
    return true;
  }

  private async sendToBackend(entry: LogEntry) {
    if (!this.isProduction) return;

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fail silently - don't break the app if logging fails
      console.warn('Failed to send log to backend:', error);
    }
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('debug')) return;

    const entry = this.formatMessage('debug', message, data);
    console.debug('🐛', entry.message, data);
    
    // Don't send debug logs to backend
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('info')) return;

    const entry = this.formatMessage('info', message, data);
    console.info('ℹ️', entry.message, data);
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('warn')) return;

    const entry = this.formatMessage('warn', message, data);
    console.warn('⚠️', entry.message, data);
    this.sendToBackend(entry);
  }

  error(message: string, error?: Error | any, data?: any) {
    if (!this.shouldLog('error')) return;

    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };

    const entry = this.formatMessage('error', message, errorData);
    console.error('❌', entry.message, errorData);
    this.sendToBackend(entry);
  }

  // Specific methods for voice assistant events
  voiceEvent(event: string, data?: any) {
    this.info(`Voice Event: ${event}`, data);
  }

  voiceError(message: string, error?: Error, data?: any) {
    this.error(`Voice Error: ${message}`, error, data);
  }

  apiCall(endpoint: string, method: string, duration?: number) {
    this.debug(`API Call: ${method} ${endpoint}`, { duration });
  }

  apiError(endpoint: string, method: string, error: any) {
    this.error(`API Error: ${method} ${endpoint}`, error);
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;