type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DebugLogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 500;

  log(level: LogLevel, context: string, message: string, data?: any) {
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with context
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 'log';
    
    console[consoleMethod](
      `🔍 [${level.toUpperCase()}] [${context}] ${message}`,
      data || ''
    );
  }

  debug(context: string, message: string, data?: any) {
    this.log('debug', context, message, data);
  }

  info(context: string, message: string, data?: any) {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: any) {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: any) {
    this.log('error', context, message, data);
  }

  getRecentLogs(count = 50): DebugLogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const debugLogger = new DebugLogger();
