/**
 * @fileoverview Enterprise Service Tracer
 * Integrates distributed tracing with business service operations
 * 
 * This service provides seamless integration between the enterprise tracing
 * infrastructure and actual business operations, ensuring every critical
 * operation is properly traced and monitored.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import DistributedTracer from '../tracing/distributed-tracer';
import APMIntegration from '../monitoring/apm-integration';
import { log } from '../logging/enterprise-logger';

export interface ServiceTracingOptions {
  userId?: string;
  sessionId?: string;
  critical?: boolean;
  tags?: Record<string, string | number | boolean>;
  timeout?: number;
}

export interface DatabaseTracingOptions extends ServiceTracingOptions {
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  query?: string;
}

export interface APITracingOptions extends ServiceTracingOptions {
  retries?: number;
  expectedStatus?: number[];
}

class EnterpriseServiceTracer {
  private static instance: EnterpriseServiceTracer;
  private tracer: DistributedTracer;
  private apm: APMIntegration;

  private constructor() {
    this.tracer = DistributedTracer.getInstance();
    this.apm = APMIntegration.getInstance();
  }

  static getInstance(): EnterpriseServiceTracer {
    if (!EnterpriseServiceTracer.instance) {
      EnterpriseServiceTracer.instance = new EnterpriseServiceTracer();
    }
    return EnterpriseServiceTracer.instance;
  }

  /**
   * Trace a business service operation
   */
  async traceServiceOperation<T>(
    serviceName: string,
    operationName: string,
    operation: () => Promise<T>,
    options: ServiceTracingOptions = {}
  ): Promise<T> {
    const fullOperationName = `${serviceName}.${operationName}`;
    
    return this.tracer.trace(
      fullOperationName,
      'business-service',
      async (context) => {
        const startTime = performance.now();
        
        try {
          // Record service operation start
          this.apm.incrementCounter('service.operations.started', 1, {
            service: serviceName,
            operation: operationName,
            critical: String(options.critical || false),
          });

          const result = await operation();
          
          const duration = performance.now() - startTime;
          
          // Record successful operation
          this.apm.recordTiming(`service.${serviceName}.${operationName}.duration`, duration, {
            service: serviceName,
            operation: operationName,
            status: 'success',
          });
          
          this.apm.incrementCounter('service.operations.completed', 1, {
            service: serviceName,
            operation: operationName,
            status: 'success',
          });

          log.info('Service operation completed successfully', {
            service: serviceName,
            operation: operationName,
            duration_ms: Math.round(duration),
            correlationId: context.correlationId,
            component: 'enterprise-service-tracer',
          }, 'SERVICE_OPERATION_SUCCESS');

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          // Record failed operation
          this.apm.recordTiming(`service.${serviceName}.${operationName}.duration`, duration, {
            service: serviceName,
            operation: operationName,
            status: 'error',
          });
          
          this.apm.incrementCounter('service.operations.failed', 1, {
            service: serviceName,
            operation: operationName,
            error_type: error instanceof Error ? error.constructor.name : 'unknown',
          });

          log.error('Service operation failed', error as Error, {
            service: serviceName,
            operation: operationName,
            duration_ms: Math.round(duration),
            correlationId: context.correlationId,
            component: 'enterprise-service-tracer',
          }, 'SERVICE_OPERATION_ERROR');

          throw error;
        }
      },
      options
    );
  }

  /**
   * Trace database operations with enhanced monitoring
   */
  async traceDatabaseOperation<T>(
    operation: () => Promise<T>,
    options: DatabaseTracingOptions = {}
  ): Promise<T> {
    const query = options.query || 'unknown';
    const table = options.table || 'unknown';
    const dbOperation = options.operation || 'unknown';

    return this.tracer.traceDatabase(
      query,
      async () => {
        const startTime = performance.now();
        
        try {
          // Record database operation start
          this.apm.incrementCounter('database.operations.started', 1, {
            table,
            operation: dbOperation,
            critical: String(options.critical || false),
          });

          const result = await operation();
          
          const duration = performance.now() - startTime;
          
          // Record successful database operation
          this.apm.recordTiming('database.query.duration', duration, {
            table,
            operation: dbOperation,
            status: 'success',
          });
          
          this.apm.incrementCounter('database.operations.completed', 1, {
            table,
            operation: dbOperation,
            status: 'success',
          });

          // Alert on slow queries
          if (duration > 5000) { // 5 seconds
            log.warn('Slow database query detected', {
              table,
              operation: dbOperation,
              duration_ms: Math.round(duration),
              query: query.substring(0, 100),
              component: 'enterprise-service-tracer',
            }, 'SLOW_DATABASE_QUERY');
          }

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          // Record failed database operation
          this.apm.recordTiming('database.query.duration', duration, {
            table,
            operation: dbOperation,
            status: 'error',
          });
          
          this.apm.incrementCounter('database.operations.failed', 1, {
            table,
            operation: dbOperation,
            error_type: error instanceof Error ? error.constructor.name : 'unknown',
          });

          throw error;
        }
      },
      { table, operation_type: options.operation }
    );
  }

  /**
   * Trace external API calls
   */
  async traceAPICall<T>(
    url: string,
    method: string,
    operation: () => Promise<T>,
    options: APITracingOptions = {}
  ): Promise<T> {
    return this.tracer.traceAPI(
      url,
      method,
      async () => {
        const startTime = performance.now();
        
        try {
          // Record API call start
          this.apm.incrementCounter('api.calls.started', 1, {
            method: method.toUpperCase(),
            host: new URL(url).hostname,
            critical: String(options.critical || false),
          });

          const result = await operation();
          
          const duration = performance.now() - startTime;
          
          // Record successful API call
          this.apm.recordTiming('api.call.duration', duration, {
            method: method.toUpperCase(),
            host: new URL(url).hostname,
            status: 'success',
          });
          
          this.apm.incrementCounter('api.calls.completed', 1, {
            method: method.toUpperCase(),
            host: new URL(url).hostname,
            status: 'success',
          });

          // Alert on slow API calls
          if (duration > 10000) { // 10 seconds
            log.warn('Slow API call detected', {
              url,
              method: method.toUpperCase(),
              duration_ms: Math.round(duration),
              component: 'enterprise-service-tracer',
            }, 'SLOW_API_CALL');
          }

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          // Record failed API call
          this.apm.recordTiming('api.call.duration', duration, {
            method: method.toUpperCase(),
            host: new URL(url).hostname,
            status: 'error',
          });
          
          this.apm.incrementCounter('api.calls.failed', 1, {
            method: method.toUpperCase(),
            host: new URL(url).hostname,
            error_type: error instanceof Error ? error.constructor.name : 'unknown',
          });

          throw error;
        }
      },
      { timeout: options.timeout, retries: options.retries }
    );
  }

  /**
   * Trace cache operations
   */
  async traceCacheOperation<T>(
    key: string,
    operation: 'get' | 'set' | 'delete' | 'clear',
    cacheOperation: () => Promise<T>,
    options: ServiceTracingOptions = {}
  ): Promise<T> {
    return this.tracer.traceCache(
      key,
      operation,
      async () => {
        const startTime = performance.now();
        
        try {
          // Record cache operation start
          this.apm.incrementCounter('cache.operations.started', 1, {
            operation,
            critical: String(options.critical || false),
          });

          const result = await cacheOperation();
          
          const duration = performance.now() - startTime;
          
          // Record successful cache operation
          this.apm.recordTiming('cache.operation.duration', duration, {
            operation,
            status: 'success',
          });
          
          this.apm.incrementCounter('cache.operations.completed', 1, {
            operation,
            status: 'success',
          });

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          // Record failed cache operation
          this.apm.recordTiming('cache.operation.duration', duration, {
            operation,
            status: 'error',
          });
          
          this.apm.incrementCounter('cache.operations.failed', 1, {
            operation,
            error_type: error instanceof Error ? error.constructor.name : 'unknown',
          });

          throw error;
        }
      }
    );
  }

  /**
   * Start a user session trace
   */
  startUserSession(userId: string, sessionId: string): void {
    log.userAction('session_started', userId, {
      sessionId,
      timestamp: new Date().toISOString(),
      component: 'enterprise-service-tracer',
    });

    this.apm.recordGauge('user.sessions.active', 1, {
      userId,
      sessionId,
    });
  }

  /**
   * End a user session trace
   */
  endUserSession(userId: string, sessionId: string, duration: number): void {
    log.userAction('session_ended', userId, {
      sessionId,
      duration_ms: Math.round(duration),
      timestamp: new Date().toISOString(),
      component: 'enterprise-service-tracer',
    });

    this.apm.recordTiming('user.session.duration', duration, {
      userId,
      sessionId,
    });

    this.apm.recordGauge('user.sessions.active', -1, {
      userId,
      sessionId,
    });
  }

  /**
   * Track user actions
   */
  trackUserAction(
    action: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): void {
    log.userAction(action, userId, {
      ...metadata,
      component: 'enterprise-service-tracer',
    });

    this.apm.incrementCounter('user.actions', 1, {
      action,
      userId,
    });
  }

  /**
   * Track business events
   */
  trackBusinessEvent(
    event: string,
    value?: number,
    dimensions: Record<string, string> = {}
  ): void {
    log.businessEvent(event, value, dimensions);

    this.apm.recordMetric(
      `business.events.${event}`,
      value || 1,
      'counter',
      dimensions
    );
  }

  /**
   * Get comprehensive service health metrics
   */
  getServiceHealth(): {
    services: Record<string, {
      status: 'healthy' | 'degraded' | 'unhealthy';
      avgResponseTime: number;
      errorRate: number;
      throughput: number;
    }>;
    infrastructure: {
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
      uptime: number;
    };
    alerts: Array<{
      severity: string;
      message: string;
      timestamp: number;
    }>;
  } {
    const realTimeMetrics = this.apm.getRealTimeMetrics();
    const spanMetrics = this.tracer.getSpanMetrics();

    const services: Record<string, any> = {};
    
    // Aggregate service health from span metrics
    spanMetrics.forEach(metric => {
      const serviceName = metric.component;
      if (!services[serviceName]) {
        services[serviceName] = {
          status: 'healthy',
          avgResponseTime: 0,
          errorRate: 0,
          throughput: 0,
        };
      }

      services[serviceName].avgResponseTime = Math.max(
        services[serviceName].avgResponseTime,
        metric.avgDuration
      );
      services[serviceName].errorRate = Math.max(
        services[serviceName].errorRate,
        metric.errorRate
      );
      services[serviceName].throughput += metric.throughput;

      // Determine health status
      if (metric.errorRate > 0.05 || metric.avgDuration > 5000) {
        services[serviceName].status = 'unhealthy';
      } else if (metric.errorRate > 0.01 || metric.avgDuration > 2000) {
        services[serviceName].status = 'degraded';
      }
    });

    return {
      services,
      infrastructure: realTimeMetrics.infrastructure,
      alerts: [], // Would come from actual alerting system
    };
  }
}

export const enterpriseServiceTracer = EnterpriseServiceTracer.getInstance();
export default enterpriseServiceTracer;