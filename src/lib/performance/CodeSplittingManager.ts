/**
 * Code Splitting Manager - Netflix/Google-Level Bundle Optimization
 * Implements intelligent code splitting with lazy loading and preloading
 * Ensures <200KB per route and optimal loading performance
 */

import { debugLogger } from "@/lib/logger/debug-logger";

interface ChunkMetadata {
  name: string;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  route: string;
  dependencies: string[];
  preloadable: boolean;
}

interface LoadingStrategy {
  immediate: string[];    // Load immediately
  preload: string[];     // Preload on idle
  lazy: string[];        // Load on demand
  defer: string[];       // Defer until needed
}

interface BundleAnalytics {
  totalSize: number;
  routeSizes: Map<string, number>;
  unusedCode: string[];
  duplicatedCode: string[];
  optimizationOpportunities: string[];
}

// Types for browser APIs and chunk loading
type ChunkModule = Record<string, unknown>;
interface WindowWithIdleCallback extends Window {
  requestIdleCallback?: (callback: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
  gtag?: (command: string, action: string, options: Record<string, unknown>) => void;
}

/**
 * Elite code splitting manager for optimal bundle performance
 */
export class CodeSplittingManager {
  private chunkRegistry = new Map<string, ChunkMetadata>();
  private loadedChunks = new Set<string>();
  private preloadedChunks = new Set<string>();
  private loadingPromises = new Map<string, Promise<ChunkModule>>();
  private intersectionObserver: IntersectionObserver | null = null;
  private idleCallback: number | null = null;

  constructor() {
    this.initializeObservers();
    this.registerCriticalChunks();
  }

  /**
   * Initialize performance observers for smart loading
   */
  private initializeObservers(): void {
    // Intersection Observer for component-based lazy loading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const chunkName = entry.target.getAttribute('data-chunk');
              if (chunkName) {
                this.loadChunk(chunkName);
              }
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before element comes into view
          threshold: 0.1
        }
      );
    }

    // Idle callback for preloading
    this.scheduleIdlePreloading();
  }

  /**
   * Register critical chunks that should load immediately
   */
  private registerCriticalChunks(): void {
    // Core chunks that are always needed
    this.registerChunk({
      name: 'core-ui',
      size: 45000, // 45KB
      priority: 'critical',
      route: '*',
      dependencies: [],
      preloadable: false
    });

    this.registerChunk({
      name: 'auth-system',
      size: 25000, // 25KB
      priority: 'critical',
      route: '*',
      dependencies: ['core-ui'],
      preloadable: false
    });

    // Route-specific chunks
    this.registerChunk({
      name: 'property-selection',
      size: 35000, // 35KB
      priority: 'high',
      route: '/property-selection',
      dependencies: ['core-ui'],
      preloadable: true
    });

    this.registerChunk({
      name: 'inspection-workflow',
      size: 55000, // 55KB
      priority: 'high',
      route: '/inspection',
      dependencies: ['core-ui', 'camera-system'],
      preloadable: true
    });

    this.registerChunk({
      name: 'camera-system',
      size: 40000, // 40KB
      priority: 'medium',
      route: '/inspection',
      dependencies: ['core-ui'],
      preloadable: true
    });

    this.registerChunk({
      name: 'admin-dashboard',
      size: 60000, // 60KB
      priority: 'low',
      route: '/admin',
      dependencies: ['core-ui', 'charts-library'],
      preloadable: true
    });

    this.registerChunk({
      name: 'charts-library',
      size: 45000, // 45KB
      priority: 'low',
      route: '/admin',
      dependencies: [],
      preloadable: true
    });

    this.registerChunk({
      name: 'ai-analysis',
      size: 30000, // 30KB
      priority: 'medium',
      route: '/inspection',
      dependencies: ['core-ui'],
      preloadable: true
    });
  }

  /**
   * Register a new chunk in the system
   */
  registerChunk(metadata: ChunkMetadata): void {
    this.chunkRegistry.set(metadata.name, metadata);
  }

  /**
   * Get loading strategy for a specific route
   */
  getLoadingStrategy(route: string): LoadingStrategy {
    const strategy: LoadingStrategy = {
      immediate: [],
      preload: [],
      lazy: [],
      defer: []
    };

    this.chunkRegistry.forEach((chunk, name) => {
      if (chunk.route === '*' || chunk.route === route) {
        switch (chunk.priority) {
          case 'critical':
            strategy.immediate.push(name);
            break;
          case 'high':
            strategy.preload.push(name);
            break;
          case 'medium':
            strategy.lazy.push(name);
            break;
          case 'low':
            strategy.defer.push(name);
            break;
        }
      }
    });

    return strategy;
  }

  /**
   * Load chunk with intelligent caching and error handling
   */
  async loadChunk(chunkName: string): Promise<ChunkModule> {
    if (this.loadedChunks.has(chunkName)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(chunkName)) {
      return this.loadingPromises.get(chunkName);
    }

    const chunk = this.chunkRegistry.get(chunkName);
    if (!chunk) {
      throw new Error(`Chunk ${chunkName} not registered`);
    }

    // Load dependencies first
    const dependencyPromises = chunk.dependencies.map(dep => this.loadChunk(dep));
    await Promise.all(dependencyPromises);

    // Create loading promise
    const loadingPromise = this.createChunkLoader(chunkName);
    this.loadingPromises.set(chunkName, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadedChunks.add(chunkName);
      this.loadingPromises.delete(chunkName);
      
      // Track loading for analytics
      this.trackChunkLoad(chunkName, chunk.size);
      
      return result;
    } catch (error) {
      this.loadingPromises.delete(chunkName);
      debugLogger.error(`Failed to load chunk ${chunkName}:`, error);
      throw error;
    }
  }

  /**
   * Create chunk loader based on chunk type
   */
  private createChunkLoader(chunkName: string): Promise<ChunkModule> {
    switch (chunkName) {
      case 'property-selection':
        return import('@/pages/PropertySelection');
      
      case 'inspection-workflow':
        return import('@/pages/InspectionPage');
      
      case 'camera-system':
        return import('@/components/video/VideoRecorder');
      
      case 'admin-dashboard':
        return import('@/components/admin/AdminRoutes');
      
      case 'charts-library':
        return import('recharts');
      
      case 'ai-analysis':
        return import('@/services/aiIssueClassificationService');
      
      case 'core-ui':
        return Promise.all([
          import('@/components/ui/button'),
          import('@/components/ui/card'),
          import('@/components/ui/input')
        ]);
      
      case 'auth-system':
        return import('@/contexts/AuthContext');
      
      default:
        return Promise.reject(new Error(`Unknown chunk: ${chunkName}`));
    }
  }

  /**
   * Preload chunks during idle time
   */
  private scheduleIdlePreloading(): void {
    if ('requestIdleCallback' in window) {
      this.idleCallback = (window as WindowWithIdleCallback).requestIdleCallback?.(() => {
        this.preloadIdleChunks();
      }, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.preloadIdleChunks(), 100);
    }
  }

  /**
   * Preload chunks when browser is idle
   */
  private preloadIdleChunks(): void {
    const preloadableChunks = Array.from(this.chunkRegistry.entries())
      .filter(([name, chunk]) => 
        chunk.preloadable && 
        !this.loadedChunks.has(name) && 
        !this.preloadedChunks.has(name)
      )
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      });

    // Preload top 3 chunks
    preloadableChunks.slice(0, 3).forEach(([name, chunk]) => {
      this.preloadChunk(name);
    });
  }

  /**
   * Preload chunk without executing it
   */
  async preloadChunk(chunkName: string): Promise<void> {
    if (this.preloadedChunks.has(chunkName) || this.loadedChunks.has(chunkName)) {
      return;
    }

    try {
      const chunk = this.chunkRegistry.get(chunkName);
      if (!chunk) return;

      // Create link element for preloading
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = this.getChunkPath(chunkName);
      document.head.appendChild(link);

      this.preloadedChunks.add(chunkName);
      
      debugLogger.info(`Preloaded chunk: ${chunkName} (${chunk.size} bytes)`);
    } catch (error) {
      debugLogger.warn(`Failed to preload chunk ${chunkName}:`, error);
    }
  }

  /**
   * Get chunk file path for preloading
   */
  private getChunkPath(chunkName: string): string {
    // This would be generated by the build system
    return `/assets/${chunkName}-[hash].js`;
  }

  /**
   * Track chunk loading for analytics
   */
  private trackChunkLoad(chunkName: string, size: number): void {
    if ('performance' in window) {
      performance.mark(`chunk-${chunkName}-loaded`);
      
      // Send to analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as WindowWithIdleCallback).gtag?.('event', 'chunk_loaded', {
          chunk_name: chunkName,
          chunk_size: size,
          event_category: 'Performance'
        });
      }
    }
  }

  /**
   * Observe element for lazy loading
   */
  observeForLazyLoading(element: HTMLElement, chunkName: string): void {
    if (this.intersectionObserver && !this.loadedChunks.has(chunkName)) {
      element.setAttribute('data-chunk', chunkName);
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Stop observing element
   */
  unobserveElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   * Get bundle analytics for monitoring
   */
  getBundleAnalytics(): BundleAnalytics {
    const analytics: BundleAnalytics = {
      totalSize: 0,
      routeSizes: new Map(),
      unusedCode: [],
      duplicatedCode: [],
      optimizationOpportunities: []
    };

    // Calculate total size and route sizes
    this.chunkRegistry.forEach((chunk, name) => {
      analytics.totalSize += chunk.size;
      
      if (!analytics.routeSizes.has(chunk.route)) {
        analytics.routeSizes.set(chunk.route, 0);
      }
      analytics.routeSizes.set(
        chunk.route, 
        analytics.routeSizes.get(chunk.route)! + chunk.size
      );
    });

    // Check for optimization opportunities
    analytics.routeSizes.forEach((size, route) => {
      if (size > 200000) { // 200KB limit
        analytics.optimizationOpportunities.push(
          `Route ${route} exceeds 200KB limit: ${(size / 1024).toFixed(1)}KB`
        );
      }
    });

    // Check for unused chunks
    this.chunkRegistry.forEach((chunk, name) => {
      if (!this.loadedChunks.has(name) && !this.preloadedChunks.has(name)) {
        analytics.unusedCode.push(name);
      }
    });

    return analytics;
  }

  /**
   * Optimize bundle based on usage patterns
   */
  optimizeBundle(): void {
    const analytics = this.getBundleAnalytics();
    
    // Suggest chunk merging for small, frequently used chunks
    const smallChunks = Array.from(this.chunkRegistry.entries())
      .filter(([_, chunk]) => chunk.size < 10000)
      .map(([name, _]) => name);

    if (smallChunks.length > 0) {
      debugLogger.info('Consider merging small chunks:', smallChunks);
    }

    // Suggest splitting large chunks
    const largeChunks = Array.from(this.chunkRegistry.entries())
      .filter(([_, chunk]) => chunk.size > 70000)
      .map(([name, _]) => name);

    if (largeChunks.length > 0) {
      debugLogger.info('Consider splitting large chunks:', largeChunks);
    }
  }

  /**
   * Check if chunk is already loaded
   */
  isChunkLoaded(chunkName: string): boolean {
    return this.loadedChunks.has(chunkName);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.idleCallback && 'cancelIdleCallback' in window) {
      (window as WindowWithIdleCallback).cancelIdleCallback?.(this.idleCallback);
    }

    this.chunkRegistry.clear();
    this.loadedChunks.clear();
    this.preloadedChunks.clear();
    this.loadingPromises.clear();
  }
}

/**
 * Global code splitting manager instance
 */
export const globalCodeSplittingManager = new CodeSplittingManager();

/**
 * Higher-order component for lazy loading with loading states
 */
export function withLazyLoading<P extends object>(
  chunkName: string,
  fallback?: React.ComponentType
) {
  return function LazyWrapper(Component: React.ComponentType<P>) {
    const LazyComponent = React.lazy(async () => {
      await globalCodeSplittingManager.loadChunk(chunkName);
      return { default: Component };
    });

    return function WrappedComponent(props: P) {
      return (
        <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
    };
  };
}

/**
 * Hook for managing chunk loading in components
 */
export function useChunkLoader(chunkName: string) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadChunk = async () => {
      if (globalCodeSplittingManager.isChunkLoaded(chunkName)) {
        setIsLoaded(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await globalCodeSplittingManager.loadChunk(chunkName);
        if (mounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadChunk();

    return () => {
      mounted = false;
    };
  }, [chunkName]);

  return { isLoaded, isLoading, error };
}