type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Debug data type for structured debugging information
type DebugData = Record<string, unknown> | string | number | boolean | null | undefined;

interface DebugLogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: DebugData;
}

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 500;

  log(level: LogLevel, context: string, message: string, data?: DebugData) {
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

    // DISABLED: Console output to prevent infinite loops
    // const consoleMethod = level === 'error' ? 'error' : 
    //                      level === 'warn' ? 'warn' : 'log';
    // 
    // console[consoleMethod](
    //   `🔍 [${level.toUpperCase()}] [${context}] ${message}`,
    //   data || ''
    // );
  }

  debug(context: string, message: string, data?: DebugData) {
    this.log('debug', context, message, data);
  }

  info(context: string, message: string, data?: DebugData) {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: DebugData) {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: DebugData) {
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
