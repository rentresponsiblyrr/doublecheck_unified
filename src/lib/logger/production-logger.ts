interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  error?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
}

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

interface ErrorTrackingPayload {
  level: string;
  message: string;
  context?: LogContext;
  timestamp: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
  buildVersion?: string;
  userId?: string;
  sessionId?: string;
}

export class ProductionLogger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: number;
  private sessionId: string;

  constructor() {
    this.logLevel = this.isDevelopment ? 3 : 1; // Debug in dev, warn+ in prod
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  error(message: string, context?: LogContext): void {
    this.log("ERROR", message, context);

    // Production: Send to error tracking
    if (!this.isDevelopment) {
      this.sendToErrorTracking("error", message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.logLevel >= 1) {
      this.log("WARN", message, context);
    }

    // Production: Send warnings to monitoring
    if (!this.isDevelopment) {
      this.sendToErrorTracking("warning", message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.logLevel >= 2) {
      this.log("INFO", message, context);
    }

    // Production: Send to analytics service
    if (!this.isDevelopment && context?.action) {
      this.sendToAnalytics(message, context);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.logLevel >= 3) {
      this.log("DEBUG", message, context);
    }
  }

  private log(level: string, message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const enrichedContext = {
        ...context,
        sessionId: this.sessionId,
        timestamp,
      };

      const contextStr = enrichedContext
        ? JSON.stringify(enrichedContext, null, 2)
        : "";

      switch (level) {
        case "ERROR":
          console.error(`[${timestamp}] [${level}] ${message}`, contextStr);
          break;
        case "WARN":
          console.warn(`[${timestamp}] [${level}] ${message}`, contextStr);
          break;
        case "INFO":
          console.info(`[${timestamp}] [${level}] ${message}`, contextStr);
          break;
        case "DEBUG":
          console.log(`[${timestamp}] [${level}] ${message}`, contextStr);
          break;
        default:
          console.log(`[${timestamp}] [${level}] ${message}`, contextStr);
      }
    }
  }

  private sendToErrorTracking(
    level: string,
    message: string,
    context?: LogContext,
  ): void {
    try {
      const payload: ErrorTrackingPayload = {
        level,
        message,
        context: {
          ...context,
          sessionId: this.sessionId,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        buildVersion: import.meta.env.VITE_BUILD_VERSION || "unknown",
        userId: context?.userId,
        sessionId: this.sessionId,
      };

      // In production, this would integrate with services like:
      // - Sentry: Sentry.captureException(new Error(message), { contexts: { custom: context } })
      // - DataDog: DD_LOGS.logger.error(message, context)
      // - CloudWatch: cloudWatchLogs.putLogEvents(payload)
      // - LogRocket: LogRocket.captureException(new Error(message))

      // Only send to external logging service in production
      if (!this.isDevelopment) {
        fetch("/api/logs/errors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": this.sessionId,
          },
          body: JSON.stringify(payload),
        }).catch(() => {
          // Fail silently if logging service is down
          // Could implement local storage buffering here
        });
      }
    } catch {
      // Fail silently in production to not break user experience
    }
  }

  private sendToAnalytics(message: string, context?: LogContext): void {
    try {
      const analyticsPayload = {
        event: context?.action || "user_action",
        properties: {
          message,
          component: context?.component,
          userId: context?.userId,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          url: window.location.pathname,
          metadata: context?.metadata,
        },
      };

      // In production, integrate with analytics services like:
      // - Google Analytics: gtag('event', event_name, properties)
      // - Mixpanel: mixpanel.track(event_name, properties)
      // - Amplitude: amplitude.getInstance().logEvent(event_name, properties)
      // - PostHog: posthog.capture(event_name, properties)

      // Only send to external analytics service in production
      if (!this.isDevelopment) {
        fetch("/api/analytics/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": this.sessionId,
          },
          body: JSON.stringify(analyticsPayload),
        }).catch(() => {
          // Fail silently for analytics
        });
      }
    } catch {
      // Fail silently in production
    }
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...context,
      action: "performance_measurement",
      metadata: { operation, duration },
    });

    // Send performance data to monitoring
    if (!this.isDevelopment) {
      this.sendPerformanceMetrics(operation, duration, context);
    }
  }

  private sendPerformanceMetrics(
    operation: string,
    duration: number,
    context?: LogContext,
  ): void {
    try {
      fetch("/api/metrics/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": this.sessionId,
        },
        body: JSON.stringify({
          operation,
          duration,
          timestamp: new Date().toISOString(),
          component: context?.component,
          sessionId: this.sessionId,
          metadata: context?.metadata,
        }),
      }).catch(() => {
        // Fail silently
      });
    } catch {
      // Fail silently in production
    }
  }

  // User action tracking
  userAction(
    action: string,
    component: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.info(`User action: ${action}`, {
      component,
      action: "user_interaction",
      metadata,
    });
  }

  // API request logging
  apiRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
    context?: LogContext,
  ): void {
    const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;

    if (level === "error") {
      this.error(message, { ...context, action: "api_request" });
    } else if (level === "warn") {
      this.warn(message, { ...context, action: "api_request" });
    } else {
      this.info(message, { ...context, action: "api_request" });
    }
  }
}

export const logger = new ProductionLogger();
