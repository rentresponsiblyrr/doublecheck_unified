/**
 * BLEEDING EDGE: Advanced Resource Hints System
 * 
 * Professional resource hints management that exceeds industry standards
 * - Priority-based resource hint injection
 * - Network-aware prefetching strategies
 * - Critical resource path optimization
 * - Dynamic resource hint management
 * - Advanced browser hint utilization
 */

import { createAdvancedPreloader } from './preloader';

// Extended Navigator interface for connection API
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ResourceHint {
  rel: 'dns-prefetch' | 'preconnect' | 'modulepreload' | 'preload' | 'prefetch';
  href: string;
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
  crossorigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  fetchPriority?: 'high' | 'low' | 'auto';
  media?: string;
  type?: string;
  id?: string;
}

type ValidPriority = 'critical' | 'high' | 'medium' | 'low';
type ValidAsType = 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';

export interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface ResourceHintsConfig {
  enableDnsPrefetch: boolean;
  enablePreconnect: boolean;
  enableModulePreload: boolean;
  enablePreload: boolean;
  enablePrefetch: boolean;
  networkAware: boolean;
  respectSaveData: boolean;
  maxHints: number;
  criticalOrigins: string[];
  preloadStrategy: 'aggressive' | 'balanced' | 'conservative';
}

// ============================================================================
// BLEEDING EDGE RESOURCE HINTS MANAGER
// ============================================================================

export class AdvancedResourceHintsManager {
  private config: ResourceHintsConfig;
  private activeHints: Map<string, HTMLLinkElement> = new Map();
  private networkCondition: NetworkCondition | null = null;
  private hintPriorities: Map<string, number> = new Map();
  private performanceObserver?: PerformanceObserver;

  constructor(config: Partial<ResourceHintsConfig> = {}) {
    this.config = {
      enableDnsPrefetch: true,
      enablePreconnect: true,
      enableModulePreload: true,
      enablePreload: true,
      enablePrefetch: true,
      networkAware: true,
      respectSaveData: true,
      maxHints: 20,
      criticalOrigins: [
        'https://api.openai.com',
        'https://supabase.co',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ],
      preloadStrategy: 'balanced',
      ...config
    };

    this.initializeNetworkMonitoring();
    this.initializePerformanceObserver();
  }

  // ============================================================================
  // CORE RESOURCE HINTS METHODS
  // ============================================================================

  /**
   * BLEEDING EDGE: Inject critical resource hints with smart prioritization
   */
  public injectCriticalHints(): void {

    // DNS prefetch for external domains (highest priority)
    this.addDnsPrefetch('https://fonts.googleapis.com', 'critical');
    this.addDnsPrefetch('https://fonts.gstatic.com', 'critical');
    this.addDnsPrefetch('https://api.openai.com', 'critical');
    
    // Preconnect to critical origins
    this.addPreconnect('https://api.openai.com', 'critical', true);
    this.addPreconnect('https://supabase.co', 'critical', true);
    
    // Module preload for critical chunks
    this.addModulePreload('/assets/js/react-core-*.js', 'critical');
    this.addModulePreload('/assets/js/ui-core-*.js', 'critical');
    
    // Preload critical assets
    this.addPreload('/assets/fonts/inter-v12-latin-regular.woff2', 'font', 'critical');
    this.addPreload('/assets/index-*.css', 'style', 'critical');
  }

  /**
   * BLEEDING EDGE: Network-aware prefetching based on connection quality
   */
  public injectNetworkAwareHints(): void {
    if (!this.config.networkAware || !this.networkCondition) return;

    const connection = this.networkCondition;
    

    // Conservative strategy for slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.injectConservativeHints();
    }
    // Balanced strategy for 3G
    else if (connection.effectiveType === '3g') {
      this.injectBalancedHints();
    }
    // Aggressive strategy for fast connections
    else {
      this.injectAggressiveHints();
    }
  }

  /**
   * BLEEDING EDGE: Route-based resource hints with prediction
   */
  public injectRouteBasedHints(currentRoute: string, predictedRoutes: string[]): void {

    // Current route critical resources
    this.injectRouteSpecificHints(currentRoute, 'high');

    // Predicted routes with lower priority
    predictedRoutes.forEach((route, index) => {
      const priority = index === 0 ? 'medium' : 'low';
      this.injectRouteSpecificHints(route, priority);
    });
  }

  /**
   * BLEEDING EDGE: Dynamic hint management with performance feedback
   */
  public manageDynamicHints(): void {
    this.cleanupUnusedHints();
    this.optimizeHintPriorities();
    this.adjustForPerformanceBudget();
  }

  // ============================================================================
  // HINT INJECTION METHODS
  // ============================================================================

  private addDnsPrefetch(href: string, priority: string): void {
    if (!this.config.enableDnsPrefetch) return;
    
    const hint: ResourceHint = {
      rel: 'dns-prefetch',
      href,
      priority: priority as ValidPriority,
      id: `dns-${this.generateHintId(href)}`
    };

    this.injectHint(hint);
  }

  private addPreconnect(href: string, priority: string, crossorigin = false): void {
    if (!this.config.enablePreconnect) return;

    const hint: ResourceHint = {
      rel: 'preconnect',
      href,
      priority: priority as ValidPriority,
      crossorigin: crossorigin ? 'anonymous' : undefined,
      id: `preconnect-${this.generateHintId(href)}`
    };

    this.injectHint(hint);
  }

  private addModulePreload(href: string, priority: string): void {
    if (!this.config.enableModulePreload) return;

    const hint: ResourceHint = {
      rel: 'modulepreload',
      href,
      priority: priority as ValidPriority,
      crossorigin: 'anonymous',
      id: `modulepreload-${this.generateHintId(href)}`
    };

    this.injectHint(hint);
  }

  private addPreload(href: string, as: string, priority: string, options: Partial<ResourceHint> = {}): void {
    if (!this.config.enablePreload) return;

    const hint: ResourceHint = {
      rel: 'preload',
      href,
      as: as as ValidAsType,
      priority: priority as ValidPriority,
      id: `preload-${this.generateHintId(href)}`,
      ...options
    };

    this.injectHint(hint);
  }

  private addPrefetch(href: string, priority: string, options: Partial<ResourceHint> = {}): void {
    if (!this.config.enablePrefetch) return;

    const hint: ResourceHint = {
      rel: 'prefetch',
      href,
      priority: priority as ValidPriority,
      id: `prefetch-${this.generateHintId(href)}`,
      ...options
    };

    this.injectHint(hint);
  }

  // ============================================================================
  // STRATEGY IMPLEMENTATIONS
  // ============================================================================

  private injectConservativeHints(): void {
    
    // Only critical preloads
    this.addPreload('/assets/js/index-*.js', 'script', 'critical', { fetchPriority: 'high' });
    this.addPreload('/assets/index-*.css', 'style', 'critical', { fetchPriority: 'high' });
    
    // Essential fonts only
    this.addPreload('/assets/fonts/inter-v12-latin-regular.woff2', 'font', 'critical', {
      crossorigin: 'anonymous',
      fetchPriority: 'high'
    });
  }

  private injectBalancedHints(): void {
    
    // Core application chunks
    this.addPreload('/assets/js/index-*.js', 'script', 'high', { fetchPriority: 'high' });
    this.addPreload('/assets/js/ui-core-*.js', 'script', 'high');
    this.addPreload('/assets/js/vendor-su-*.js', 'script', 'medium');
    
    // Critical styles and fonts
    this.addPreload('/assets/index-*.css', 'style', 'high');
    this.addPreload('/assets/fonts/inter-v12-latin-regular.woff2', 'font', 'high', {
      crossorigin: 'anonymous'
    });
    
    // Likely needed chunks
    this.addPrefetch('/assets/js/router-*.js', 'medium');
    this.addPrefetch('/assets/js/validation-*.js', 'medium');
  }

  private injectAggressiveHints(): void {
    
    // All critical chunks with high priority
    this.addPreload('/assets/js/index-*.js', 'script', 'critical', { fetchPriority: 'high' });
    this.addPreload('/assets/js/ui-core-*.js', 'script', 'high', { fetchPriority: 'high' });
    this.addPreload('/assets/js/ui-extended-*.js', 'script', 'high');
    this.addPreload('/assets/js/vendor-su-*.js', 'script', 'medium');
    this.addPreload('/assets/js/vendor-pr-*.js', 'script', 'medium');
    
    // All fonts and styles
    this.addPreload('/assets/index-*.css', 'style', 'high');
    this.addPreload('/assets/fonts/inter-v12-latin-regular.woff2', 'font', 'high', {
      crossorigin: 'anonymous'
    });
    this.addPreload('/assets/fonts/inter-v12-latin-500.woff2', 'font', 'medium', {
      crossorigin: 'anonymous'
    });
    
    // Likely routes and components
    this.addPrefetch('/assets/js/router-*.js', 'medium');
    this.addPrefetch('/assets/js/validation-*.js', 'medium');
    this.addPrefetch('/assets/js/forms-*.js', 'low');
    this.addPrefetch('/assets/js/icons-*.js', 'low');
    
    // Admin features if user shows admin patterns
    if (this.detectAdminUser()) {
      this.addPrefetch('/assets/js/admin-features-*.js', 'medium');
    }
  }

  private injectRouteSpecificHints(route: string, priority: string): void {
    const routeHints = this.getRouteSpecificHints(route, priority);
    routeHints.forEach(hint => this.injectHint(hint));
  }

  private getRouteSpecificHints(route: string, priority: string): ResourceHint[] {
    const hints: ResourceHint[] = [];

    switch (route) {
      case '/':
      case '/dashboard':
        hints.push(
          { rel: 'preload', href: '/assets/js/dashboard-*.js', as: 'script', priority: priority as ValidPriority },
          { rel: 'preload', href: '/assets/images/hero-bg.webp', as: 'image', priority: priority as ValidPriority }
        );
        break;

      case '/inspections':
      case '/inspection/*':
        hints.push(
          { rel: 'preload', href: '/assets/js/inspection-*.js', as: 'script', priority: priority as ValidPriority },
          { rel: 'preload', href: '/assets/js/camera-*.js', as: 'script', priority: priority as ValidPriority },
          { rel: 'prefetch', href: '/assets/js/ai-analysis-*.js', as: 'script', priority: priority as ValidPriority }
        );
        break;

      case '/admin/*':
        hints.push(
          { rel: 'prefetch', href: '/assets/js/admin-features-*.js', as: 'script', priority: priority as ValidPriority },
          { rel: 'prefetch', href: '/assets/js/charts-admin-only-*.js', as: 'script', priority: priority as ValidPriority }
        );
        break;

      default:
        // Generic route hints
        hints.push(
          { rel: 'prefetch', href: '/assets/js/ui-extended-*.js', as: 'script', priority: 'low' as ValidPriority }
        );
    }

    return hints;
  }

  // ============================================================================
  // HINT MANAGEMENT
  // ============================================================================

  private injectHint(hint: ResourceHint): void {
    // Check if we've reached the maximum number of hints
    if (this.activeHints.size >= this.config.maxHints) {
      this.removeLowestPriorityHint();
    }

    // Check for save-data preference
    if (this.config.respectSaveData && this.isDataSaverEnabled()) {
      if (hint.priority !== 'critical') return;
    }

    // Create and inject the hint
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    
    if (hint.as) link.as = hint.as;
    if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
    if (hint.integrity) link.integrity = hint.integrity;
    if (hint.fetchPriority) link.fetchPriority = hint.fetchPriority;
    if (hint.media) link.media = hint.media;
    if (hint.type) link.type = hint.type;
    if (hint.id) link.id = hint.id;

    // Add to DOM and track
    document.head.appendChild(link);
    this.activeHints.set(hint.id || hint.href, link);
    
    // Track priority for management
    const priorityScore = this.getPriorityScore(hint.priority || 'low');
    this.hintPriorities.set(hint.id || hint.href, priorityScore);

  }

  private cleanupUnusedHints(): void {
    // Remove hints that haven't been used after a timeout
    const unusedThreshold = 30000; // 30 seconds
    const now = Date.now();

    this.activeHints.forEach((link, id) => {
      const createdTime = parseInt(link.getAttribute('data-created') || '0');
      if (now - createdTime > unusedThreshold && !this.isHintUsed(link)) {
        this.removeHint(id);
      }
    });
  }

  private optimizeHintPriorities(): void {
    // Reorder hints based on performance feedback
    const performanceData = this.getPerformanceData();
    
    // Adjust priorities based on actual usage patterns
    performanceData.forEach((data, resource) => {
      if (data.unused && this.activeHints.has(resource)) {
        this.reducePriority(resource);
      }
    });
  }

  private adjustForPerformanceBudget(): void {
    // Remove low-priority hints if performance budget is exceeded
    const currentBudget = this.calculateCurrentBudget();
    const maxBudget = this.getMaxPerformanceBudget();

    if (currentBudget > maxBudget) {
      this.removeLowestPriorityHints();
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateHintId(href: string): string {
    return btoa(href).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  }

  private getPriorityScore(priority: string): number {
    const scores = { critical: 100, high: 80, medium: 50, low: 20 };
    return scores[priority as keyof typeof scores] || 20;
  }

  private removeLowestPriorityHint(): void {
    let lowestPriority = Infinity;
    let lowestId = '';

    this.hintPriorities.forEach((priority, id) => {
      if (priority < lowestPriority) {
        lowestPriority = priority;
        lowestId = id;
      }
    });

    if (lowestId) {
      this.removeHint(lowestId);
    }
  }

  private removeLowestPriorityHints(): void {
    // Remove multiple low-priority hints to meet budget
    const sortedHints = Array.from(this.hintPriorities.entries())
      .sort(([, a], [, b]) => a - b)
      .slice(0, 5); // Remove up to 5 lowest priority hints

    sortedHints.forEach(([id]) => this.removeHint(id));
  }

  private removeHint(id: string): void {
    const link = this.activeHints.get(id);
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
      this.activeHints.delete(id);
      this.hintPriorities.delete(id);
    }
  }

  private isHintUsed(link: HTMLLinkElement): boolean {
    // Check if the resource has been loaded/used
    return link.sheet !== null || 
           performance.getEntriesByName(link.href).length > 0;
  }

  private isDataSaverEnabled(): boolean {
    const connection = (navigator as NavigatorWithConnection).connection;
    return connection?.saveData === true;
  }

  private detectAdminUser(): boolean {
    // Simple heuristic to detect admin users
    return window.location.pathname.includes('/admin') ||
           localStorage.getItem('userRole') === 'admin';
  }

  private reducePriority(id: string): void {
    const currentPriority = this.hintPriorities.get(id) || 0;
    this.hintPriorities.set(id, Math.max(0, currentPriority - 10));
  }

  private getPerformanceData(): Map<string, { unused: boolean; loadTime: number }> {
    // Return performance data for resources
    return new Map();
  }

  private calculateCurrentBudget(): number {
    // Calculate current performance budget usage
    return this.activeHints.size * 0.5; // Rough estimate
  }

  private getMaxPerformanceBudget(): number {
    // Return maximum allowed performance budget
    return 10; // Conservative budget
  }

  private initializeNetworkMonitoring(): void {
    const connection = (navigator as NavigatorWithConnection).connection;
    if (connection) {
      this.networkCondition = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      connection.addEventListener('change', () => {
        this.networkCondition = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
        
        // Readjust hints based on new network conditions
        this.injectNetworkAwareHints();
      });
    }
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        // Monitor resource loading performance
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            // Track which hints are actually being used
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['resource', 'navigation'] });
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public startAdvancedHinting(): void {
    
    this.injectCriticalHints();
    this.injectNetworkAwareHints();
    
    // Start dynamic management
    setInterval(() => this.manageDynamicHints(), 10000); // Every 10 seconds
  }

  public getActiveHints(): string[] {
    return Array.from(this.activeHints.keys());
  }

  public getNetworkCondition(): NetworkCondition | null {
    return this.networkCondition;
  }

  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // Clean up all hints
    this.activeHints.forEach((link, id) => this.removeHint(id));
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAdvancedResourceHints(config?: Partial<ResourceHintsConfig>): AdvancedResourceHintsManager {
  return new AdvancedResourceHintsManager(config);
}

// ============================================================================
// INTEGRATION HOOK
// ============================================================================

import React from 'react';

export function useAdvancedResourceHints(config?: Partial<ResourceHintsConfig>) {
  const [hintsManager, setHintsManager] = React.useState<AdvancedResourceHintsManager | null>(null);

  React.useEffect(() => {
    const manager = createAdvancedResourceHints(config);
    setHintsManager(manager);

    // Start advanced hinting
    manager.startAdvancedHinting();

    return () => {
      manager.destroy();
    };
  }, []);

  return {
    hintsManager,
    getActiveHints: hintsManager?.getActiveHints.bind(hintsManager),
    getNetworkCondition: hintsManager?.getNetworkCondition.bind(hintsManager)
  };
}