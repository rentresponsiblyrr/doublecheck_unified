import { supabase } from '../supabase';
import { env } from '../config/environment';
import { errorReporter } from '../monitoring/error-reporter';
import { performanceTracker } from '../monitoring/performance-tracker';

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
  lastChecked: string;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: SystemHealthCheck[];
  summary: {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    unhealthyChecks: number;
    avgResponseTime: number;
  };
  recommendations?: string[];
}

export interface AIServiceConfig {
  name: string;
  endpoint: string;
  apiKey: string;
  timeout: number;
}

export class SystemHealthValidator {
  private static instance: SystemHealthValidator;
  private healthChecks: Map<string, SystemHealthCheck> = new Map();

  private constructor() {}

  static getInstance(): SystemHealthValidator {
    if (!SystemHealthValidator.instance) {
      SystemHealthValidator.instance = new SystemHealthValidator();
    }
    return SystemHealthValidator.instance;
  }

  /**
   * Perform comprehensive system health check
   */
  async performFullHealthCheck(): Promise<SystemHealthReport> {
    const startTime = Date.now();
    
    try {
      // Run all health checks in parallel
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkAIServices(),
        this.checkFileUpload(),
        this.checkVideoProcessing(),
        this.checkMobileCompatibility(),
        this.checkOfflineCapabilities(),
        this.checkAuthenticationSystem(),
        this.checkEnvironmentConfiguration(),
      ]);

      const healthChecks = checks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const componentNames = [
            'database',
            'ai_services',
            'file_upload',
            'video_processing',
            'mobile_compatibility',
            'offline_capabilities',
            'authentication',
            'environment_config',
          ];

          return {
            component: componentNames[index] || 'unknown',
            status: 'unhealthy' as const,
            responseTime: Date.now() - startTime,
            error: result.reason?.message || 'Unknown error',
            lastChecked: new Date().toISOString(),
          };
        }
      });

      // Calculate summary
      const summary = {
        totalChecks: healthChecks.length,
        healthyChecks: healthChecks.filter(c => c.status === 'healthy').length,
        degradedChecks: healthChecks.filter(c => c.status === 'degraded').length,
        unhealthyChecks: healthChecks.filter(c => c.status === 'unhealthy').length,
        avgResponseTime: healthChecks.reduce((sum, c) => sum + c.responseTime, 0) / healthChecks.length,
      };

      // Determine overall status
      let overall: SystemHealthReport['overall'] = 'healthy';
      if (summary.unhealthyChecks > 0) {
        overall = 'unhealthy';
      } else if (summary.degradedChecks > 0) {
        overall = 'degraded';
      }

      const report: SystemHealthReport = {
        overall,
        timestamp: new Date().toISOString(),
        checks: healthChecks,
        summary,
        recommendations: this.generateRecommendations(healthChecks),
      };

      // Track performance
      performanceTracker.trackMetric('system_health_check', Date.now() - startTime, 'ms', {
        overall: report.overall,
        unhealthyChecks: summary.unhealthyChecks,
      });

      // Report critical issues
      if (overall === 'unhealthy') {
        errorReporter.reportError(new Error('System health check failed'), {
          category: 'system_health',
          severity: 'high',
          details: report,
        });
      }

      return report;
    } catch (error) {
      throw new Error(`System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const { data: connectionTest, error: connectionError } = await supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }

      // Test write operations
      const { error: writeError } = await supabase
        .from('system_health_logs')
        .insert({
          component: 'database',
          status: 'healthy',
          checked_at: new Date().toISOString(),
        });

      const responseTime = Date.now() - startTime;

      // Determine status based on response time and errors
      let status: SystemHealthCheck['status'] = 'healthy';
      if (writeError) {
        status = 'degraded';
      } else if (responseTime > 1000) {
        status = 'degraded';
      }

      return {
        component: 'database',
        status,
        responseTime,
        details: {
          connectionTest: !!connectionTest,
          writeTest: !writeError,
          latency: responseTime,
        },
        error: writeError?.message,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Database check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check AI services connectivity and functionality
   */
  private async checkAIServices(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      const services = [
        {
          name: 'OpenAI',
          endpoint: 'https://api.openai.com/v1/models',
          apiKey: env.openai.apiKey,
        },
      ];

      const results = await Promise.allSettled(
        services.map(service => this.testAIService(service))
      );

      const serviceStatuses = results.map((result, index) => {
        const serviceName = services[index].name;
        if (result.status === 'fulfilled') {
          return { name: serviceName, ...result.value };
        } else {
          return {
            name: serviceName,
            status: 'unhealthy',
            error: result.reason?.message || 'Service check failed',
          };
        }
      });

      const responseTime = Date.now() - startTime;
      const unhealthyServices = serviceStatuses.filter(s => s.status === 'unhealthy');
      
      let status: SystemHealthCheck['status'] = 'healthy';
      if (unhealthyServices.length === serviceStatuses.length) {
        status = 'unhealthy';
      } else if (unhealthyServices.length > 0) {
        status = 'degraded';
      }

      return {
        component: 'ai_services',
        status,
        responseTime,
        details: {
          services: serviceStatuses,
          totalServices: serviceStatuses.length,
          healthyServices: serviceStatuses.filter(s => s.status === 'healthy').length,
        },
        error: unhealthyServices.length > 0 ? `${unhealthyServices.length} service(s) unhealthy` : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'ai_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'AI services check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Test individual AI service
   */
  private async testAIService(service: { name: string; endpoint: string; apiKey: string }) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: 'unhealthy' as const,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Test rate limits
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitTotal = response.headers.get('x-ratelimit-limit');

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (rateLimitRemaining && rateLimitTotal) {
        const remaining = parseInt(rateLimitRemaining);
        const total = parseInt(rateLimitTotal);
        if (remaining / total < 0.1) { // Less than 10% remaining
          status = 'degraded';
        }
      }

      return {
        status,
        responseTime,
        details: {
          rateLimitRemaining,
          rateLimitTotal,
          httpStatus: response.status,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Service test failed',
      };
    }
  }

  /**
   * Check file upload capabilities
   */
  private async checkFileUpload(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test storage bucket accessibility
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

      if (bucketError) {
        throw new Error(`Storage bucket check failed: ${bucketError.message}`);
      }

      const requiredBuckets = ['property-photos', 'inspection-videos'];
      const availableBuckets = buckets?.map(b => b.name) || [];
      const missingBuckets = requiredBuckets.filter(b => !availableBuckets.includes(b));

      // Test file upload with a small test file
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `health-check-${Date.now()}.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(`test/${testFileName}`, testFile);

      // Clean up test file
      if (!uploadError) {
        await supabase.storage
          .from('property-photos')
          .remove([`test/${testFileName}`]);
      }

      const responseTime = Date.now() - startTime;

      let status: SystemHealthCheck['status'] = 'healthy';
      if (missingBuckets.length > 0 || uploadError) {
        status = missingBuckets.length === requiredBuckets.length ? 'unhealthy' : 'degraded';
      }

      return {
        component: 'file_upload',
        status,
        responseTime,
        details: {
          bucketsFound: availableBuckets.length,
          bucketsRequired: requiredBuckets.length,
          missingBuckets,
          uploadTest: !uploadError,
        },
        error: uploadError?.message || (missingBuckets.length > 0 ? `Missing buckets: ${missingBuckets.join(', ')}` : undefined),
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'file_upload',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'File upload check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check video processing pipeline
   */
  private async checkVideoProcessing(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check if MediaRecorder API is available
      const mediaRecorderAvailable = typeof MediaRecorder !== 'undefined';
      
      // Check supported video formats
      const supportedFormats: string[] = [];
      if (mediaRecorderAvailable) {
        const formats = ['video/webm', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm;codecs=vp9'];
        formats.forEach(format => {
          if (MediaRecorder.isTypeSupported(format)) {
            supportedFormats.push(format);
          }
        });
      }

      // Check getUserMedia availability
      const getUserMediaAvailable = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      const responseTime = Date.now() - startTime;

      let status: SystemHealthCheck['status'] = 'healthy';
      if (!mediaRecorderAvailable || !getUserMediaAvailable) {
        status = 'unhealthy';
      } else if (supportedFormats.length === 0) {
        status = 'degraded';
      }

      return {
        component: 'video_processing',
        status,
        responseTime,
        details: {
          mediaRecorderAvailable,
          getUserMediaAvailable,
          supportedFormats,
          browserSupport: {
            webRTC: !!window.RTCPeerConnection,
            webGL: !!window.WebGLRenderingContext,
          },
        },
        error: !mediaRecorderAvailable ? 'MediaRecorder API not available' : 
               !getUserMediaAvailable ? 'getUserMedia not available' :
               supportedFormats.length === 0 ? 'No supported video formats' : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'video_processing',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Video processing check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check mobile compatibility
   */
  private async checkMobileCompatibility(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      const capabilities = {
        touchSupport: 'ontouchstart' in window,
        orientationAPI: 'orientation' in window || 'onorientationchange' in window,
        deviceMotion: 'DeviceMotionEvent' in window,
        geolocation: 'geolocation' in navigator,
        vibration: 'vibrate' in navigator,
        camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        serviceWorker: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        localStorage: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
      };

      const supportedFeatures = Object.values(capabilities).filter(Boolean).length;
      const totalFeatures = Object.keys(capabilities).length;
      const supportPercentage = (supportedFeatures / totalFeatures) * 100;

      const responseTime = Date.now() - startTime;

      let status: SystemHealthCheck['status'] = 'healthy';
      if (supportPercentage < 50) {
        status = 'unhealthy';
      } else if (supportPercentage < 80) {
        status = 'degraded';
      }

      return {
        component: 'mobile_compatibility',
        status,
        responseTime,
        details: {
          capabilities,
          supportedFeatures,
          totalFeatures,
          supportPercentage,
          userAgent: navigator.userAgent,
          screenSize: {
            width: window.screen.width,
            height: window.screen.height,
          },
        },
        error: supportPercentage < 50 ? 'Low mobile feature support' : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'mobile_compatibility',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Mobile compatibility check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check offline capabilities
   */
  private async checkOfflineCapabilities(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      const offlineCapabilities = {
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: !!window.indexedDB,
        localStorage: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
        cacheAPI: 'caches' in window,
        backgroundSync: !!(navigator.serviceWorker && 'sync' in window.ServiceWorkerRegistration.prototype),
      };

      // Test cache functionality
      let cacheTest = false;
      if (offlineCapabilities.cacheAPI) {
        try {
          const cache = await caches.open('health-check-test');
          await cache.put(new Request('/test'), new Response('test'));
          const cached = await cache.match('/test');
          cacheTest = !!cached;
          await caches.delete('health-check-test');
        } catch {
          cacheTest = false;
        }
      }

      const supportedFeatures = Object.values(offlineCapabilities).filter(Boolean).length;
      const totalFeatures = Object.keys(offlineCapabilities).length;
      const responseTime = Date.now() - startTime;

      let status: SystemHealthCheck['status'] = 'healthy';
      if (supportedFeatures < 3) {
        status = 'unhealthy';
      } else if (supportedFeatures < totalFeatures) {
        status = 'degraded';
      }

      return {
        component: 'offline_capabilities',
        status,
        responseTime,
        details: {
          ...offlineCapabilities,
          cacheTest,
          supportedFeatures,
          totalFeatures,
          isOnline: navigator.onLine,
        },
        error: supportedFeatures < 3 ? 'Insufficient offline support' : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'offline_capabilities',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Offline capabilities check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check authentication system
   */
  private async checkAuthenticationSystem(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Test auth endpoint responsiveness
      const { data: user, error: userError } = await supabase.auth.getUser();

      const responseTime = Date.now() - startTime;

      let status: SystemHealthCheck['status'] = 'healthy';
      if (sessionError || userError) {
        status = 'degraded';
      }

      return {
        component: 'authentication',
        status,
        responseTime,
        details: {
          hasSession: !!session,
          hasUser: !!user?.user,
          sessionValid: !sessionError,
          userValid: !userError,
          authMethod: session?.user?.app_metadata?.provider || 'unknown',
        },
        error: sessionError?.message || userError?.message,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'authentication',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Authentication check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check environment configuration
   */
  private async checkEnvironmentConfiguration(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      const config = {
        hasSupabaseUrl: !!env.supabase.url,
        hasSupabaseKey: !!env.supabase.anonKey,
        hasOpenAIKey: !!env.openai.apiKey,
        environment: env.getEnvironment(),
        features: env.features,
        validSupabaseConfig: env.validateSupabaseConfig(),
        validAIConfig: env.validateAIConfig(),
      };

      const requiredConfigs = [
        config.hasSupabaseUrl,
        config.hasSupabaseKey,
        config.validSupabaseConfig,
      ];

      const optionalConfigs = [
        config.hasOpenAIKey,
        config.validAIConfig,
      ];

      const missingRequired = requiredConfigs.filter(c => !c).length;
      const missingOptional = optionalConfigs.filter(c => !c).length;

      const responseTime = Date.now() - startTime;

      let status: SystemHealthCheck['status'] = 'healthy';
      if (missingRequired > 0) {
        status = 'unhealthy';
      } else if (missingOptional > 0) {
        status = 'degraded';
      }

      return {
        component: 'environment_config',
        status,
        responseTime,
        details: {
          ...config,
          missingRequired,
          missingOptional,
        },
        error: missingRequired > 0 ? 'Missing required configuration' : 
               missingOptional > 0 ? 'Missing optional configuration' : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        component: 'environment_config',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Environment config check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate recommendations based on health check results
   */
  private generateRecommendations(checks: SystemHealthCheck[]): string[] {
    const recommendations: string[] = [];
    
    checks.forEach(check => {
      if (check.status === 'unhealthy') {
        switch (check.component) {
          case 'database':
            recommendations.push('Check database connection and credentials');
            break;
          case 'ai_services':
            recommendations.push('Verify AI service API keys and network connectivity');
            break;
          case 'file_upload':
            recommendations.push('Ensure storage buckets are properly configured');
            break;
          case 'video_processing':
            recommendations.push('Update browser or check camera permissions');
            break;
          case 'mobile_compatibility':
            recommendations.push('Use a modern mobile browser with full feature support');
            break;
          case 'offline_capabilities':
            recommendations.push('Enable service workers and check cache storage');
            break;
          case 'authentication':
            recommendations.push('Check authentication service configuration');
            break;
          case 'environment_config':
            recommendations.push('Review environment variables and configuration');
            break;
        }
      } else if (check.status === 'degraded') {
        recommendations.push(`Monitor ${check.component} for potential issues`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All systems are operating normally');
    }

    return recommendations;
  }

  /**
   * Get cached health check result
   */
  getCachedHealthCheck(component: string): SystemHealthCheck | null {
    return this.healthChecks.get(component) || null;
  }

  /**
   * Cache health check result
   */
  cacheHealthCheck(check: SystemHealthCheck): void {
    this.healthChecks.set(check.component, check);
  }
}

// Export singleton instance
export const systemHealthValidator = SystemHealthValidator.getInstance();

// Export convenience functions
export const performHealthCheck = () => systemHealthValidator.performFullHealthCheck();
export const checkComponent = (component: string) => systemHealthValidator.getCachedHealthCheck(component);