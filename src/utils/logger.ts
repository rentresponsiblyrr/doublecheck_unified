type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Generic log data type for flexibility while maintaining some type safety
type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: LogData;
  context?: string;
  userId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
  private isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
  
  // Throttling to prevent console spam
  private logThrottle = new Map<string, number>();
  private readonly THROTTLE_MS = 1000;

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: LogData,
    context?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
      userId: this.getCurrentUserId()
    };
  }

  private getCurrentUserId(): string | undefined {
    // This would be implemented based on your auth system
    // For now, return undefined
    return undefined;
  }

  private shouldLogToConsole(message: string, level: LogLevel): boolean {
    // Always allow error and warn logs
    if (level === 'error' || level === 'warn') {
      return true;
    }
    
    // Block debug logs in production
    if (this.isProduction && level === 'debug') {
      return false;
    }
    
    // Throttle frequent logs
    const now = Date.now();
    const lastLog = this.logThrottle.get(message);
    if (lastLog && (now - lastLog) < this.THROTTLE_MS) {
      return false;
    }
    
    this.logThrottle.set(message, now);
    return true;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console with throttling
    if (this.shouldLogToConsole(entry.message, entry.level)) {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                           entry.level === 'warn' ? 'warn' : 'log';
      
      console[consoleMethod](
        `[${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`,
        entry.data || ''
      );
    }
  }

  debug(message: string, data?: LogData, context?: string) {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, data, context);
      this.addLog(entry);
    }
  }

  info(message: string, data?: LogData, context?: string) {
    const entry = this.createLogEntry('info', message, data, context);
    this.addLog(entry);
  }

  warn(message: string, data?: LogData, context?: string) {
    const entry = this.createLogEntry('warn', message, data, context);
    this.addLog(entry);
  }

  error(message: string, data?: LogData, context?: string) {
    const entry = this.createLogEntry('error', message, data, context);
    this.addLog(entry);

    // In production, you might want to send errors to a monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoringService(entry);
    }
  }

  private async sendToMonitoringService(entry: LogEntry) {
    // TODO: Integrate with error monitoring service like Sentry
    try {
      // Example implementation:
      // await fetch('/api/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance timing
  time(label: string) {
    console.time(label);
  }

  timeEnd(label: string) {
    console.timeEnd(label);
  }

  // User action tracking
  trackUserAction(action: string, data?: LogData) {
    this.info(`User action: ${action}`, data, 'USER_ACTION');
  }

  // API call tracking
  trackApiCall(method: string, url: string, duration?: number, error?: Error | string) {
    const message = `API ${method} ${url}${duration ? ` (${duration}ms)` : ''}`;
    
    if (error) {
      this.error(message, { error, duration }, 'API');
    } else {
      this.info(message, { duration }, 'API');
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports for common patterns
export const logApiCall = logger.trackApiCall.bind(logger);
export const logUserAction = logger.trackUserAction.bind(logger);
export const logError = logger.error.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logDebug = logger.debug.bind(logger);
