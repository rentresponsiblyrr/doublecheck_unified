/**
 * @fileoverview Enterprise Correlation Manager
 * Distributed tracing system with correlation IDs for microservices-grade observability
 * 
 * Features:
 * - Automatic correlation ID generation and propagation
 * - Request context isolation with AsyncLocalStorage
 * - Distributed tracing across service boundaries
 * - Performance timing and metric collection
 * - Memory-efficient trace buffering with sampling
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

// Browser-compatible implementations
const performance = globalThis.performance || window.performance || {
  now: () => Date.now()
};

// Simple context storage for browser (fallback for AsyncLocalStorage)
class BrowserAsyncLocalStorage<T> {
  private store: T | undefined;
  
  getStore(): T | undefined {
    return this.store;
  }
  
  run<R>(store: T, callback: () => R): R {
    const previousStore = this.store;
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = previousStore;
    }
  }
}

export interface CorrelationContext {
  correlationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  component: string;
  userId?: string;
  sessionId?: string;
  requestPath?: string;
  userAgent?: string;
  ipAddress?: string;
  tags: Record<string, string | number | boolean>;
  logs: TraceLog[];
  metrics: TraceMetrics;
}

export interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: Record<string, unknown>;
  eventType?: string;
}

export interface TraceMetrics {
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  dbQueries?: number;
  apiCalls?: number;
  cacheHits?: number;
  cacheMisses?: number;
  errors?: number;
  warnings?: number;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  component: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, unknown>;
  logs: TraceLog[];
  status: 'ok' | 'error' | 'timeout' | 'cancelled';
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

class CorrelationManager {
  private static instance: CorrelationManager;
  private asyncLocalStorage = new BrowserAsyncLocalStorage<CorrelationContext>();
  private activeSpans = new Map<string, TraceSpan>();
  private completedTraces: TraceSpan[] = [];
  private maxTraceBuffer = 10000;
  private samplingRate = 1.0; // 100% sampling in development, 1-10% in production
  private metricsCollectionEnabled = true;

  private constructor() {
    // Initialize background trace flushing
    this.startTraceFlushingScheduler();
  }

  static getInstance(): CorrelationManager {
    if (!CorrelationManager.instance) {
      CorrelationManager.instance = new CorrelationManager();
    }
    return CorrelationManager.instance;
  }

  /**
   * Generate a new correlation ID using high-entropy random values
   */
  generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2);
    const random2 = Math.random().toString(36).substring(2);
    return `${timestamp}-${random1}-${random2}`;
  }

  /**
   * Generate a new trace ID (UUID v4 format)
   */
  generateTraceId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a new span ID
   */
  generateSpanId(): string {
    return Math.random().toString(36).substring(2, 18);
  }

  /**
   * Start a new trace with correlation context
   */
  startTrace(
    operationName: string,
    component: string,
    options: {
      userId?: string;
      sessionId?: string;
      requestPath?: string;
      userAgent?: string;
      ipAddress?: string;
      tags?: Record<string, string | number | boolean>;
      parentContext?: Partial<CorrelationContext>;
    } = {}
  ): CorrelationContext {
    const traceId = options.parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const correlationId = options.parentContext?.correlationId || this.generateCorrelationId();

    const context: CorrelationContext = {
      correlationId,
      traceId,
      spanId,
      parentSpanId: options.parentContext?.spanId,
      operationName,
      startTime: performance.now(),
      component,
      userId: options.userId,
      sessionId: options.sessionId,
      requestPath: options.requestPath,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
      tags: options.tags || {},
      logs: [],
      metrics: {
        dbQueries: 0,
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 0,
        warnings: 0,
      },
    };

    // Create span tracking
    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId: context.parentSpanId,
      operationName,
      component,
      startTime: context.startTime,
      tags: { ...context.tags },
      logs: [],
      status: 'ok',
    };

    this.activeSpans.set(spanId, span);

    return context;
  }

  /**
   * Execute operation within correlation context
   */
  async withCorrelation<T>(
    context: CorrelationContext,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.asyncLocalStorage.run(context, async () => {
        try {
          const result = await operation();
          this.finishTrace(context, 'ok');
          resolve(result);
        } catch (error) {
          this.finishTrace(context, 'error', error as Error);
          reject(error);
        }
      });
    });
  }

  /**
   * Get current correlation context
   */
  getCurrentContext(): CorrelationContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Add log entry to current trace
   */
  addLog(
    level: TraceLog['level'],
    message: string,
    context: Record<string, unknown> = {},
    eventType?: string
  ): void {
    const currentContext = this.getCurrentContext();
    if (!currentContext) return;

    const log: TraceLog = {
      timestamp: performance.now(),
      level,
      message,
      context,
      eventType,
    };

    currentContext.logs.push(log);

    // Also update the span
    const span = this.activeSpans.get(currentContext.spanId);
    if (span) {
      span.logs.push(log);
    }

    // Update metrics
    if (level === 'error') {
      currentContext.metrics.errors = (currentContext.metrics.errors || 0) + 1;
    } else if (level === 'warn') {
      currentContext.metrics.warnings = (currentContext.metrics.warnings || 0) + 1;
    }
  }

  /**
   * Add tags to current trace
   */
  addTags(tags: Record<string, string | number | boolean>): void {
    const currentContext = this.getCurrentContext();
    if (!currentContext) return;

    Object.assign(currentContext.tags, tags);

    // Also update the span
    const span = this.activeSpans.get(currentContext.spanId);
    if (span) {
      Object.assign(span.tags, tags);
    }
  }

  /**
   * Increment metrics counters
   */
  incrementMetric(metric: keyof TraceMetrics, increment: number = 1): void {
    const currentContext = this.getCurrentContext();
    if (!currentContext || !this.metricsCollectionEnabled) return;

    const currentValue = currentContext.metrics[metric] as number || 0;
    (currentContext.metrics as any)[metric] = currentValue + increment;
  }

  /**
   * Record performance metrics
   */
  recordMetrics(): void {
    const currentContext = this.getCurrentContext();
    if (!currentContext || !this.metricsCollectionEnabled) return;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      currentContext.metrics.memoryUsage = process.memoryUsage();
    }

    if (typeof process !== 'undefined' && process.cpuUsage) {
      currentContext.metrics.cpuUsage = process.cpuUsage();
    }
  }

  /**
   * Finish current trace
   */
  finishTrace(
    context: CorrelationContext,
    status: TraceSpan['status'] = 'ok',
    error?: Error
  ): void {
    const endTime = performance.now();
    const duration = endTime - context.startTime;

    context.metrics.duration = duration;
    this.recordMetrics();

    const span = this.activeSpans.get(context.spanId);
    if (span) {
      span.endTime = endTime;
      span.duration = duration;
      span.status = status;

      if (error) {
        span.error = {
          type: error.constructor.name,
          message: error.message,
          stack: error.stack,
        };
      }

      // Move to completed traces
      this.activeSpans.delete(context.spanId);
      
      // Apply sampling
      if (Math.random() <= this.samplingRate) {
        this.completedTraces.push(span);
        this.enforceBufferLimit();
      }
    }
  }

  /**
   * Create child span from current context
   */
  createChildSpan(operationName: string, component: string): CorrelationContext | null {
    const parentContext = this.getCurrentContext();
    if (!parentContext) return null;

    return this.startTrace(operationName, component, {
      parentContext,
      userId: parentContext.userId,
      sessionId: parentContext.sessionId,
      tags: { ...parentContext.tags },
    });
  }

  /**
   * Get HTTP headers for distributed tracing
   */
  getTracingHeaders(): Record<string, string> {
    const context = this.getCurrentContext();
    if (!context) return {};

    return {
      'X-Correlation-ID': context.correlationId,
      'X-Trace-ID': context.traceId,
      'X-Span-ID': context.spanId,
      'X-Parent-Span-ID': context.parentSpanId || '',
    };
  }

  /**
   * Extract tracing context from HTTP headers
   */
  extractFromHeaders(headers: Record<string, string>): Partial<CorrelationContext> | null {
    const correlationId = headers['x-correlation-id'] || headers['X-Correlation-ID'];
    const traceId = headers['x-trace-id'] || headers['X-Trace-ID'];
    const spanId = headers['x-span-id'] || headers['X-Span-ID'];
    const parentSpanId = headers['x-parent-span-id'] || headers['X-Parent-Span-ID'];

    if (!correlationId || !traceId) return null;

    return {
      correlationId,
      traceId,
      spanId,
      parentSpanId: parentSpanId || undefined,
    };
  }

  /**
   * Get completed traces for export
   */
  getCompletedTraces(): TraceSpan[] {
    return [...this.completedTraces];
  }

  /**
   * Clear completed traces
   */
  clearCompletedTraces(): void {
    this.completedTraces = [];
  }

  /**
   * Get active spans count
   */
  getActiveSpansCount(): number {
    return this.activeSpans.size;
  }

  /**
   * Set sampling rate (0.0 to 1.0)
   */
  setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Enable/disable metrics collection
   */
  setMetricsCollection(enabled: boolean): void {
    this.metricsCollectionEnabled = enabled;
  }

  /**
   * Enforce buffer size limits
   */
  private enforceBufferLimit(): void {
    if (this.completedTraces.length > this.maxTraceBuffer) {
      // Remove oldest traces (FIFO)
      const excess = this.completedTraces.length - this.maxTraceBuffer;
      this.completedTraces.splice(0, excess);
    }
  }

  /**
   * Start background trace flushing
   */
  private startTraceFlushingScheduler(): void {
    // In a real production environment, this would flush to:
    // - OpenTelemetry collector
    // - Jaeger
    // - Zipkin
    // - AWS X-Ray
    // - DataDog APM
    setInterval(() => {
      const traceCount = this.completedTraces.length;
      if (traceCount > 100) {
        // In production, export traces here
        console.debug(`[CorrelationManager] ${traceCount} traces ready for export`);
      }
    }, 30000); // Every 30 seconds
  }
}

export const correlationManager = CorrelationManager.getInstance();
export default correlationManager;