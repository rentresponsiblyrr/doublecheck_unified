/**
 * System Status Panel - Main Export
 *
 * This file re-exports the enterprise-grade SystemStatusPanel component
 * to maintain backward compatibility while providing all elite features.
 *
 * @author STR Certified Engineering Team
 * @since 1.0.0
 * @version 2.0.0 (Enterprise Upgrade)
 */

// Re-export the enterprise SystemStatusPanel as the default
export {
  SystemStatusPanel as default,
  SystemStatusPanel,
  EnterpriseSystemStatusPanel,
} from "./SystemStatusPanel/index";

// Re-export error boundary for direct access
export { default as SystemStatusErrorBoundary } from "./SystemStatusPanel/SystemStatusErrorBoundary";

// Re-export utilities for advanced usage
export type {
  SystemMetrics,
  SystemHealthStatus,
  InspectorWorkload,
  PerformanceMetrics,
} from "./SystemStatusPanel/systemStatusUtils";

// Re-export constants for configuration
export {
  POLLING_CONFIG,
  CACHE_CONFIG,
  HEALTH_THRESHOLDS,
  STATUS_COLORS,
} from "./SystemStatusPanel/systemStatusConstants";
