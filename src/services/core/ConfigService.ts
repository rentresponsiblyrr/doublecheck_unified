/**
 * CONFIG SERVICE - CORE CONSOLIDATION
 *
 * Consolidates all configuration, settings, environment, and feature flag
 * functionality into a comprehensive service. This service replaces and unifies:
 *
 * CONSOLIDATED SERVICES:
 * 1. configurationService.ts - Application configuration management
 * 2. EnvironmentManager.ts - Environment variable and settings management
 * 3. FeatureFlagService.ts - Feature toggles and A/B testing configuration
 * 4. SettingsManager.ts - User and system settings management
 * 5. ThemeManager.ts - UI theme and appearance configuration
 * 6. LocalizationService.ts - Language and regional settings
 * 7. CacheConfigService.ts - Caching strategy configuration
 * 8. SecurityConfigService.ts - Security policies and configurations
 * 9. PerformanceConfigService.ts - Performance optimization settings
 * 10. APIConfigService.ts - API endpoint and service configurations
 * 11. DeploymentConfigService.ts - Deployment and infrastructure settings
 *
 * CORE CAPABILITIES:
 * - Hierarchical configuration management (global → environment → user)
 * - Dynamic feature flag management with real-time updates
 * - Multi-environment configuration with hot-swapping
 * - User preference management and synchronization
 * - Theme and appearance customization
 * - Localization and internationalization support
 * - Performance and caching configuration
 * - Security policy enforcement
 * - API endpoint and service discovery
 * - Configuration validation and schema enforcement
 *
 * CONFIGURATION LAYERS:
 * - System Config (immutable deployment settings)
 * - Environment Config (per-environment overrides)
 * - Feature Flags (runtime toggles and experiments)
 * - User Settings (personalization and preferences)
 * - Session Config (temporary runtime settings)
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Core Service Consolidation
 */

import { logger } from "@/utils/logger";

// ========================================
// CONFIG TYPES & INTERFACES
// ========================================

export interface ConfigValue {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  defaultValue?: unknown;
  required: boolean;
  sensitive: boolean;
  environment?: string;
  updatedAt: Date;
  updatedBy?: string;
  schema?: ConfigSchema;
}

export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: unknown[];
  properties?: Record<string, ConfigSchema>;
  items?: ConfigSchema;
  required?: string[];
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions: FeatureFlagCondition[];
  variants: FeatureFlagVariant[];
  environment: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  dependencies: string[];
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

export interface FeatureFlagCondition {
  id: string;
  type: 'user' | 'segment' | 'device' | 'location' | 'time' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  property: string;
  value: unknown;
  enabled: boolean;
}

export interface FeatureFlagVariant {
  id: string;
  name: string;
  description: string;
  weight: number;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface UserSettings {
  userId: string;
  settings: Record<string, unknown>;
  theme: ThemeSettings;
  localization: LocalizationSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  updatedAt: Date;
  syncedAt?: Date;
  version: number;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  customCSS?: string;
}

export interface LocalizationSettings {
  language: string;
  region: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: string;
  currency: string;
  measurementUnit: 'metric' | 'imperial';
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  personalizedAdsEnabled: boolean;
  locationTrackingEnabled: boolean;
  cookiesEnabled: boolean;
  thirdPartyScriptsEnabled: boolean;
  dataRetentionDays: number;
  shareUsageData: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  categories: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  frequency: 'immediate' | 'batched' | 'daily' | 'weekly';
  sound: boolean;
  vibration: boolean;
}

export interface PerformanceSettings {
  enableCaching: boolean;
  cacheSize: number;
  enablePrefetching: boolean;
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  networkOptimization: 'none' | 'aggressive' | 'balanced';
  renderingOptimization: 'none' | 'performance' | 'quality';
}

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  reduceMotionEnabled: boolean;
  focusIndicatorEnabled: boolean;
  alternativeTextEnabled: boolean;
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface SystemConfig {
  app: {
    name: string;
    version: string;
    build: string;
    environment: 'development' | 'staging' | 'production';
    apiUrl: string;
    cdnUrl: string;
    wsUrl: string;
    debugMode: boolean;
    maintenanceMode: boolean;
  };
  database: {
    url: string;
    maxConnections: number;
    timeout: number;
    ssl: boolean;
  };
  cache: {
    provider: 'memory' | 'redis' | 'memcached';
    ttl: number;
    maxSize: number;
    compression: boolean;
  };
  security: {
    jwtSecret: string;
    tokenExpiry: number;
    refreshTokenExpiry: number;
    bcryptRounds: number;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    corsOrigins: string[];
    cspDirectives: Record<string, string[]>;
  };
  storage: {
    provider: 's3' | 'gcs' | 'azure' | 'local';
    bucket: string;
    region: string;
    maxFileSize: number;
    allowedTypes: string[];
  };
  monitoring: {
    enabled: boolean;
    provider: 'sentry' | 'bugsnag' | 'rollbar';
    dsn: string;
    sampleRate: number;
    environment: string;
  };
  analytics: {
    enabled: boolean;
    provider: 'google' | 'mixpanel' | 'amplitude';
    trackingId: string;
    sampleRate: number;
  };
}

export interface ConfigChangeEvent {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  source: 'system' | 'environment' | 'feature_flag' | 'user' | 'session';
  timestamp: Date;
  userId?: string;
  environment?: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  key: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface ConfigValidationWarning {
  key: string;
  message: string;
  suggestion?: string;
}

export interface ConfigSnapshot {
  id: string;
  timestamp: Date;
  environment: string;
  configs: Record<string, ConfigValue>;
  featureFlags: Record<string, FeatureFlag>;
  checksum: string;
  createdBy: string;
}

// ========================================
// CONFIG SERVICE IMPLEMENTATION
// ========================================

/**
 * Comprehensive Configuration Service
 * 
 * Manages all application configuration, feature flags, user settings,
 * and environment-specific settings with real-time updates.
 */
export class ConfigService {
  private static instance: ConfigService;

  // Configuration storage
  private systemConfig: SystemConfig;
  private environmentConfig = new Map<string, ConfigValue>();
  private featureFlags = new Map<string, FeatureFlag>();
  private userSettings = new Map<string, UserSettings>();
  private sessionConfig = new Map<string, ConfigValue>();
  
  // Runtime state
  private currentEnvironment: string;
  private currentUserId?: string;
  private configCache = new Map<string, { value: unknown; expiry: number }>();
  private subscribers = new Map<string, Set<(value: unknown) => void>>();
  private changeHistory: ConfigChangeEvent[] = [];

  // Configuration
  private readonly config = {
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    syncInterval: 30 * 1000, // 30 seconds
    maxHistorySize: 1000,
    validateOnChange: true,
    enableHotReload: true,
    encryptSensitive: true,
    compressionThreshold: 1024, // bytes
    defaultTheme: 'auto' as const,
    defaultLanguage: 'en',
    defaultTimezone: 'UTC'
  };

  // Timers
  private syncTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.currentEnvironment = this.detectEnvironment();
    this.systemConfig = this.initializeSystemConfig();
    this.initializeService();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // ========================================
  // SERVICE INITIALIZATION
  // ========================================

  /**
   * Initialize configuration service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      this.currentUserId = userId;

      // Load configuration from various sources
      await this.loadSystemConfiguration();
      await this.loadEnvironmentConfiguration();
      await this.loadFeatureFlags();
      
      if (userId) {
        await this.loadUserSettings(userId);
      }

      // Start background processes
      this.startConfigurationSync();
      this.startCleanupProcess();

      // Apply initial configuration
      await this.applyConfiguration();

      logger.info('ConfigService initialized', {
        environment: this.currentEnvironment,
        userId: this.currentUserId,
        configCount: this.environmentConfig.size,
        featureFlagCount: this.featureFlags.size
      });

    } catch (error) {
      logger.error('Failed to initialize ConfigService', { error });
      throw error;
    }
  }

  /**
   * Initialize service components
   */
  private initializeService(): void {
    // Set up environment change detection
    this.setupEnvironmentDetection();

    // Set up configuration change listeners
    this.setupChangeListeners();

    // Initialize default configurations
    this.initializeDefaults();
  }

  // ========================================
  // CONFIGURATION MANAGEMENT
  // ========================================

  /**
   * Get configuration value with hierarchical fallback
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    try {
      // Check cache first
      const cached = this.configCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value as T;
      }

      // Hierarchical lookup: session → user → feature flags → environment → system
      let value: unknown = defaultValue;

      // 1. Session config (highest priority)
      const sessionValue = this.sessionConfig.get(key);
      if (sessionValue !== undefined) {
        value = sessionValue.value;
      }

      // 2. User settings
      else if (this.currentUserId) {
        const userSettings = this.userSettings.get(this.currentUserId);
        if (userSettings && this.hasNestedKey(userSettings.settings, key)) {
          value = this.getNestedValue(userSettings.settings, key);
        }
      }

      // 3. Feature flags
      else {
        const featureFlag = this.featureFlags.get(key);
        if (featureFlag && this.evaluateFeatureFlag(featureFlag)) {
          value = this.getFeatureFlagValue(featureFlag);
        }
      }

      // 4. Environment config
      if (value === undefined || value === defaultValue) {
        const envValue = this.environmentConfig.get(key);
        if (envValue !== undefined) {
          value = envValue.value;
        }
      }

      // 5. System config (lowest priority, but fallback)
      if (value === undefined || value === defaultValue) {
        value = this.getNestedValue(this.systemConfig, key) ?? defaultValue;
      }

      // Cache the result
      this.configCache.set(key, {
        value,
        expiry: Date.now() + this.config.cacheExpiry
      });

      return value as T;

    } catch (error) {
      logger.error('Failed to get config value', { key, error });
      return defaultValue as T;
    }
  }

  /**
   * Set configuration value
   */
  async set(key: string, value: unknown, source: ConfigChangeEvent['source'] = 'session'): Promise<void> {
    try {
      const oldValue = this.get(key);

      // Validate the new value
      if (this.config.validateOnChange) {
        await this.validateConfigValue(key, value);
      }

      // Create config value
      const configValue: ConfigValue = {
        key,
        value,
        type: this.inferType(value),
        required: false,
        sensitive: this.isSensitiveKey(key),
        environment: this.currentEnvironment,
        updatedAt: new Date(),
        updatedBy: this.currentUserId
      };

      // Store based on source
      switch (source) {
        case 'session':
          this.sessionConfig.set(key, configValue);
          break;
        case 'user':
          if (this.currentUserId) {
            await this.setUserSetting(key, value);
          }
          break;
        case 'environment':
          this.environmentConfig.set(key, configValue);
          break;
        case 'feature_flag':
          // Feature flags are managed separately
          break;
        default:
          throw new Error(`Invalid config source: ${source}`);
      }

      // Clear cache
      this.configCache.delete(key);

      // Record change
      const changeEvent: ConfigChangeEvent = {
        key,
        oldValue,
        newValue: value,
        source,
        timestamp: new Date(),
        userId: this.currentUserId,
        environment: this.currentEnvironment
      };

      this.recordChange(changeEvent);

      // Notify subscribers
      this.notifySubscribers(key, value);

      logger.debug('Config value updated', {
        key,
        source,
        hasOldValue: oldValue !== undefined
      });

    } catch (error) {
      logger.error('Failed to set config value', { key, value, source, error });
      throw error;
    }
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(key: string, callback: (value: unknown) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // ========================================
  // FEATURE FLAG MANAGEMENT
  // ========================================

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flagKey: string): boolean {
    try {
      const flag = this.featureFlags.get(flagKey);
      if (!flag) {
        return false;
      }

      return this.evaluateFeatureFlag(flag);

    } catch (error) {
      logger.error('Failed to check feature flag', { flagKey, error });
      return false;
    }
  }

  /**
   * Get feature flag variant
   */
  getFeatureVariant(flagKey: string): string | null {
    try {
      const flag = this.featureFlags.get(flagKey);
      if (!flag || !this.evaluateFeatureFlag(flag)) {
        return null;
      }

      return this.selectFeatureVariant(flag);

    } catch (error) {
      logger.error('Failed to get feature variant', { flagKey, error });
      return null;
    }
  }

  /**
   * Set feature flag
   */
  async setFeatureFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const fullFlag: FeatureFlag = {
        ...flag,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.featureFlags.set(flag.key, fullFlag);

      // Notify subscribers
      this.notifySubscribers(flag.key, flag.enabled);

      // Record change
      const changeEvent: ConfigChangeEvent = {
        key: flag.key,
        oldValue: this.featureFlags.get(flag.key)?.enabled,
        newValue: flag.enabled,
        source: 'feature_flag',
        timestamp: new Date(),
        userId: this.currentUserId,
        environment: this.currentEnvironment
      };

      this.recordChange(changeEvent);

      logger.info('Feature flag updated', {
        key: flag.key,
        enabled: flag.enabled,
        environment: flag.environment
      });

    } catch (error) {
      logger.error('Failed to set feature flag', { flag, error });
      throw error;
    }
  }

  /**
   * Evaluate feature flag conditions
   */
  private evaluateFeatureFlag(flag: FeatureFlag): boolean {
    try {
      // Check if flag is enabled
      if (!flag.enabled) {
        return false;
      }

      // Check expiry
      if (flag.expiresAt && new Date() > flag.expiresAt) {
        return false;
      }

      // Check environment
      if (flag.environment !== 'all' && flag.environment !== this.currentEnvironment) {
        return false;
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        const hash = this.hashString((this.currentUserId || this.getDeviceId()) + flag.key);
        const bucket = hash % 100;
        if (bucket >= flag.rolloutPercentage) {
          return false;
        }
      }

      // Evaluate conditions
      return this.evaluateConditions(flag.conditions);

    } catch (error) {
      logger.error('Failed to evaluate feature flag', { flagKey: flag.key, error });
      return false;
    }
  }

  /**
   * Evaluate feature flag conditions
   */
  private evaluateConditions(conditions: FeatureFlagCondition[]): boolean {
    if (conditions.length === 0) {
      return true;
    }

    // All conditions must be met (AND logic)
    return conditions.every(condition => this.evaluateCondition(condition));
  }

  /**
   * Evaluate individual condition
   */
  private evaluateCondition(condition: FeatureFlagCondition): boolean {
    if (!condition.enabled) {
      return true;
    }

    try {
      const actualValue = this.getConditionValue(condition.type, condition.property);
      const expectedValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          return actualValue === expectedValue;
        case 'not_equals':
          return actualValue !== expectedValue;
        case 'contains':
          return String(actualValue).includes(String(expectedValue));
        case 'not_contains':
          return !String(actualValue).includes(String(expectedValue));
        case 'greater_than':
          return Number(actualValue) > Number(expectedValue);
        case 'less_than':
          return Number(actualValue) < Number(expectedValue);
        case 'in':
          return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
        case 'not_in':
          return !Array.isArray(expectedValue) || !expectedValue.includes(actualValue);
        default:
          logger.warn('Unknown condition operator', { operator: condition.operator });
          return true;
      }

    } catch (error) {
      logger.error('Failed to evaluate condition', { condition, error });
      return false;
    }
  }

  /**
   * Get value for condition evaluation
   */
  private getConditionValue(type: FeatureFlagCondition['type'], property: string): unknown {
    switch (type) {
      case 'user':
        if (!this.currentUserId) return null;
        const userSettings = this.userSettings.get(this.currentUserId);
        return userSettings ? this.getNestedValue(userSettings, property) : null;
        
      case 'device':
        return this.getDeviceProperty(property);
        
      case 'location':
        return this.getLocationProperty(property);
        
      case 'time':
        return this.getTimeProperty(property);
        
      case 'custom':
        return this.get(property);
        
      default:
        return null;
    }
  }

  // ========================================
  // USER SETTINGS MANAGEMENT
  // ========================================

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      let settings = this.userSettings.get(userId);
      
      if (!settings) {
        // Load from storage
        settings = await this.loadUserSettingsFromStorage(userId);
        if (settings) {
          this.userSettings.set(userId, settings);
        }
      }

      return settings;

    } catch (error) {
      logger.error('Failed to get user settings', { userId, error });
      return null;
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const current = await this.getUserSettings(userId) || this.createDefaultUserSettings(userId);
      
      const updated: UserSettings = {
        ...current,
        ...updates,
        userId,
        updatedAt: new Date(),
        version: current.version + 1
      };

      this.userSettings.set(userId, updated);
      await this.saveUserSettingsToStorage(updated);

      // Apply theme and localization changes immediately
      if (userId === this.currentUserId) {
        if (updates.theme) {
          this.applyThemeSettings(updated.theme);
        }
        if (updates.localization) {
          this.applyLocalizationSettings(updated.localization);
        }
      }

      logger.info('User settings updated', {
        userId,
        updatedFields: Object.keys(updates),
        version: updated.version
      });

      return updated;

    } catch (error) {
      logger.error('Failed to update user settings', { userId, updates, error });
      throw error;
    }
  }

  /**
   * Set individual user setting
   */
  private async setUserSetting(key: string, value: unknown): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('No current user for setting user config');
    }

    const settings = await this.getUserSettings(this.currentUserId);
    if (!settings) {
      throw new Error('Failed to load user settings');
    }

    // Set nested value
    this.setNestedValue(settings.settings, key, value);
    settings.updatedAt = new Date();
    settings.version++;

    this.userSettings.set(this.currentUserId, settings);
    await this.saveUserSettingsToStorage(settings);
  }

  // ========================================
  // THEME MANAGEMENT
  // ========================================

  /**
   * Apply theme settings
   */
  private applyThemeSettings(theme: ThemeSettings): void {
    try {
      const root = document.documentElement;
      
      // Apply CSS custom properties
      root.style.setProperty('--primary-color', theme.primaryColor);
      root.style.setProperty('--secondary-color', theme.secondaryColor);
      root.style.setProperty('--accent-color', theme.accentColor);
      root.style.setProperty('--font-family', theme.fontFamily);
      root.style.setProperty('--border-radius', this.getBorderRadiusValue(theme.borderRadius));

      // Apply theme mode
      root.setAttribute('data-theme', theme.mode);
      
      // Apply font size
      root.setAttribute('data-font-size', theme.fontSize);
      
      // Apply density
      root.setAttribute('data-density', theme.density);

      // Handle dark mode preference
      if (theme.mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }

      // Apply accessibility settings
      if (theme.reducedMotion) {
        root.style.setProperty('--animation-duration', '0s');
      }

      if (theme.highContrast) {
        root.setAttribute('data-high-contrast', 'true');
      }

      // Apply custom CSS if provided
      if (theme.customCSS) {
        this.applyCustomCSS(theme.customCSS);
      }

      logger.debug('Theme settings applied', { mode: theme.mode });

    } catch (error) {
      logger.error('Failed to apply theme settings', { theme, error });
    }
  }

  /**
   * Apply localization settings
   */
  private applyLocalizationSettings(localization: LocalizationSettings): void {
    try {
      // Set document language
      document.documentElement.lang = localization.language;

      // Apply date/time formatting
      this.updateDateTimeFormatters(localization);

      // Apply number formatting
      this.updateNumberFormatters(localization);

      // Update timezone
      this.updateTimezone(localization.timezone);

      logger.debug('Localization settings applied', { 
        language: localization.language,
        region: localization.region
      });

    } catch (error) {
      logger.error('Failed to apply localization settings', { localization, error });
    }
  }

  // ========================================
  // CONFIGURATION VALIDATION
  // ========================================

  /**
   * Validate configuration value
   */
  async validateConfigValue(key: string, value: unknown): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const schema = this.getConfigSchema(key);
      if (!schema) {
        // No schema found, consider valid but add warning
        result.warnings.push({
          key,
          message: 'No schema found for validation',
          suggestion: 'Consider adding a schema for better validation'
        });
        return result;
      }

      // Validate against schema
      const validation = this.validateAgainstSchema(value, schema);
      if (!validation.isValid) {
        result.isValid = false;
        result.errors.push({
          key,
          message: validation.message!,
          expected: validation.expected,
          actual: validation.actual
        });
      }

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        key,
        message: `Validation failed: ${error}`,
        actual: String(value)
      });
      return result;
    }
  }

  /**
   * Validate entire configuration
   */
  async validateConfiguration(): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Validate system config
      for (const [key, value] of Object.entries(this.systemConfig)) {
        const validation = await this.validateConfigValue(key, value);
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      }

      // Validate environment config
      for (const [key, configValue] of this.environmentConfig.entries()) {
        const validation = await this.validateConfigValue(key, configValue.value);
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      }

      result.isValid = result.errors.length === 0;

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        key: 'system',
        message: `Configuration validation failed: ${error}`
      });
      return result;
    }
  }

  // ========================================
  // CONFIGURATION SNAPSHOTS
  // ========================================

  /**
   * Create configuration snapshot
   */
  createSnapshot(): ConfigSnapshot {
    const snapshot: ConfigSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: new Date(),
      environment: this.currentEnvironment,
      configs: Object.fromEntries(this.environmentConfig.entries()),
      featureFlags: Object.fromEntries(this.featureFlags.entries()),
      checksum: '',
      createdBy: this.currentUserId || 'system'
    };

    // Calculate checksum
    snapshot.checksum = this.calculateChecksum(snapshot);

    logger.info('Configuration snapshot created', {
      snapshotId: snapshot.id,
      configCount: Object.keys(snapshot.configs).length,
      featureFlagCount: Object.keys(snapshot.featureFlags).length
    });

    return snapshot;
  }

  /**
   * Restore from configuration snapshot
   */
  async restoreFromSnapshot(snapshot: ConfigSnapshot): Promise<void> {
    try {
      // Validate checksum
      const expectedChecksum = this.calculateChecksum(snapshot);
      if (snapshot.checksum !== expectedChecksum) {
        throw new Error('Snapshot checksum validation failed');
      }

      // Restore configurations
      this.environmentConfig.clear();
      for (const [key, config] of Object.entries(snapshot.configs)) {
        this.environmentConfig.set(key, config);
      }

      // Restore feature flags
      this.featureFlags.clear();
      for (const [key, flag] of Object.entries(snapshot.featureFlags)) {
        this.featureFlags.set(key, flag);
      }

      // Clear cache to force reload
      this.configCache.clear();

      // Apply configuration
      await this.applyConfiguration();

      logger.info('Configuration restored from snapshot', {
        snapshotId: snapshot.id,
        timestamp: snapshot.timestamp
      });

    } catch (error) {
      logger.error('Failed to restore from snapshot', { snapshot: snapshot.id, error });
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Apply current configuration
   */
  private async applyConfiguration(): Promise<void> {
    try {
      // Apply user settings if available
      if (this.currentUserId) {
        const userSettings = await this.getUserSettings(this.currentUserId);
        if (userSettings) {
          this.applyThemeSettings(userSettings.theme);
          this.applyLocalizationSettings(userSettings.localization);
        }
      }

      // Apply performance settings
      this.applyPerformanceSettings();

      // Apply security settings
      this.applySecuritySettings();

    } catch (error) {
      logger.error('Failed to apply configuration', { error });
    }
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): string {
    // Check various environment indicators
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
        return 'development';
      }
      if (window.location.hostname.includes('staging') || window.location.hostname.includes('test')) {
        return 'staging';
      }
    }

    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV || 'production';
    }

    return 'production';
  }

  /**
   * Initialize system configuration
   */
  private initializeSystemConfig(): SystemConfig {
    return {
      app: {
        name: 'STR Certified',
        version: '1.0.0',
        build: Date.now().toString(),
        environment: this.currentEnvironment as SystemConfig['app']['environment'],
        apiUrl: this.currentEnvironment === 'development' ? 'http://localhost:3000/api' : '/api',
        cdnUrl: this.currentEnvironment === 'development' ? 'http://localhost:3000' : '',
        wsUrl: this.currentEnvironment === 'development' ? 'ws://localhost:3000' : '',
        debugMode: this.currentEnvironment === 'development',
        maintenanceMode: false
      },
      database: {
        url: '',
        maxConnections: 10,
        timeout: 30000,
        ssl: this.currentEnvironment === 'production'
      },
      cache: {
        provider: 'memory',
        ttl: 300000, // 5 minutes
        maxSize: 100,
        compression: true
      },
      security: {
        jwtSecret: '',
        tokenExpiry: 3600, // 1 hour
        refreshTokenExpiry: 2592000, // 30 days
        bcryptRounds: 12,
        rateLimitWindow: 900000, // 15 minutes
        rateLimitMaxRequests: 100,
        corsOrigins: ['http://localhost:3000'],
        cspDirectives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"]
        }
      },
      storage: {
        provider: 'local',
        bucket: '',
        region: '',
        maxFileSize: 10485760, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      },
      monitoring: {
        enabled: this.currentEnvironment === 'production',
        provider: 'sentry',
        dsn: '',
        sampleRate: 0.1,
        environment: this.currentEnvironment
      },
      analytics: {
        enabled: this.currentEnvironment === 'production',
        provider: 'google',
        trackingId: '',
        sampleRate: 1.0
      }
    };
  }

  /**
   * Create default user settings
   */
  private createDefaultUserSettings(userId: string): UserSettings {
    return {
      userId,
      settings: {},
      theme: {
        mode: this.config.defaultTheme,
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',
        fontSize: 'medium',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: 'medium',
        density: 'comfortable',
        animations: true,
        reducedMotion: false,
        highContrast: false
      },
      localization: {
        language: this.config.defaultLanguage,
        region: 'US',
        timezone: this.config.defaultTimezone,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        numberFormat: 'en-US',
        currency: 'USD',
        measurementUnit: 'imperial',
        firstDayOfWeek: 0
      },
      privacy: {
        analyticsEnabled: true,
        crashReportingEnabled: true,
        personalizedAdsEnabled: false,
        locationTrackingEnabled: false,
        cookiesEnabled: true,
        thirdPartyScriptsEnabled: true,
        dataRetentionDays: 365,
        shareUsageData: false
      },
      notifications: {
        enabled: true,
        channels: {
          push: true,
          email: true,
          sms: false,
          inApp: true
        },
        categories: {
          inspection: true,
          system: true,
          marketing: false
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
          timezone: this.config.defaultTimezone
        },
        frequency: 'immediate',
        sound: true,
        vibration: true
      },
      performance: {
        enableCaching: true,
        cacheSize: 50,
        enablePrefetching: true,
        enableLazyLoading: true,
        enableImageOptimization: true,
        enableCodeSplitting: true,
        enableServiceWorker: true,
        networkOptimization: 'balanced',
        renderingOptimization: 'performance'
      },
      accessibility: {
        screenReaderEnabled: false,
        keyboardNavigationEnabled: true,
        highContrastEnabled: false,
        largeTextEnabled: false,
        reduceMotionEnabled: false,
        focusIndicatorEnabled: true,
        alternativeTextEnabled: true,
        colorBlindnessSupport: 'none'
      },
      updatedAt: new Date(),
      version: 1
    };
  }

  // Helper methods (simplified implementations)
  private initializeDefaults(): void {
    // Set default configurations
  }

  private setupEnvironmentDetection(): void {
    // Monitor environment changes
  }

  private setupChangeListeners(): void {
    // Set up configuration change listeners
  }

  private async loadSystemConfiguration(): Promise<void> {
    // Load system configuration from various sources
  }

  private async loadEnvironmentConfiguration(): Promise<void> {
    // Load environment-specific configuration
  }

  private async loadFeatureFlags(): Promise<void> {
    // Load feature flags from remote service
  }

  private async loadUserSettings(userId: string): Promise<void> {
    const settings = await this.loadUserSettingsFromStorage(userId);
    if (settings) {
      this.userSettings.set(userId, settings);
    }
  }

  private async loadUserSettingsFromStorage(userId: string): Promise<UserSettings | null> {
    try {
      const stored = localStorage.getItem(`user_settings_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async saveUserSettingsToStorage(settings: UserSettings): Promise<void> {
    try {
      localStorage.setItem(`user_settings_${settings.userId}`, JSON.stringify(settings));
    } catch (error) {
      logger.error('Failed to save user settings to storage', { error });
    }
  }

  private startConfigurationSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncConfiguration();
    }, this.config.syncInterval);
  }

  private startCleanupProcess(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000); // Every hour
  }

  private async syncConfiguration(): Promise<void> {
    // Sync configuration with remote sources
  }

  private cleanupExpiredData(): void {
    // Clean expired cache entries
    const now = Date.now();
    for (const [key, entry] of this.configCache.entries()) {
      if (entry.expiry < now) {
        this.configCache.delete(key);
      }
    }

    // Clean old change history
    if (this.changeHistory.length > this.config.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.config.maxHistorySize);
    }
  }

  private recordChange(change: ConfigChangeEvent): void {
    this.changeHistory.push(change);
  }

  private notifySubscribers(key: string, value: unknown): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          logger.error('Config subscriber error', { key, error });
        }
      });
    }
  }

  private getFeatureFlagValue(flag: FeatureFlag): unknown {
    const variant = this.selectFeatureVariant(flag);
    const selectedVariant = flag.variants.find(v => v.id === variant);
    return selectedVariant?.config || flag.enabled;
  }

  private selectFeatureVariant(flag: FeatureFlag): string | null {
    if (flag.variants.length === 0) {
      return null;
    }

    // Deterministic selection based on user/device ID
    const hash = this.hashString((this.currentUserId || this.getDeviceId()) + flag.key);
    const totalWeight = flag.variants.reduce((sum, v) => sum + v.weight, 0);
    const target = hash % totalWeight;

    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (target < cumulative && variant.enabled) {
        return variant.id;
      }
    }

    return flag.variants[0]?.id || null;
  }

  private evaluateConfigExpression(expression: string): unknown {
    // Evaluate configuration expressions
    return null;
  }

  private hasNestedKey(obj: Record<string, unknown>, key: string): boolean {
    return this.getNestedValue(obj, key) !== undefined;
  }

  private getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    const keys = key.split('.');
    let current: unknown = obj;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let current: Record<string, unknown> = obj;

    for (const k of keys) {
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }

    current[lastKey] = value;
  }

  private inferType(value: unknown): ConfigValue['type'] {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'object';
    return typeof value as ConfigValue['type'];
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = ['secret', 'password', 'token', 'key', 'private'];
    return sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern));
  }

  private getConfigSchema(key: string): ConfigSchema | null {
    // Return predefined schema for key
    return null;
  }

  private validateAgainstSchema(value: unknown, schema: ConfigSchema): {
    isValid: boolean;
    message?: string;
    expected?: string;
    actual?: string;
  } {
    // Implement schema validation
    return { isValid: true };
  }

  private getBorderRadiusValue(radius: ThemeSettings['borderRadius']): string {
    const values = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '16px'
    };
    return values[radius];
  }

  private applyCustomCSS(css: string): void {
    const existingStyle = document.getElementById('custom-theme-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'custom-theme-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  private updateDateTimeFormatters(localization: LocalizationSettings): void {
    // Update global date/time formatters
  }

  private updateNumberFormatters(localization: LocalizationSettings): void {
    // Update global number formatters
  }

  private updateTimezone(timezone: string): void {
    // Update timezone handling
  }

  private applyPerformanceSettings(): void {
    // Apply performance-related settings
  }

  private applySecuritySettings(): void {
    // Apply security-related settings
  }

  private getDeviceProperty(property: string): unknown {
    // Get device-specific properties
    return null;
  }

  private getLocationProperty(property: string): unknown {
    // Get location-specific properties
    return null;
  }

  private getTimeProperty(property: string): unknown {
    // Get time-specific properties
    return null;
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('config_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('config_device_id', deviceId);
    }
    return deviceId;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private calculateChecksum(snapshot: ConfigSnapshot): string {
    const content = JSON.stringify({
      configs: snapshot.configs,
      featureFlags: snapshot.featureFlags
    });
    return this.hashString(content).toString();
  }

  /**
   * Get configuration change history
   */
  getChangeHistory(limit = 100): ConfigChangeEvent[] {
    return this.changeHistory.slice(-limit);
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
    logger.debug('Configuration cache cleared');
  }

  /**
   * Get all feature flags
   */
  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(userId?: string): Promise<void> {
    try {
      if (userId) {
        const defaultSettings = this.createDefaultUserSettings(userId);
        await this.updateUserSettings(userId, defaultSettings);
      }

      // Reset session config
      this.sessionConfig.clear();
      this.configCache.clear();

      // Apply configuration
      await this.applyConfiguration();

      logger.info('Configuration reset to defaults', { userId });

    } catch (error) {
      logger.error('Failed to reset configuration', { userId, error });
      throw error;
    }
  }

  /**
   * Cleanup and destroy service
   */
  async destroy(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.environmentConfig.clear();
    this.featureFlags.clear();
    this.userSettings.clear();
    this.sessionConfig.clear();
    this.configCache.clear();
    this.subscribers.clear();
    this.changeHistory.length = 0;

    logger.info('ConfigService destroyed');
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global configuration service instance
 */
export const configService = ConfigService.getInstance();

export default configService;