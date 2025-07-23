/**
 * Logger utility for application-wide logging
 */

// Type definitions for logging system
type LogLevel = "debug" | "info" | "warn" | "error";
type LogData = string | number | boolean | object | null | undefined | Error;
type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: LogData;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logs: LogEntry[] = [];

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: LogData,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: LogData,
  ): void {
    const entry = this.createLogEntry(level, message, context, data);
    this.logs.push(entry);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console output in development
    if (this.isDevelopment) {
      const contextStr = context ? `[${context}]` : "";

      logMethod(`${contextStr} ${message}`, data || "");
    }
  }

  debug(message: string, context?: string, data?: LogData): void {
    this.log("debug", message, context, data);
  }

  info(message: string, context?: string, data?: LogData): void {
    this.log("info", message, context, data);
  }

  warn(message: string, context?: string, data?: LogData): void {
    this.log("warn", message, context, data);
  }

  error(message: string, context?: string, data?: LogData): void {
    this.log("error", message, context, data);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
export default logger;
