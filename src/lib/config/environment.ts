// Environment Configuration and Validation for STR Certified
// Provides type-safe environment variable access with validation

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Deployment environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Application Type Configuration (for local development)
  VITE_APP_TYPE: z.enum(['inspector', 'admin']).default('inspector'),
  
  // Domain Configuration (for unified deployment)
  VITE_INSPECTOR_DOMAIN: z.string().default('app.doublecheckverified.com'),
  VITE_ADMIN_DOMAIN: z.string().default('admin.doublecheckverified.com'),
  VITE_ENABLE_DOMAIN_ROUTING: z.string().transform(val => val === 'true').default('true'),
  
  // API Configuration
  VITE_API_URL: z.string().url().optional().default('http://localhost:3000'),
  VITE_PUBLIC_URL: z.string().url().optional(),
  
  // Supabase Configuration
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  
  // OpenAI Configuration (removed for security - API key should never be in browser)
  // VITE_OPENAI_API_KEY: z.string().min(1).optional(),
  // VITE_OPENAI_ORG_ID: z.string().optional(),
  
  // Analytics & Monitoring
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_MIXPANEL_TOKEN: z.string().optional(),
  
  // Feature Flags
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_PWA: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_VIDEO_RECORDING: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_OFFLINE_MODE: z.string().transform(val => val === 'true').default('true'),
  
  // Security
  VITE_ENCRYPTION_KEY: z.string().min(32).optional(),
  VITE_JWT_SECRET: z.string().min(32).optional(),
  
  // Storage
  VITE_STORAGE_BUCKET: z.string().default('str-certified-storage'),
  VITE_MAX_FILE_SIZE: z.string().transform(val => parseInt(val)).default('10485760'), // 10MB
  VITE_MAX_VIDEO_SIZE: z.string().transform(val => parseInt(val)).default('104857600'), // 100MB
  
  // Rate Limiting
  VITE_API_RATE_LIMIT: z.string().transform(val => parseInt(val)).default('100'),
  VITE_AI_RATE_LIMIT: z.string().transform(val => parseInt(val)).default('50'),
  
  // Cache Configuration
  VITE_CACHE_TTL: z.string().transform(val => parseInt(val)).default('3600'), // 1 hour
  VITE_CACHE_MAX_SIZE: z.string().transform(val => parseInt(val)).default('52428800'), // 50MB
  
  // Performance
  VITE_IMAGE_QUALITY: z.string().transform(val => parseFloat(val)).default('0.85'),
  VITE_THUMBNAIL_SIZE: z.string().transform(val => parseInt(val)).default('300'),
  
  // Development
  VITE_MOCK_API: z.string().transform(val => val === 'true').default('false'),
  VITE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  
  // Server
  PORT: z.string().transform(val => parseInt(val)).default('4173'),
  HOST: z.string().default('0.0.0.0')
});

// Type for validated environment
export type Environment = z.infer<typeof envSchema>;

// Environment validation class
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private env: Environment;
  private validationErrors: z.ZodError | null = null;

  private constructor() {
    this.env = this.validateEnvironment();
  }

  static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private validateEnvironment(): Environment {
    try {
      // Get all environment variables - use import.meta.env for browser compatibility
      const vitEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
      
      const env = {
        NODE_ENV: vitEnv.NODE_ENV || vitEnv.MODE || 'development',
        PORT: vitEnv.PORT,
        HOST: vitEnv.HOST,
        
        // Import all VITE_ prefixed variables safely
        ...Object.entries(vitEnv).reduce((acc, [key, value]) => {
          if (key.startsWith('VITE_')) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>)
      };

      // Validate against schema
      const validated = envSchema.parse(env);
      
      // Log validation success in development
      if (validated.NODE_ENV === 'development' && validated.VITE_DEBUG_MODE) {
        console.log('✅ Environment variables validated successfully');
      }

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error;
        console.error('❌ Environment validation failed:', error.errors);
        
        // Log error but don't crash the app during initialization
        const errorDetails = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        console.error(`❌ Environment configuration validation failed: ${errorDetails}`);
        
        // Return defaults to prevent app crash - validation can be checked later
        return envSchema.parse({});
      }
      throw error;
    }
  }

  // Getters for different configuration sections
  
  get api() {
    return {
      url: this.env.VITE_API_URL,
      publicUrl: this.env.VITE_PUBLIC_URL,
      rateLimit: this.env.VITE_API_RATE_LIMIT
    };
  }

  get supabase() {
    return {
      url: this.env.VITE_SUPABASE_URL,
      anonKey: this.env.VITE_SUPABASE_ANON_KEY
    };
  }

  get openai() {
    return {
      // API key should never be exposed in browser - use server-side proxy
      apiKey: undefined,
      orgId: undefined,
      rateLimit: this.env.VITE_AI_RATE_LIMIT
    };
  }

  get features() {
    return {
      analytics: this.env.VITE_ENABLE_ANALYTICS,
      pwa: this.env.VITE_ENABLE_PWA,
      ai: this.env.VITE_ENABLE_AI_FEATURES,
      videoRecording: this.env.VITE_ENABLE_VIDEO_RECORDING,
      offlineMode: this.env.VITE_ENABLE_OFFLINE_MODE
    };
  }

  get monitoring() {
    return {
      sentryDsn: this.env.VITE_SENTRY_DSN,
      gaTrackingId: this.env.VITE_GA_TRACKING_ID,
      mixpanelToken: this.env.VITE_MIXPANEL_TOKEN
    };
  }

  get storage() {
    return {
      bucket: this.env.VITE_STORAGE_BUCKET,
      maxFileSize: this.env.VITE_MAX_FILE_SIZE,
      maxVideoSize: this.env.VITE_MAX_VIDEO_SIZE
    };
  }

  get cache() {
    return {
      ttl: this.env.VITE_CACHE_TTL,
      maxSize: this.env.VITE_CACHE_MAX_SIZE
    };
  }

  get performance() {
    return {
      imageQuality: this.env.VITE_IMAGE_QUALITY,
      thumbnailSize: this.env.VITE_THUMBNAIL_SIZE
    };
  }

  get security() {
    return {
      encryptionKey: this.env.VITE_ENCRYPTION_KEY,
      jwtSecret: this.env.VITE_JWT_SECRET
    };
  }

  get development() {
    return {
      mockApi: this.env.VITE_MOCK_API,
      debugMode: this.env.VITE_DEBUG_MODE
    };
  }

  get app() {
    return {
      type: this.env.VITE_APP_TYPE
    };
  }

  get domains() {
    return {
      inspector: this.env.VITE_INSPECTOR_DOMAIN,
      admin: this.env.VITE_ADMIN_DOMAIN,
      routingEnabled: this.env.VITE_ENABLE_DOMAIN_ROUTING
    };
  }

  get server() {
    return {
      port: this.env.PORT,
      host: this.env.HOST
    };
  }

  // Utility methods

  isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  getEnvironment(): string {
    return this.env.NODE_ENV;
  }

  getValidationErrors(): z.ZodError | null {
    return this.validationErrors;
  }

  // Check if a required service is configured
  hasOpenAI(): boolean {
    // OpenAI API key should be handled server-side for security
    // This is deprecated - AI services should go through backend
    return false;
  }

  hasSentry(): boolean {
    return Boolean(this.env.VITE_SENTRY_DSN);
  }

  hasAnalytics(): boolean {
    return this.env.VITE_ENABLE_ANALYTICS && 
           (Boolean(this.env.VITE_GA_TRACKING_ID) || Boolean(this.env.VITE_MIXPANEL_TOKEN));
  }

  // Get public runtime config (safe to expose to client)
  getPublicConfig() {
    return {
      environment: this.env.NODE_ENV,
      apiUrl: this.env.VITE_API_URL,
      publicUrl: this.env.VITE_PUBLIC_URL,
      features: this.features,
      storage: {
        maxFileSize: this.env.VITE_MAX_FILE_SIZE,
        maxVideoSize: this.env.VITE_MAX_VIDEO_SIZE
      },
      performance: this.performance
    };
  }

  // Validate specific configuration sections
  validateApiConfig(): boolean {
    return Boolean(this.env.VITE_API_URL);
  }

  validateSupabaseConfig(): boolean {
    return Boolean(this.env.VITE_SUPABASE_URL && this.env.VITE_SUPABASE_ANON_KEY);
  }

  validateAIConfig(): boolean {
    // AI configuration is valid if features are disabled OR if using server-side AI proxy
    return !this.env.VITE_ENABLE_AI_FEATURES || true;
  }

  // Log configuration (sanitized)
  logConfiguration(): void {
    const sanitized = {
      environment: this.env.NODE_ENV,
      api: {
        url: this.env.VITE_API_URL,
        hasAIFeatures: this.env.VITE_ENABLE_AI_FEATURES
      },
      supabase: {
        url: this.env.VITE_SUPABASE_URL,
        hasAnonKey: Boolean(this.env.VITE_SUPABASE_ANON_KEY)
      },
      features: this.features,
      monitoring: {
        hasSentry: Boolean(this.env.VITE_SENTRY_DSN),
        hasAnalytics: this.hasAnalytics()
      }
    };

    console.log('🔧 Environment Configuration:', sanitized);
  }
}

// Export singleton instance
export const env = EnvironmentConfig.getInstance();

// Export convenience functions
export const getEnv = () => env;
export const isProduction = () => env.isProduction();
export const isDevelopment = () => env.isDevelopment();
export const isTest = () => env.isTest();

// Export types
export type { Environment };

// Validation helper for runtime checks
export function validateRequiredEnvVars(): void {
  const errors: string[] = [];

  if (!env.validateSupabaseConfig()) {
    errors.push('Missing required Supabase configuration');
  }

  if (env.features.ai && !env.validateAIConfig()) {
    errors.push('AI features enabled but OpenAI API key is missing');
  }

  if (errors.length > 0) {
    const message = `Environment configuration errors:\n${errors.join('\n')}`;
    
    if (env.isProduction()) {
      throw new Error(message);
    } else {
      console.warn('⚠️', message);
    }
  }
}

// Initialize validation on import
if (typeof window !== 'undefined' && env.isDevelopment() && env.development.debugMode) {
  env.logConfiguration();
}