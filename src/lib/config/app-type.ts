// App Type Configuration for Domain-Specific Builds
// Handles routing and feature separation between inspector and admin apps

export enum AppType {
  INSPECTOR = 'inspector',
  ADMIN = 'admin'
}

export interface AppTypeConfig {
  type: AppType;
  enabledFeatures: string[];
  excludedRoutes: string[];
  requiredRoles: string[];
  bundle: {
    includeComponents: string[];
    excludeComponents: string[];
  };
}

// Configuration for each app type
export const APP_TYPE_CONFIGS: Record<AppType, AppTypeConfig> = {
  [AppType.INSPECTOR]: {
    type: AppType.INSPECTOR,
    enabledFeatures: [
      'mobile-optimization',
      'pwa',
      'offline-mode',
      'photo-capture',
      'video-recording',
      'property-selection',
      'inspection-workflow'
    ],
    excludedRoutes: [
      '/auditor',
      '/admin/*',
      '/debug-inspection/*'
    ],
    requiredRoles: ['inspector'],
    bundle: {
      includeComponents: [
        'mobile/*',
        'photo/*',
        'video/*',
        'scrapers/*',
        'InspectorWorkflow',
        'PropertySelection',
        'InspectionPage',
        'AddProperty'
      ],
      excludeComponents: [
        'admin/*',
        'audit/*',
        'AuditorDashboard',
        'DebugInspectionPage',
        'AIPerformanceDashboard'
      ]
    }
  },
  [AppType.ADMIN]: {
    type: AppType.ADMIN,
    enabledFeatures: [
      'analytics',
      'monitoring',
      'ai-performance-tracking',
      'audit-workflows',
      'admin-dashboard',
      'debug-tools'
    ],
    excludedRoutes: [
      '/inspector',
      '/properties',
      '/add-property',
      '/inspection/*',
      '/inspection-complete/*'
    ],
    requiredRoles: ['auditor', 'admin'],
    bundle: {
      includeComponents: [
        'admin/*',
        'audit/*',
        'ai/*',
        'AuditorDashboard',
        'DebugInspectionPage',
        'AIPerformanceDashboard'
      ],
      excludeComponents: [
        'mobile/*',
        'photo/*',
        'video/*',
        'scrapers/*',
        'InspectorWorkflow',
        'PropertySelection',
        'AddProperty'
      ]
    }
  }
};

// Get app type from domain detection (for unified deployment)
export function getAppTypeFromDomain(): AppType {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering fallback - check environment
    const appType = import.meta.env.VITE_APP_TYPE || process.env.VITE_APP_TYPE;
    return appType === 'admin' ? AppType.ADMIN : AppType.INSPECTOR;
  }
  
  const hostname = window.location.hostname;
  
  // Check for admin domain
  if (hostname.includes('admin.doublecheckverified.com')) {
    return AppType.ADMIN;
  }
  
  // Check for inspector domain
  if (hostname.includes('app.doublecheckverified.com')) {
    return AppType.INSPECTOR;
  }
  
  // For local development or other domains
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Use environment variable for local development
    const appType = import.meta.env.VITE_APP_TYPE || process.env.VITE_APP_TYPE;
    return appType === 'admin' ? AppType.ADMIN : AppType.INSPECTOR;
  }
  
  // Default to inspector for unknown domains
  return AppType.INSPECTOR;
}

// Backward compatibility - now uses domain detection
export function getAppTypeFromEnvironment(): AppType {
  return getAppTypeFromDomain();
}

// Get current app configuration
export function getCurrentAppConfig(): AppTypeConfig {
  const appType = getAppTypeFromEnvironment();
  return APP_TYPE_CONFIGS[appType];
}

// Check if a route should be excluded for current app type
export function isRouteExcluded(route: string): boolean {
  const config = getCurrentAppConfig();
  return config.excludedRoutes.some(excludedRoute => {
    if (excludedRoute.endsWith('/*')) {
      const baseRoute = excludedRoute.slice(0, -2);
      return route.startsWith(baseRoute);
    }
    return route === excludedRoute;
  });
}

// Check if a feature is enabled for current app type
export function isFeatureEnabled(feature: string): boolean {
  const config = getCurrentAppConfig();
  return config.enabledFeatures.includes(feature);
}

// Check if user role is allowed for current app type
export function isRoleAllowed(role: string): boolean {
  const config = getCurrentAppConfig();
  
  // Direct role match
  if (config.requiredRoles.includes(role)) {
    return true;
  }
  
  // Role hierarchy: admin can access all roles, auditor can access inspector
  if (config.requiredRoles.includes('admin') && (role === 'inspector' || role === 'auditor')) {
    return true;
  }
  
  if (config.requiredRoles.includes('auditor') && role === 'inspector') {
    return true;
  }
  
  return false;
}

// Domain utility functions
export function getCurrentDomain(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}

export function isInspectorDomain(): boolean {
  const domain = getCurrentDomain();
  return domain.includes('app.doublecheckverified.com') || 
         (domain.includes('localhost') && getAppTypeFromEnvironment() === AppType.INSPECTOR);
}

export function isAdminDomain(): boolean {
  const domain = getCurrentDomain();
  return domain.includes('admin.doublecheckverified.com') || 
         (domain.includes('localhost') && getAppTypeFromEnvironment() === AppType.ADMIN);
}

export function isDevelopmentDomain(): boolean {
  const domain = getCurrentDomain();
  return domain.includes('localhost') || domain.includes('127.0.0.1') || domain.includes('.local');
}

// Get routes for current app type
export function getAppRoutes(): string[] {
  const config = getCurrentAppConfig();
  
  if (config.type === AppType.INSPECTOR) {
    return [
      '/',
      '/inspector',
      '/properties',
      '/add-property',
      '/inspection/:id',
      '/inspection-complete/:id',
      '/health'
    ];
  }
  
  if (config.type === AppType.ADMIN) {
    return [
      '/',
      '/auditor',
      '/admin/*',
      '/debug-inspection/:id',
      '/health'
    ];
  }
  
  return [];
}

// Bundle optimization helpers
export function shouldIncludeComponent(componentPath: string): boolean {
  const config = getCurrentAppConfig();
  
  // Check if component should be excluded
  const isExcluded = config.bundle.excludeComponents.some(pattern => {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      return componentPath.includes(basePattern);
    }
    return componentPath.includes(pattern);
  });
  
  if (isExcluded) {
    return false;
  }
  
  // Check if component should be included
  return config.bundle.includeComponents.some(pattern => {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      return componentPath.includes(basePattern);
    }
    return componentPath.includes(pattern);
  });
}

// Development helpers
export function getAppTypeDisplayName(): string {
  const config = getCurrentAppConfig();
  return config.type === AppType.INSPECTOR ? 'Inspector App' : 'Admin/Audit App';
}

export function logAppConfiguration(): void {
  const config = getCurrentAppConfig();
  const domain = getCurrentDomain();
  
  log.info('App configuration loaded', {
    component: 'AppType',
    action: 'logAppConfiguration',
    domain: domain.current,
    appType: config.type,
    isInspector: isInspectorDomain(),
    isAdmin: isAdminDomain(),
    isDevelopment: isDevelopmentDomain()
  }, 'APP_CONFIGURATION_LOADED');
  
  log.debug('Bundle configuration', {
    component: 'AppType',
    action: 'logAppConfiguration',
    includes: config.bundle.includeComponents.length,
    excludes: config.bundle.excludeComponents.length
  }, 'BUNDLE_CONFIGURATION');
}