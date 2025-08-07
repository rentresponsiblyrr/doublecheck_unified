/**
 * Core Service Manager - Consolidated Service Architecture
 * Reduces 98 services to 8 core services with clear responsibilities
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Import core consolidated services
import { DataService } from './DataService';
import { AuthService } from './AuthService';
import { MediaService } from './MediaService';
import { SyncService } from './SyncService';
import { AIService } from './AIService';
import { NotificationService } from './NotificationService';
import { AnalyticsService } from './AnalyticsService';
import { ConfigService } from './ConfigService';

/**
 * Core Service Architecture:
 * 
 * 1. DataService - All database operations (properties, inspections, checklists)
 * 2. AuthService - Authentication, authorization, user management
 * 3. MediaService - Photo/video upload, compression, storage
 * 4. SyncService - Offline sync, queue management, conflict resolution
 * 5. AIService - Photo analysis, checklist generation, quality assessment
 * 6. NotificationService - Push notifications, alerts, real-time updates
 * 7. AnalyticsService - Metrics, performance monitoring, reporting
 * 8. ConfigService - Settings, feature flags, environment configuration
 */

export class CoreServiceManager {
  private static instance: CoreServiceManager;
  
  // Core services
  public data: DataService;
  public auth: AuthService;
  public media: MediaService;
  public sync: SyncService;
  public ai: AIService;
  public notification: NotificationService;
  public analytics: AnalyticsService;
  public config: ConfigService;

  private initialized: boolean = false;

  private constructor() {
    // Initialize core services
    this.data = DataService.getInstance();
    this.auth = AuthService.getInstance();
    this.media = MediaService.getInstance();
    this.sync = SyncService.getInstance();
    this.ai = AIService.getInstance();
    this.notification = NotificationService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    this.config = ConfigService.getInstance();
  }

  static getInstance(): CoreServiceManager {
    if (!CoreServiceManager.instance) {
      CoreServiceManager.instance = new CoreServiceManager();
    }
    return CoreServiceManager.instance;
  }

  /**
   * Initialize all core services
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('Initializing core services');

      // Initialize in dependency order
      await this.config.initialize();
      await this.auth.initialize();
      await this.data.initialize();
      await this.media.initialize();
      await this.sync.initialize();
      await this.ai.initialize();
      await this.notification.initialize();
      await this.analytics.initialize();

      this.initialized = true;
      logger.info('Core services initialized successfully');

      // Track initialization
      this.analytics.track('core_services_initialized', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to initialize core services', error);
      throw new Error('Service initialization failed');
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const services: Record<string, boolean> = {};

    // Check each service
    const checks = [
      { name: 'data', service: this.data },
      { name: 'auth', service: this.auth },
      { name: 'media', service: this.media },
      { name: 'sync', service: this.sync },
      { name: 'ai', service: this.ai },
      { name: 'notification', service: this.notification },
      { name: 'analytics', service: this.analytics },
      { name: 'config', service: this.config }
    ];

    for (const { name, service } of checks) {
      try {
        const healthy = await service.healthCheck();
        services[name] = healthy;
        if (!healthy) {
          errors.push(`${name} service is unhealthy`);
        }
      } catch (error) {
        services[name] = false;
        errors.push(`${name} service check failed: ${error}`);
      }
    }

    const healthy = errors.length === 0;

    if (!healthy) {
      logger.error('Core services health check failed', { errors });
    }

    return { healthy, services, errors };
  }

  /**
   * Cleanup all services
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up core services');

    await Promise.all([
      this.sync.cleanup(),
      this.media.cleanup(),
      this.notification.cleanup(),
      this.analytics.cleanup()
    ]);

    this.initialized = false;
  }

  /**
   * Get service metrics
   */
  getMetrics(): Record<string, any> {
    return {
      data: this.data.getMetrics(),
      auth: this.auth.getMetrics(),
      media: this.media.getMetrics(),
      sync: this.sync.getMetrics(),
      ai: this.ai.getMetrics(),
      notification: this.notification.getMetrics(),
      analytics: this.analytics.getMetrics(),
      config: this.config.getMetrics()
    };
  }
}

// Export singleton instance
export const coreServices = CoreServiceManager.getInstance();

// Export individual services for backward compatibility
export const dataService = coreServices.data;
export const authService = coreServices.auth;
export const mediaService = coreServices.media;
export const syncService = coreServices.sync;
export const aiService = coreServices.ai;
export const notificationService = coreServices.notification;
export const analyticsService = coreServices.analytics;
export const configService = coreServices.config;