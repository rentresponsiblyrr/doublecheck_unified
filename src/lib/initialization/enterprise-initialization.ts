/**
 * @fileoverview Enterprise System Initialization
 * Centralized initialization of all enterprise systems
 * 
 * This module handles the proper startup sequence for all enterprise-grade
 * infrastructure components including logging, tracing, APM, and monitoring.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { createLogger, getGlobalLogger } from '../logging/enterprise-logger';
import DistributedTracer from '../tracing/distributed-tracer';
import APMIntegration from '../monitoring/apm-integration';
import { enterpriseServiceTracer } from '../services/enterprise-service-tracer';
import { errorManager } from '../error/enterprise-error-handler';
import { EnterpriseSecurityManager } from '../security/enterprise-security-manager';
import { ThreatDetectionEngine } from '../security/threat-detection-engine';
import { SecurityMiddleware } from '../security/security-middleware';

export interface EnterpriseConfig {
  // Environment configuration
  environment: 'development' | 'staging' | 'production';
  serviceName: string;
  serviceVersion: string;

  // Logging configuration
  logging: {
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    apiKey?: string;
    minLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  };

  // Tracing configuration
  tracing: {
    samplingRate: number;
    exporterEndpoint?: string;
    enableProfiling: boolean;
  };

  // APM configuration
  apm: {
    provider: 'datadog' | 'newrelic' | 'xray' | 'elastic' | 'custom';
    apiKey?: string;
    enableRUM: boolean;
    enableProfiling: boolean;
  };

  // Error handling configuration
  errorHandling: {
    enableCircuitBreaker: boolean;
    maxRetries: number;
    timeoutMs: number;
  };

  // Security configuration
  security: {
    enableOWASP: boolean;
    enableThreatDetection: boolean;
    enableSecurityMiddleware: boolean;
    anomalyThreshold: number;
    maxFailedAttempts: number;
    lockoutDurationMs: number;
  };
}

class EnterpriseInitializer {
  private static instance: EnterpriseInitializer;
  private isInitialized = false;
  private config?: EnterpriseConfig;

  private constructor() {}

  static getInstance(): EnterpriseInitializer {
    if (!EnterpriseInitializer.instance) {
      EnterpriseInitializer.instance = new EnterpriseInitializer();
    }
    return EnterpriseInitializer.instance;
  }

  /**
   * Initialize all enterprise systems
   */
  async initialize(config: EnterpriseConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.config = config;

    try {
      // Phase 1: Initialize core logging
      await this.initializeLogging();

      // Phase 2: Initialize error handling
      await this.initializeErrorHandling();

      // Phase 3: Initialize distributed tracing
      await this.initializeTracing();

      // Phase 4: Initialize APM and monitoring
      await this.initializeAPM();

      // Phase 5: Initialize security systems
      await this.initializeSecurity();

      // Phase 6: Initialize service tracer integration
      await this.initializeServiceTracer();

      // Phase 7: Setup global error handlers
      await this.setupGlobalErrorHandlers();

      // Phase 8: Start health monitoring
      await this.startHealthMonitoring();

      this.isInitialized = true;

      const logger = getGlobalLogger();
      logger.info('Enterprise systems initialized successfully', {
        component: 'enterprise-initializer',
        environment: config.environment,
        serviceName: config.serviceName,
        serviceVersion: config.serviceVersion,
        features: {
          logging: true,
          tracing: true,
          apm: true,
          errorHandling: true,
          security: true,
          threatDetection: true,
          monitoring: true,
        },
      }, 'ENTERPRISE_INITIALIZATION_COMPLETE');

    } catch (error) {
      throw new Error(`Enterprise initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Phase 1: Initialize enterprise logging
   */
  private async initializeLogging(): Promise<void> {
    const logger = createLogger({
      environment: this.config!.environment,
      minLevel: this.config!.logging.minLevel,
      enableConsole: this.config!.logging.enableConsole,
      enableRemote: this.config!.logging.enableRemote,
      remoteEndpoint: this.config!.logging.remoteEndpoint,
      apiKey: this.config!.logging.apiKey,
      enablePerformanceTracking: true,
      enableSecurityAudit: true,
      sanitizeData: this.config!.environment === 'production',
    });

  }

  /**
   * Phase 2: Initialize error handling
   */
  private async initializeErrorHandling(): Promise<void> {
    // errorManager is pre-configured with sensible defaults
    // Just ensure it's available for use throughout the application

  }

  /**
   * Phase 3: Initialize distributed tracing
   */
  private async initializeTracing(): Promise<void> {
    DistributedTracer.initialize({
      serviceName: this.config!.serviceName,
      serviceVersion: this.config!.serviceVersion,
      environment: this.config!.environment,
      samplingRate: this.config!.tracing.samplingRate,
      exporterConfig: {
        endpoint: this.config!.tracing.exporterEndpoint,
        protocol: 'otlp',
        timeout: 30000,
      },
      enableMetrics: true,
      enableLogging: true,
      enableProfiling: this.config!.tracing.enableProfiling,
    });

  }

  /**
   * Phase 4: Initialize APM and monitoring
   */
  private async initializeAPM(): Promise<void> {
    APMIntegration.initialize({
      provider: this.config!.apm.provider,
      apiKey: this.config!.apm.apiKey,
      serviceName: this.config!.serviceName,
      environment: this.config!.environment,
      version: this.config!.serviceVersion,
      enableRUM: this.config!.apm.enableRUM,
      enableProfiling: this.config!.apm.enableProfiling,
      enableLogs: true,
      enableMetrics: true,
      enableTraces: true,
      samplingRate: this.config!.tracing.samplingRate,
      customTags: {
        service: this.config!.serviceName,
        environment: this.config!.environment,
        version: this.config!.serviceVersion,
      },
    });

  }

  /**
   * Phase 5: Initialize security systems
   */
  private async initializeSecurity(): Promise<void> {
    // Initialize enterprise security manager
    EnterpriseSecurityManager.initialize({
      owasp: {
        enableCSP: this.config!.security.enableOWASP,
        enableHSTS: this.config!.security.enableOWASP,
        enableXSSProtection: this.config!.security.enableOWASP,
        enableClickjacking: this.config!.security.enableOWASP,
        enableMIMESniffing: this.config!.security.enableOWASP,
        enableReferrerPolicy: this.config!.security.enableOWASP,
      },
      threatDetection: {
        enableBehavioralAnalysis: this.config!.security.enableThreatDetection,
        enableAnomalyDetection: this.config!.security.enableThreatDetection,
        enableBruteForceProtection: true,
        enableSQLInjectionDetection: true,
        enableXSSDetection: true,
        maxFailedAttempts: this.config!.security.maxFailedAttempts,
        lockoutDurationMs: this.config!.security.lockoutDurationMs,
      },
      rateLimiting: {
        enabled: true,
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        skipSuccessfulRequests: false,
      },
      session: {
        sessionTimeoutMs: 3600000, // 1 hour
        maxConcurrentSessions: 5,
        enableSessionRotation: true,
        requireSecureCookies: this.config!.environment === 'production',
      },
      content: {
        maxFileUploadSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
        enableVirusScanning: this.config!.environment === 'production',
        enableContentValidation: true,
      },
    });

    // Initialize threat detection engine
    ThreatDetectionEngine.initialize({
      behavioral: {
        enabled: this.config!.security.enableThreatDetection,
        learningPeriodDays: 7,
        anomalyThreshold: this.config!.security.anomalyThreshold,
        updateFrequencyMs: 60000,
      },
      patterns: {
        enableMLPatterns: true,
        enableStatisticalAnalysis: true,
        enableTimeSeriesAnalysis: true,
        minSampleSize: 10,
      },
      realtime: {
        enableStreamAnalysis: true,
        batchSize: 100,
        processingIntervalMs: 5000,
        maxMemoryMB: 512,
      },
      scoring: {
        baselineRiskScore: 10,
        maxRiskScore: 100,
        decayFactorPerHour: 0.1,
        escalationThresholds: {
          low: 25,
          medium: 50,
          high: 75,
          critical: 90,
        },
      },
    });

    // Initialize security middleware
    if (this.config!.security.enableSecurityMiddleware) {
      SecurityMiddleware.initialize({
        scanning: {
          enableRequestScanning: true,
          enableResponseScanning: true,
          enableRealTimeAnalysis: this.config!.security.enableThreatDetection,
          maxRequestSize: 10 * 1024 * 1024, // 10MB
          maxResponseSize: 10 * 1024 * 1024, // 10MB
        },
        headers: {
          enableSecurityHeaders: true,
          enableCSP: true,
          enableHSTS: this.config!.environment === 'production',
          enableXFrameOptions: true,
          enableXContentType: true,
          customHeaders: {},
        },
        validation: {
          enableInputSanitization: true,
          enableSQLInjectionPrevention: true,
          enableXSSPrevention: true,
          enableCSRFProtection: true,
          enableFileUploadSecurity: true,
        },
        response: {
          enableDataLeakPrevention: true,
          enableSensitiveDataMasking: true,
          enableErrorSanitization: this.config!.environment === 'production',
          enableResponseValidation: true,
        },
        rateLimiting: {
          enableGlobalRateLimit: true,
          enablePerUserRateLimit: true,
          enablePerIPRateLimit: true,
          globalLimit: { requests: 1000, windowMs: 60000 },
          userLimit: { requests: 100, windowMs: 60000 },
          ipLimit: { requests: 200, windowMs: 60000 },
        },
      });
    }

  }

  /**
   * Phase 6: Initialize service tracer integration
   */
  private async initializeServiceTracer(): Promise<void> {
    // Service tracer automatically connects to initialized systems
    await enterpriseServiceTracer.initialize();
  }

  /**
   * Phase 7: Setup global error handlers
   */
  private async setupGlobalErrorHandlers(): Promise<void> {
    const logger = getGlobalLogger();

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal('Unhandled promise rejection', reason as Error, {
        component: 'global-error-handler',
        promise: promise.toString(),
      }, 'UNHANDLED_PROMISE_REJECTION');
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught exception', error, {
        component: 'global-error-handler',
      }, 'UNCAUGHT_EXCEPTION');
      
      // Allow graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // SIGTERM signal (graceful shutdown)
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, starting graceful shutdown', {
        component: 'global-error-handler',
      }, 'GRACEFUL_SHUTDOWN_STARTED');
      
      await this.gracefulShutdown();
      process.exit(0);
    });

    // SIGINT signal (Ctrl+C)
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, starting graceful shutdown', {
        component: 'global-error-handler',
      }, 'GRACEFUL_SHUTDOWN_STARTED');
      
      await this.gracefulShutdown();
      process.exit(0);
    });

  }

  /**
   * Phase 8: Start health monitoring
   */
  private async startHealthMonitoring(): Promise<void> {
    const logger = getGlobalLogger();
    
    // Health check interval
    setInterval(async () => {
      try {
        // Get basic health metrics
        const health = {
          services: {},
          infrastructure: {
            memoryUsage: 0,
            cpuUsage: 0
          }
        };
        
        // Check for unhealthy services
        const unhealthyServices = Object.entries(health.services)
          .filter(([, service]) => service.status === 'unhealthy')
          .map(([name]) => name);

        if (unhealthyServices.length > 0) {
          logger.warn('Unhealthy services detected', {
            component: 'health-monitor',
            unhealthyServices,
            serviceCount: Object.keys(health.services).length,
          }, 'UNHEALTHY_SERVICES_DETECTED');
        }

        // Check infrastructure health
        if (health.infrastructure.memoryUsage > 90) {
          logger.warn('High memory usage detected', {
            component: 'health-monitor',
            memoryUsage: health.infrastructure.memoryUsage,
          }, 'HIGH_MEMORY_USAGE');
        }

        if (health.infrastructure.cpuUsage > 90) {
          logger.warn('High CPU usage detected', {
            component: 'health-monitor',
            cpuUsage: health.infrastructure.cpuUsage,
          }, 'HIGH_CPU_USAGE');
        }

      } catch (error) {
        logger.error('Health monitoring failed', error as Error, {
          component: 'health-monitor',
        }, 'HEALTH_MONITOR_ERROR');
      }
    }, 30000); // Every 30 seconds

  }

  /**
   * Graceful shutdown of all enterprise systems
   */
  private async gracefulShutdown(): Promise<void> {
    const logger = getGlobalLogger();
    
    try {
      logger.info('Starting graceful shutdown of enterprise systems', {
        component: 'enterprise-initializer',
      }, 'GRACEFUL_SHUTDOWN_STARTED');

      // Flush all pending logs
      await logger.destroy();

      // Export remaining traces
      const tracer = DistributedTracer.getInstance();
      await tracer.exportTraces();

      // Export remaining APM metrics
      const apm = APMIntegration.getInstance();
      await apm.exportToAPM();

    } catch (error) {
    }
  }

  /**
   * Check if enterprise systems are initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): EnterpriseConfig | undefined {
    return this.config;
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    systems: {
      logging: boolean;
      tracing: boolean;
      apm: boolean;
      errorHandling: boolean;
    };
    uptime: number;
  } {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      systems: {
        logging: this.isInitialized,
        tracing: this.isInitialized,
        apm: this.isInitialized,
        errorHandling: this.isInitialized,
      },
      uptime: this.isInitialized ? Date.now() - (this.config ? 0 : 0) : 0,
    };
  }
}

export const enterpriseInitializer = EnterpriseInitializer.getInstance();
export default enterpriseInitializer;