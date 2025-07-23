/**
 * Type definitions for SystemStatusPanel and related components
 *
 * @author STR Certified Engineering Team
 * @since 2.0.0
 */

/**
 * Error context interface for comprehensive error tracking
 */
export interface ErrorContext {
  component: string;
  action: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Component props interface with comprehensive configuration options
 */
export interface SystemStatusPanelProps {
  /** Custom refresh interval in milliseconds (default: 30000) */
  refreshInterval?: number;

  /** Callback function for navigation to system health dashboard */
  onNavigateToHealth?: (path: string) => void;

  /** Enable/disable real-time polling updates (default: true) */
  enableRealTimeUpdates?: boolean;

  /** Custom CSS classes for styling customization */
  className?: string;

  /** Show detailed metrics in expanded view (default: false) */
  showDetailedMetrics?: boolean;

  /** Enable performance monitoring and telemetry (default: true) */
  enableTelemetry?: boolean;

  /** Custom error handler for external error tracking */
  onError?: (error: Error, context: ErrorContext) => void;

  /** Theme variant for different UI contexts */
  variant?: "default" | "compact" | "detailed";

  /** Maximum number of retry attempts for failed requests */
  maxRetries?: number;
}

/**
 * Internal component state interface
 */
export interface SystemStatusState {
  metrics: SystemMetrics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  lastUpdateTime: string;
  retryCount: number;
  pollingActive: boolean;
  userInteracting: boolean;
  performanceScore: number;
  connectionStatus: "online" | "offline" | "limited";
}

/**
 * Performance metrics tracking interface
 */
export interface PerformanceMetrics {
  renderTime: number;
  fetchTime: number;
  cacheHitRate: number;
  errorRate: number;
  userInteractions: number;
}

/**
 * Re-export system metrics types from utils
 */
export type { SystemMetrics, InspectorWorkload } from "./systemStatusUtils";
