/**
 * System Status Panel Configuration Constants
 *
 * Centralized configuration for the SystemStatusPanel component following
 * enterprise-grade practices with type safety and maintainability.
 *
 * @author Engineering Team
 * @since 1.0.0
 * @version 1.0.0
 */

// Branded types for enhanced type safety
export type InspectorId = string & { readonly __brand: unique symbol };
export type PropertyId = string & { readonly __brand: unique symbol };
export type InspectionId = string & { readonly __brand: unique symbol };
export type UserId = string & { readonly __brand: unique symbol };

/**
 * Cache configuration for intelligent data management
 * TTL values optimized for production performance and data freshness
 */
export const CACHE_CONFIG = {
  /** System metrics cache - 30 second TTL for real-time feel */
  systemMetrics: {
    ttl: 30000,
    key: "system-metrics-v1.2",
    maxRetries: 3,
  },
  /** Inspector workload cache - 60 second TTL for less volatile data */
  inspectorWorkload: {
    ttl: 60000,
    key: "inspector-workload-v1.2",
    maxRetries: 3,
  },
  /** User profile cache - 5 minute TTL for profile data */
  userProfile: {
    ttl: 300000,
    key: "user-profile-v1.2",
    maxRetries: 2,
  },
  /** Properties cache - 2 minute TTL for property counts */
  properties: {
    ttl: 120000,
    key: "properties-count-v1.2",
    maxRetries: 3,
  },
} as const;

/**
 * Polling intervals optimized for production performance
 * Intelligent polling that adapts to user activity
 */
export const POLLING_CONFIG = {
  /** Active user polling - when user is actively viewing */
  active: 30000,
  /** Inactive user polling - when tab is not visible */
  inactive: 120000,
  /** Background polling - when user is away */
  background: 300000,
  /** Maximum polling interval */
  maximum: 600000,
  /** Minimum polling interval */
  minimum: 10000,
} as const;

/**
 * Retry configuration with exponential backoff
 * Production-tested values for resilient error handling
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxAttempts: 3,
  /** Base delay for exponential backoff (milliseconds) */
  baseDelay: 1000,
  /** Maximum delay between retries (milliseconds) */
  maxDelay: 30000,
  /** Jitter factor to prevent thundering herd */
  jitterFactor: 0.1,
} as const;

/**
 * Performance thresholds for system health assessment
 * Values calibrated against production SLA requirements
 */
export const PERFORMANCE_THRESHOLDS = {
  /** System uptime thresholds */
  uptime: {
    excellent: 99.9,
    good: 99.0,
    warning: 97.0,
    critical: 95.0,
  },
  /** Inspection completion rate thresholds */
  completionRate: {
    excellent: 95.0,
    good: 85.0,
    warning: 70.0,
    critical: 50.0,
  },
  /** Average response time thresholds (milliseconds) */
  responseTime: {
    excellent: 200,
    good: 500,
    warning: 1000,
    critical: 2000,
  },
  /** Inspector efficiency thresholds */
  inspectorEfficiency: {
    excellent: 90.0,
    good: 80.0,
    warning: 65.0,
    critical: 50.0,
  },
} as const;

/**
 * UI Configuration constants
 * Design system values for consistent user experience
 */
export const UI_CONFIG = {
  /** Animation durations in milliseconds */
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  /** Loading states */
  loading: {
    skeletonRows: 4,
    minDisplayTime: 300,
    maxDisplayTime: 10000,
  },
  /** Toast notification configuration */
  notifications: {
    defaultDuration: 4000,
    errorDuration: 8000,
    successDuration: 3000,
  },
} as const;

/**
 * Component element IDs following strict naming convention
 * Format: {component}-{purpose}-{element-type}
 */
export const ELEMENT_IDS = {
  // Main container elements
  systemStatusDashboardContainer: "system-status-dashboard-container",
  systemStatusPanelCard: "system-status-panel-card",
  systemStatusHeaderSection: "system-status-header-section",
  systemStatusContentArea: "system-status-content-area",

  // Metrics grid elements
  systemMetricsGridLayout: "system-metrics-grid-layout",
  totalPropertiesMetricCard: "total-properties-metric-card",
  propertiesCountDisplay: "properties-count-display",
  propertiesTrendIndicator: "properties-trend-indicator",
  totalInspectionsMetricCard: "total-inspections-metric-card",
  inspectionsCompletionRateDisplay: "inspections-completion-rate-display",
  inspectionsStatusBreakdown: "inspections-status-breakdown",
  activeInspectorsMetricCard: "active-inspectors-metric-card",
  inspectorWorkloadDistribution: "inspector-workload-distribution",
  totalUsersMetricCard: "total-users-metric-card",
  usersRoleBreakdown: "users-role-breakdown",

  // Performance metrics elements
  performanceMetricsSection: "performance-metrics-section",
  completionRateProgressBar: "completion-rate-progress-bar",
  completionRateProgressContainer: "completion-rate-progress-container",
  systemUptimeProgressBar: "system-uptime-progress-bar",
  systemUptimeProgressContainer: "system-uptime-progress-container",
  averageCompletionTimeDisplay: "average-completion-time-display",

  // PWA Performance elements
  pwaPerformanceMetricsSection: "pwa-performance-metrics-section",
  pwaScoreMetricCard: "pwa-score-metric-card",
  networkStatusMetricCard: "network-status-metric-card",
  batteryOptimizationMetricCard: "battery-optimization-metric-card",
  cacheHitRateMetricCard: "cache-hit-rate-metric-card",
  coreWebVitalsSection: "core-web-vitals-section",
  lcpProgressBar: "lcp-progress-bar",
  fidProgressBar: "fid-progress-bar",
  clsProgressBar: "cls-progress-bar",

  // Navigation elements
  systemHealthNavigationSection: "system-health-navigation-section",
  navigationButtonContainer: "navigation-button-container",
  systemHealthNavigationButton: "system-health-navigation-button",

  // Compact view elements
  compactStatusIndicator: "compact-status-indicator",
  compactUptimeDisplay: "compact-uptime-display",
  compactInspectionsBadge: "compact-inspections-badge",

  // Workload distribution elements
  workloadDistributionSection: "workload-distribution-section",
  completedInspectionsCard: "completed-inspections-card",
  pendingInspectionsCard: "pending-inspections-card",

  // Loading and error states
  systemStatusLoadingContainer: "system-status-loading-container",
  systemStatusErrorContainer: "system-status-error-container",
  loadingSkeletonGrid: "loading-skeleton-grid",
  errorFallbackDisplay: "error-fallback-display",

  // Accessibility elements
  metricsRegionLive: "metrics-region-live",
  statusUpdateAnnouncement: "status-update-announcement",
  navigationHelpText: "navigation-help-text",
} as const;

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 */
export const ACCESSIBILITY_CONFIG = {
  /** ARIA live region politeness levels */
  liveRegions: {
    polite: "polite",
    assertive: "assertive",
    off: "off",
  },
  /** Screen reader text for complex UI elements */
  screenReaderText: {
    systemHealthNavigation:
      "Navigate to comprehensive system health monitoring dashboard with real-time metrics, performance graphs, and diagnostic tools",
    metricsRegion: "System status metrics updated every 30 seconds",
    loadingState: "Loading system metrics, please wait",
    errorState: "System metrics temporarily unavailable, showing cached data",
    uptimeStatus: (uptime: number) =>
      `System uptime is ${uptime} percent, ${uptime >= 99 ? "excellent" : uptime >= 95 ? "good" : uptime >= 90 ? "warning" : "critical"} status`,
    completionRate: (rate: number) =>
      `Inspection completion rate is ${rate} percent, ${rate >= 90 ? "excellent" : rate >= 80 ? "good" : rate >= 70 ? "warning" : "needs attention"} performance`,
  },
  /** Focus management configuration */
  focus: {
    skipLinkTarget: "main-content",
    trapInModal: true,
    restoreOnClose: true,
  },
} as const;

/**
 * Error messages and fallback states
 * User-friendly messages that never expose technical details
 */
export const ERROR_MESSAGES = {
  /** Network-related errors */
  network: {
    offline: "System is updating. Showing recent data.",
    timeout: "Refreshing system data...",
    serverError: "Updating metrics, please wait.",
    rateLimited: "System is busy. Refreshing shortly.",
  },
  /** Data validation errors */
  validation: {
    invalidData: "Recalculating metrics...",
    missingData: "Loading system data...",
    corruptedData: "Refreshing data source...",
  },
  /** Generic fallback messages */
  generic: {
    unknown: "System metrics updating...",
    maintenance: "System maintenance in progress.",
    degraded: "Operating in backup mode.",
  },
} as const;

/**
 * Default/fallback values for graceful degradation
 */
export const FALLBACK_VALUES = {
  systemMetrics: {
    totalProperties: 0,
    totalInspections: 0,
    totalUsers: 0,
    activeInspectors: 0,
    completedInspections: 0,
    pendingInspections: 0,
    completionRate: 0,
    systemUptime: 99.9,
    averageResponseTime: 250,
    lastUpdated: new Date().toISOString(),
    status: "loading" as const,
  },
  coreWebVitals: {
    lcp: 2200,
    fid: 65,
    cls: 0.08,
  },
  pwaMetrics: {
    pwaScore: 85,
    networkStatus: "optimal" as const,
    batteryOptimization: "optimal" as const,
    cacheHitRate: 87,
  },
} as const;
