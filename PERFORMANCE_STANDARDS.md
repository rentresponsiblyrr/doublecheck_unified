# ⚡ PERFORMANCE STANDARDS FOR STR CERTIFIED

*Comprehensive performance optimization guide for building lightning-fast, mobile-optimized applications*

## **🎯 PERFORMANCE PHILOSOPHY**

Performance is not just about speed—it's about creating exceptional user experiences. Our performance standards ensure:

- **Mobile-First Optimization** - Optimized for the slowest devices and connections
- **Perceived Performance** - Users feel the app is fast even during loading
- **Progressive Enhancement** - Core functionality works everywhere, enhanced features where supported
- **Sustainable Performance** - Performance doesn't degrade over time
- **Measurable Results** - Every optimization is backed by metrics

## **📊 PERFORMANCE TARGETS**

### **Core Web Vitals**
```typescript
// Target performance metrics
const PERFORMANCE_TARGETS = {
  // Largest Contentful Paint - when main content loads
  LCP: {
    excellent: 2500,  // 2.5 seconds
    good: 4000,       // 4 seconds
    poor: 4000        // > 4 seconds
  },
  
  // First Input Delay - responsiveness to user input
  FID: {
    excellent: 100,   // 100ms
    good: 300,        // 300ms
    poor: 300         // > 300ms
  },
  
  // Cumulative Layout Shift - visual stability
  CLS: {
    excellent: 0.1,   // 0.1
    good: 0.25,       // 0.25
    poor: 0.25        // > 0.25
  },
  
  // Additional metrics
  TTFB: 800,          // Time to First Byte
  FCP: 1800,          // First Contentful Paint
  TTI: 5000,          // Time to Interactive
  TBT: 200,           // Total Blocking Time
  
  // Bundle size targets
  INITIAL_BUNDLE: 200 * 1024,      // 200KB initial bundle
  ROUTE_BUNDLE: 50 * 1024,         // 50KB per route
  COMPONENT_BUNDLE: 10 * 1024,     // 10KB per component
  
  // Runtime performance
  FRAME_RATE: 60,                  // 60 FPS
  FRAME_TIME: 16.67,               // 16.67ms per frame
  MEMORY_USAGE: 50 * 1024 * 1024,  // 50MB max memory
  
  // Network performance
  API_RESPONSE_TIME: 500,          // 500ms API response
  IMAGE_LOAD_TIME: 2000,           // 2s image load
  OFFLINE_CACHE_SIZE: 5 * 1024 * 1024 // 5MB cache
};
```

### **Mobile Performance Standards**
```typescript
// Mobile-specific performance requirements
const MOBILE_PERFORMANCE = {
  // Device capabilities
  MIN_SUPPORTED_DEVICE: {
    cpu: 'ARM Cortex-A53',
    memory: 1024 * 1024 * 1024,  // 1GB RAM
    storage: 100 * 1024 * 1024,  // 100MB available
    network: '3G'                 // 3G network minimum
  },
  
  // Touch responsiveness
  TOUCH_RESPONSE: 16,             // 16ms touch response
  SCROLL_PERFORMANCE: 60,         // 60 FPS scrolling
  ANIMATION_PERFORMANCE: 60,      // 60 FPS animations
  
  // Battery optimization
  MAX_CPU_USAGE: 30,              // 30% average CPU
  BACKGROUND_ACTIVITY: 5,         // 5% CPU when backgrounded
  
  // Network efficiency
  OFFLINE_CAPABILITY: true,       // Must work offline
  DATA_USAGE_LIMIT: 10 * 1024 * 1024, // 10MB per session
  IMAGE_COMPRESSION: 80,          // 80% compression ratio
  
  // Storage efficiency
  LOCAL_STORAGE_LIMIT: 5 * 1024 * 1024,  // 5MB local storage
  CACHE_EFFICIENCY: 90,           // 90% cache hit rate
  SYNC_FREQUENCY: 30000           // 30s sync interval
};
```

## **🚀 FRONTEND PERFORMANCE OPTIMIZATION**

### **Bundle Optimization**

```typescript
/**
 * Webpack/Vite optimization configuration
 */
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { Bundle } from 'webpack-bundle-analyzer';

export default defineConfig({
  build: {
    // Bundle optimization
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn']
      },
      mangle: {
        safari10: true
      }
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-utils': ['lodash-es', 'date-fns'],
          
          // Feature chunks
          'feature-inspection': [
            './src/domains/inspection/components/index.ts',
            './src/domains/inspection/hooks/index.ts'
          ],
          'feature-audit': [
            './src/domains/audit/components/index.ts',
            './src/domains/audit/hooks/index.ts'
          ],
          'feature-property': [
            './src/domains/property/components/index.ts',
            './src/domains/property/hooks/index.ts'
          ]
        }
      }
    },
    
    // Compression
    assetsInlineLimit: 4096, // 4KB inline limit
    chunkSizeWarningLimit: 500, // 500KB chunk warning
    
    // Source maps (production)
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true
  },
  
  // Development optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'lodash-es'],
    exclude: ['@supabase/supabase-js']
  },
  
  // Plugin configuration
  plugins: [
    // Bundle analyzer
    process.env.ANALYZE && Bundle({
      analyzerMode: 'static',
      openAnalyzer: false,
      generateStatsFile: true
    }),
    
    // Preload critical resources
    {
      name: 'preload-critical',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>
            <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
            <link rel="preload" href="/api/me" as="fetch" crossorigin>
            <link rel="dns-prefetch" href="https://api.doublecheckverified.com">
          `
        );
      }
    }
  ]
});
```

### **React Performance Optimization**

```typescript
/**
 * React component optimization patterns
 */
import { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// 1. Component Memoization
const OptimizedInspectionCard = memo<InspectionCardProps>(({ 
  inspection, 
  onEdit, 
  onDelete 
}) => {
  // Memoize expensive calculations
  const statusColor = useMemo(() => {
    return getStatusColor(inspection.status);
  }, [inspection.status]);
  
  const completionPercentage = useMemo(() => {
    return calculateCompletionPercentage(inspection.checklistItems);
  }, [inspection.checklistItems]);
  
  // Memoize event handlers
  const handleEdit = useCallback(() => {
    onEdit(inspection.id);
  }, [onEdit, inspection.id]);
  
  const handleDelete = useCallback(() => {
    onDelete(inspection.id);
  }, [onDelete, inspection.id]);
  
  return (
    <Card className="inspection-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{inspection.property.name}</CardTitle>
          <Badge variant={statusColor}>{inspection.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600">
          {inspection.checklistItems.length} items • {completionPercentage}% complete
        </div>
      </CardContent>
      <CardActions>
        <Button variant="outline" onClick={handleEdit}>Edit</Button>
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
      </CardActions>
    </Card>
  );
});

// 2. Virtualized Lists
const VirtualizedInspectionList: React.FC<{ 
  inspections: Inspection[] 
}> = ({ inspections }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: inspections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 5 // Render 5 items outside viewport
  });
  
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <OptimizedInspectionCard 
              inspection={inspections[virtualRow.index]}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Lazy Loading with Suspense
const LazyInspectionDetails = lazy(() => 
  import('./InspectionDetails').then(module => ({
    default: module.InspectionDetails
  }))
);

const LazyAuditDashboard = lazy(() => 
  import('./AuditDashboard').then(module => ({
    default: module.AuditDashboard
  }))
);

const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/inspections" element={
      <Suspense fallback={<InspectionDetailsSkeleton />}>
        <LazyInspectionDetails />
      </Suspense>
    } />
    <Route path="/audit" element={
      <Suspense fallback={<AuditDashboardSkeleton />}>
        <LazyAuditDashboard />
      </Suspense>
    } />
  </Routes>
);

// 4. Optimized Image Loading
const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}> = ({ src, alt, width, height, priority = false }) => {
  const [imageSrc, setImageSrc] = useState<string>();
  const [imageRef, isIntersecting] = useIntersection({
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  // Generate responsive image sources
  const srcSet = useMemo(() => {
    return [
      `${src}?w=${width}&h=${height}&q=75 1x`,
      `${src}?w=${width * 2}&h=${height * 2}&q=75 2x`
    ].join(', ');
  }, [src, width, height]);
  
  // Load image when in viewport or priority
  useEffect(() => {
    if (priority || isIntersecting) {
      setImageSrc(src);
    }
  }, [src, priority, isIntersecting]);
  
  return (
    <div
      ref={imageRef}
      style={{ width, height }}
      className="bg-gray-200 rounded overflow-hidden"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          srcSet={srcSet}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover"
          onLoad={() => {
            // Track image load performance
            performance.mark('image-loaded');
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImagePlaceholder />
        </div>
      )}
    </div>
  );
};
```

### **State Management Performance**

```typescript
/**
 * Optimized state management with Zustand
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Optimized store with selective subscriptions
interface AppState {
  inspections: {
    items: Inspection[];
    loading: boolean;
    error: string | null;
    lastFetch: number;
  };
  
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    activeModal: string | null;
    notifications: Notification[];
  };
  
  user: {
    profile: User | null;
    permissions: Permission[];
    preferences: UserPreferences;
  };
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      inspections: {
        items: [],
        loading: false,
        error: null,
        lastFetch: 0
      },
      
      ui: {
        theme: 'light',
        sidebarOpen: false,
        activeModal: null,
        notifications: []
      },
      
      user: {
        profile: null,
        permissions: [],
        preferences: {}
      },
      
      // Optimized actions
      actions: {
        // Batch inspection updates
        setInspections: (inspections: Inspection[]) => {
          set((state) => {
            state.inspections.items = inspections;
            state.inspections.loading = false;
            state.inspections.error = null;
            state.inspections.lastFetch = Date.now();
          });
        },
        
        // Update single inspection without re-rendering entire list
        updateInspection: (id: string, updates: Partial<Inspection>) => {
          set((state) => {
            const index = state.inspections.items.findIndex(item => item.id === id);
            if (index !== -1) {
              Object.assign(state.inspections.items[index], updates);
            }
          });
        },
        
        // Optimized UI updates
        setTheme: (theme: 'light' | 'dark') => {
          set((state) => {
            state.ui.theme = theme;
          });
        },
        
        toggleSidebar: () => {
          set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          });
        }
      }
    }))
  )
);

// Selective hooks to prevent unnecessary re-renders
export const useInspections = () => useAppStore(state => state.inspections);
export const useInspectionItems = () => useAppStore(state => state.inspections.items);
export const useInspectionLoading = () => useAppStore(state => state.inspections.loading);
export const useUIState = () => useAppStore(state => state.ui);
export const useTheme = () => useAppStore(state => state.ui.theme);
export const useUser = () => useAppStore(state => state.user);

// Performance monitoring for state updates
export const usePerformanceMonitor = () => {
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state) => state.inspections.items,
      (items, prevItems) => {
        if (items !== prevItems) {
          performance.mark('inspections-updated');
          console.log('Inspections updated:', items.length);
        }
      }
    );
    
    return unsubscribe;
  }, []);
};
```

## **🌐 NETWORK PERFORMANCE OPTIMIZATION**

### **API Optimization**

```typescript
/**
 * Optimized API service with caching and request batching
 */
import { QueryClient, useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';

class OptimizedAPIService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<any>>();
  private batchQueue = new Map<string, Array<{ resolve: Function; reject: Function; data: any }>>();
  
  constructor() {
    // Batch API requests every 16ms (one frame)
    setInterval(() => {
      this.processBatchQueue();
    }, 16);
  }
  
  /**
   * Optimized fetch with caching and deduplication
   */
  async fetch<T>(
    url: string, 
    options: RequestInit = {},
    cacheConfig: { ttl?: number; force?: boolean } = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, force = false } = cacheConfig;
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (!force) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }
    
    // Deduplicate identical requests
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }
    
    const requestPromise = this.makeRequest<T>(url, options);
    this.requestQueue.set(cacheKey, requestPromise);
    
    try {
      const data = await requestPromise;
      
      // Cache successful responses
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }
  
  /**
   * Batch multiple API requests
   */
  batchRequest<T>(
    endpoint: string,
    data: any,
    timeout: number = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(endpoint)) {
        this.batchQueue.set(endpoint, []);
        
        // Process batch after timeout
        setTimeout(() => {
          this.processBatch(endpoint);
        }, timeout);
      }
      
      this.batchQueue.get(endpoint)!.push({ resolve, reject, data });
    });
  }
  
  /**
   * Infinite query for pagination
   */
  useInfiniteInspections(filters: InspectionFilters = {}) {
    return useInfiniteQuery({
      queryKey: ['inspections', 'infinite', filters],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await this.fetch<{
          items: Inspection[];
          nextPage: number | null;
          hasMore: boolean;
        }>(`/api/inspections?page=${pageParam}&limit=20`, {
          method: 'POST',
          body: JSON.stringify(filters)
        });
        
        return response;
      },
      getNextPageParam: (lastPage) => lastPage.nextPage,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    });
  }
  
  /**
   * Optimized mutation with optimistic updates
   */
  useOptimisticInspectionUpdate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (data: { id: string; updates: Partial<Inspection> }) => {
        return await this.fetch(`/api/inspections/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data.updates)
        });
      },
      
      onMutate: async (data) => {
        // Cancel outgoing queries
        await queryClient.cancelQueries({ queryKey: ['inspections'] });
        
        // Snapshot previous value
        const previousInspections = queryClient.getQueryData(['inspections']);
        
        // Optimistically update
        queryClient.setQueryData(['inspections'], (old: any) => {
          return old?.map((inspection: Inspection) =>
            inspection.id === data.id
              ? { ...inspection, ...data.updates }
              : inspection
          );
        });
        
        return { previousInspections };
      },
      
      onError: (err, data, context) => {
        // Rollback on error
        queryClient.setQueryData(['inspections'], context?.previousInspections);
      },
      
      onSettled: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['inspections'] });
      }
    });
  }
  
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log performance metrics
      const endTime = performance.now();
      performance.measure('api-request', {
        start: startTime,
        end: endTime,
        detail: { url, method: options.method || 'GET' }
      });
      
      return data;
    } catch (error) {
      const endTime = performance.now();
      performance.measure('api-request-error', {
        start: startTime,
        end: endTime,
        detail: { url, error: error.message }
      });
      
      throw error;
    }
  }
  
  private async processBatch(endpoint: string) {
    const batch = this.batchQueue.get(endpoint);
    if (!batch || batch.length === 0) return;
    
    this.batchQueue.delete(endpoint);
    
    try {
      const batchData = batch.map(item => item.data);
      const results = await this.fetch(`/api/batch/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(batchData)
      });
      
      // Resolve individual promises
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
  
  private processBatchQueue() {
    for (const [endpoint, batch] of this.batchQueue.entries()) {
      if (batch.length > 0) {
        this.processBatch(endpoint);
      }
    }
  }
}
```

### **Image Optimization**

```typescript
/**
 * Advanced image optimization service
 */
class ImageOptimizationService {
  private imageCache = new Map<string, HTMLImageElement>();
  private observer: IntersectionObserver;
  
  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: 0.1, rootMargin: '50px' }
    );
  }
  
  /**
   * Responsive image component with optimization
   */
  createResponsiveImage(config: {
    src: string;
    alt: string;
    width: number;
    height: number;
    quality?: number;
    formats?: string[];
    sizes?: string;
    priority?: boolean;
  }) {
    const {
      src,
      alt,
      width,
      height,
      quality = 75,
      formats = ['webp', 'jpeg'],
      sizes = '100vw',
      priority = false
    } = config;
    
    // Generate optimized sources
    const sources = formats.map(format => ({
      srcSet: this.generateSrcSet(src, format, quality, width, height),
      type: `image/${format}`
    }));
    
    return {
      sources,
      fallback: {
        src: this.generateImageUrl(src, 'jpeg', quality, width, height),
        alt,
        width,
        height,
        sizes,
        loading: priority ? 'eager' : 'lazy',
        decoding: 'async'
      }
    };
  }
  
  /**
   * Preload critical images
   */
  preloadCriticalImages(images: Array<{ src: string; type: string }>) {
    images.forEach(({ src, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.type = type;
      document.head.appendChild(link);
    });
  }
  
  /**
   * Progressive image loading
   */
  loadProgressiveImage(
    container: HTMLElement,
    src: string,
    placeholder: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load low-quality placeholder first
      const placeholderImg = new Image();
      placeholderImg.src = placeholder;
      placeholderImg.onload = () => {
        container.style.backgroundImage = `url(${placeholder})`;
        container.style.filter = 'blur(5px)';
        
        // Then load full-quality image
        const fullImg = new Image();
        fullImg.src = src;
        fullImg.onload = () => {
          container.style.backgroundImage = `url(${src})`;
          container.style.filter = 'none';
          resolve();
        };
        fullImg.onerror = reject;
      };
      placeholderImg.onerror = reject;
    });
  }
  
  /**
   * Image compression for uploads
   */
  async compressImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: string;
    } = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  
  private generateSrcSet(
    src: string,
    format: string,
    quality: number,
    width: number,
    height: number
  ): string {
    const densities = [1, 1.5, 2, 3];
    
    return densities
      .map(density => {
        const scaledWidth = Math.round(width * density);
        const scaledHeight = Math.round(height * density);
        const url = this.generateImageUrl(src, format, quality, scaledWidth, scaledHeight);
        return `${url} ${density}x`;
      })
      .join(', ');
  }
  
  private generateImageUrl(
    src: string,
    format: string,
    quality: number,
    width: number,
    height: number
  ): string {
    const params = new URLSearchParams({
      w: width.toString(),
      h: height.toString(),
      q: quality.toString(),
      f: format
    });
    
    return `${src}?${params.toString()}`;
  }
  
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }
  
  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const dataSrc = img.dataset.src;
        
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
          this.observer.unobserve(img);
        }
      }
    });
  }
}
```

## **📱 MOBILE PERFORMANCE OPTIMIZATION**

### **Touch and Gesture Optimization**

```typescript
/**
 * Optimized touch and gesture handling
 */
class MobilePerformanceOptimizer {
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private isScrolling: boolean = false;
  private scrollTimeout: number | null = null;
  
  /**
   * Optimized touch event handling
   */
  optimizeTouchEvents(element: HTMLElement) {
    // Use passive listeners for better scroll performance
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // Prevent 300ms click delay
    element.addEventListener('touchstart', (e) => {
      this.touchStartTime = Date.now();
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - this.touchStartTime;
      
      if (touchDuration < 150) { // Fast tap
        const touchEndPos = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        };
        
        const distance = Math.sqrt(
          Math.pow(touchEndPos.x - this.touchStartPos.x, 2) +
          Math.pow(touchEndPos.y - this.touchStartPos.y, 2)
        );
        
        if (distance < 10) { // Minimal movement
          // Trigger immediate click
          element.click();
          e.preventDefault();
        }
      }
    }, { passive: false });
  }
  
  /**
   * Optimized scrolling with momentum
   */
  optimizeScrolling(container: HTMLElement) {
    let isScrolling = false;
    let scrollTimeout: number;
    
    const handleScrollStart = () => {
      if (!isScrolling) {
        isScrolling = true;
        container.style.pointerEvents = 'none'; // Disable pointer events during scroll
        document.body.classList.add('scrolling');
      }
    };
    
    const handleScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
        container.style.pointerEvents = 'auto';
        document.body.classList.remove('scrolling');
      }, 150);
    };
    
    container.addEventListener('scroll', () => {
      handleScrollStart();
      handleScrollEnd();
    }, { passive: true });
    
    // Optimize scroll performance with CSS
    container.style.overflowY = 'auto';
    container.style.webkitOverflowScrolling = 'touch';
    container.style.transform = 'translateZ(0)'; // Enable hardware acceleration
  }
  
  /**
   * Optimized animations for mobile
   */
  createOptimizedAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {}
  ): Animation {
    // Use transform and opacity for better performance
    const optimizedKeyframes = keyframes.map(keyframe => ({
      ...keyframe,
      transform: keyframe.transform || 'translateZ(0)', // Force hardware acceleration
      willChange: 'transform, opacity' // Hint to browser for optimization
    }));
    
    const animation = element.animate(optimizedKeyframes, {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'both',
      ...options
    });
    
    // Clean up will-change after animation
    animation.addEventListener('finish', () => {
      element.style.willChange = 'auto';
    });
    
    return animation;
  }
  
  private handleTouchStart(e: TouchEvent) {
    this.isScrolling = false;
    
    // Clear any existing scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    if (!this.isScrolling) {
      this.isScrolling = true;
      
      // Optimize rendering during scroll
      document.body.classList.add('touch-scrolling');
    }
    
    // Prevent default for horizontal scroll to avoid bounce
    if (Math.abs(e.touches[0].clientX - this.touchStartPos.x) > 
        Math.abs(e.touches[0].clientY - this.touchStartPos.y)) {
      e.preventDefault();
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    // Debounce scroll end
    this.scrollTimeout = window.setTimeout(() => {
      this.isScrolling = false;
      document.body.classList.remove('touch-scrolling');
    }, 150);
  }
}
```

### **PWA Performance Optimization**

```typescript
/**
 * Progressive Web App performance optimization
 */
class PWAPerformanceService {
  private cache: Cache | null = null;
  private syncQueue: Array<{ url: string; data: any; timestamp: number }> = [];
  
  async initializePWA() {
    // Initialize service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate(registration);
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    
    // Initialize cache
    this.cache = await caches.open('str-certified-v1');
    
    // Preload critical resources
    await this.preloadCriticalResources();
    
    // Set up background sync
    this.setupBackgroundSync();
    
    // Optimize for offline
    this.setupOfflineSupport();
  }
  
  /**
   * Cache strategies for different resource types
   */
  async setupCacheStrategies() {
    const strategies = {
      // App shell - cache first
      appShell: {
        pattern: /\/(index\.html|static\/)/,
        strategy: 'cache-first',
        maxAge: 86400000 // 24 hours
      },
      
      // API responses - network first with cache fallback
      api: {
        pattern: /\/api\//,
        strategy: 'network-first',
        maxAge: 300000 // 5 minutes
      },
      
      // Images - cache first with network fallback
      images: {
        pattern: /\.(jpg|jpeg|png|gif|webp)$/,
        strategy: 'cache-first',
        maxAge: 604800000 // 7 days
      },
      
      // User data - network first
      userData: {
        pattern: /\/(inspections|properties|users)/,
        strategy: 'network-first',
        maxAge: 60000 // 1 minute
      }
    };
    
    return strategies;
  }
  
  /**
   * Intelligent preloading based on user behavior
   */
  async intelligentPreloading() {
    // Analyze user navigation patterns
    const navigationHistory = this.getNavigationHistory();
    const predictedRoutes = this.predictNextRoutes(navigationHistory);
    
    // Preload predicted routes
    for (const route of predictedRoutes) {
      await this.preloadRoute(route);
    }
    
    // Preload based on current context
    const currentPath = window.location.pathname;
    if (currentPath.includes('/inspections')) {
      await this.preloadInspectionAssets();
    } else if (currentPath.includes('/audit')) {
      await this.preloadAuditAssets();
    }
  }
  
  /**
   * Background sync for offline actions
   */
  setupBackgroundSync() {
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('background-sync');
      });
    }
    
    // Handle online/offline events
    window.addEventListener('online', () => {
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.handleOfflineMode();
    });
  }
  
  /**
   * Queue actions for background sync
   */
  queueAction(action: { url: string; data: any; method: string }) {
    this.syncQueue.push({
      ...action,
      timestamp: Date.now()
    });
    
    // Store in IndexedDB for persistence
    this.persistSyncQueue();
  }
  
  /**
   * Process sync queue when online
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    const results = await Promise.allSettled(
      this.syncQueue.map(async (action) => {
        try {
          const response = await fetch(action.url, {
            method: action.data.method || 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(action.data)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          return response.json();
        } catch (error) {
          // Keep failed actions in queue for retry
          if (Date.now() - action.timestamp < 86400000) { // 24 hours
            throw error;
          }
          return null; // Remove old actions
        }
      })
    );
    
    // Remove successful actions from queue
    this.syncQueue = this.syncQueue.filter((_, index) => {
      return results[index].status === 'rejected';
    });
    
    // Update persisted queue
    this.persistSyncQueue();
  }
  
  /**
   * Offline support with graceful degradation
   */
  setupOfflineSupport() {
    // Cache critical API responses
    const criticalEndpoints = [
      '/api/me',
      '/api/inspections',
      '/api/properties'
    ];
    
    criticalEndpoints.forEach(endpoint => {
      this.cacheAPIResponse(endpoint);
    });
    
    // Handle offline UI
    this.setupOfflineUI();
  }
  
  private async preloadCriticalResources() {
    const criticalResources = [
      '/',
      '/static/css/main.css',
      '/static/js/main.js',
      '/fonts/inter.woff2',
      '/api/me'
    ];
    
    const preloadPromises = criticalResources.map(async (resource) => {
      try {
        const response = await fetch(resource);
        if (response.ok) {
          await this.cache!.put(resource, response.clone());
        }
      } catch (error) {
        console.warn(`Failed to preload ${resource}:`, error);
      }
    });
    
    await Promise.all(preloadPromises);
  }
  
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Show update available notification
          this.showUpdateNotification();
        }
      });
    }
  }
  
  private showUpdateNotification() {
    // Show user-friendly update notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <p>A new version is available!</p>
      <button onclick="window.location.reload()">Update</button>
    `;
    document.body.appendChild(notification);
  }
  
  private getNavigationHistory(): string[] {
    const history = localStorage.getItem('navigation-history');
    return history ? JSON.parse(history) : [];
  }
  
  private predictNextRoutes(history: string[]): string[] {
    // Simple prediction based on common patterns
    const patterns = {
      '/inspections': ['/inspections/new', '/properties'],
      '/audit': ['/inspections', '/reports'],
      '/properties': ['/inspections/new', '/properties/new']
    };
    
    const currentPath = window.location.pathname;
    return patterns[currentPath] || [];
  }
  
  private async preloadRoute(route: string) {
    try {
      const response = await fetch(route);
      if (response.ok) {
        await this.cache!.put(route, response.clone());
      }
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    }
  }
  
  private async preloadInspectionAssets() {
    const assets = [
      '/static/js/inspection-module.js',
      '/static/css/inspection-styles.css',
      '/api/inspections?limit=10'
    ];
    
    for (const asset of assets) {
      await this.preloadRoute(asset);
    }
  }
  
  private async preloadAuditAssets() {
    const assets = [
      '/static/js/audit-module.js',
      '/static/css/audit-styles.css',
      '/api/audits?limit=10'
    ];
    
    for (const asset of assets) {
      await this.preloadRoute(asset);
    }
  }
  
  private async persistSyncQueue() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      await store.clear();
      for (const action of this.syncQueue) {
        await store.add(action);
      }
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('str-certified-db', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
  
  private async cacheAPIResponse(endpoint: string) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        await this.cache!.put(endpoint, response.clone());
      }
    } catch (error) {
      console.warn(`Failed to cache API response for ${endpoint}:`, error);
    }
  }
  
  private setupOfflineUI() {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.className = 'offline-indicator hidden';
    offlineIndicator.textContent = 'You are offline. Changes will sync when connection is restored.';
    document.body.appendChild(offlineIndicator);
    
    window.addEventListener('offline', () => {
      offlineIndicator.classList.remove('hidden');
    });
    
    window.addEventListener('online', () => {
      offlineIndicator.classList.add('hidden');
    });
  }
  
  private handleOfflineMode() {
    // Disable non-essential features
    document.body.classList.add('offline-mode');
    
    // Show offline UI
    const offlineElements = document.querySelectorAll('.offline-only');
    offlineElements.forEach(el => el.classList.remove('hidden'));
    
    // Hide online-only elements
    const onlineElements = document.querySelectorAll('.online-only');
    onlineElements.forEach(el => el.classList.add('hidden'));
  }
}
```

## **📊 PERFORMANCE MONITORING**

### **Real-time Performance Monitoring**

```typescript
/**
 * Comprehensive performance monitoring system
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observer: PerformanceObserver | null = null;
  private vitalsObserver: PerformanceObserver | null = null;
  
  constructor() {
    this.initializeObservers();
    this.startContinuousMonitoring();
  }
  
  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      this.vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processVitalMetric(entry);
        }
      });
      
      this.vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      
      // Navigation and resource timing
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });
      
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'paint'] });
    }
  }
  
  /**
   * Process Core Web Vitals metrics
   */
  private processVitalMetric(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.startTime,
      timestamp: Date.now(),
      type: 'vital'
    };
    
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        metric.name = 'LCP';
        metric.value = entry.startTime;
        metric.threshold = PERFORMANCE_TARGETS.LCP.excellent;
        break;
        
      case 'first-input':
        metric.name = 'FID';
        metric.value = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        metric.threshold = PERFORMANCE_TARGETS.FID.excellent;
        break;
        
      case 'layout-shift':
        if (!(entry as LayoutShift).hadRecentInput) {
          const clsValue = this.metrics.get('CLS')?.value || 0;
          metric.name = 'CLS';
          metric.value = clsValue + (entry as LayoutShift).value;
          metric.threshold = PERFORMANCE_TARGETS.CLS.excellent;
        }
        break;
    }
    
    this.metrics.set(metric.name, metric);
    this.reportMetric(metric);
  }
  
  /**
   * Process performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationTiming(entry as PerformanceNavigationTiming);
        break;
        
      case 'resource':
        this.processResourceTiming(entry as PerformanceResourceTiming);
        break;
        
      case 'paint':
        this.processPaintTiming(entry);
        break;
        
      case 'measure':
        this.processMeasure(entry);
        break;
    }
  }
  
  /**
   * Monitor bundle size and loading performance
   */
  monitorBundlePerformance() {
    const bundleMetrics = {
      initialBundle: 0,
      chunkSizes: new Map<string, number>(),
      loadTimes: new Map<string, number>()
    };
    
    // Monitor script loading
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script, index) => {
      const src = script.getAttribute('src');
      if (src) {
        const startTime = performance.now();
        
        script.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          bundleMetrics.loadTimes.set(src, loadTime);
          
          // Fetch resource size
          fetch(src, { method: 'HEAD' })
            .then(response => {
              const size = parseInt(response.headers.get('content-length') || '0');
              bundleMetrics.chunkSizes.set(src, size);
              
              if (index === 0) {
                bundleMetrics.initialBundle = size;
              }
              
              this.reportBundleMetric(src, size, loadTime);
            })
            .catch(error => {
              console.warn(`Failed to get size for ${src}:`, error);
            });
        });
      }
    });
    
    return bundleMetrics;
  }
  
  /**
   * Monitor React component performance
   */
  monitorComponentPerformance() {
    if (process.env.NODE_ENV === 'development') {
      // React DevTools Profiler
      const ProfilerComponent = ({ id, children, phase, actualDuration, baseDuration, startTime, commitTime }) => {
        const metric: PerformanceMetric = {
          name: `component-${id}`,
          value: actualDuration,
          timestamp: Date.now(),
          type: 'component',
          metadata: {
            phase,
            baseDuration,
            startTime,
            commitTime
          }
        };
        
        this.metrics.set(metric.name, metric);
        
        // Alert on slow components
        if (actualDuration > 16) { // > 1 frame
          console.warn(`Slow component ${id}: ${actualDuration}ms`);
        }
        
        return children;
      };
      
      return ProfilerComponent;
    }
    
    return null;
  }
  
  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      
      const memoryMetric: PerformanceMetric = {
        name: 'memory-usage',
        value: memoryInfo.usedJSHeapSize,
        timestamp: Date.now(),
        type: 'memory',
        metadata: {
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          usagePercentage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        }
      };
      
      this.metrics.set('memory-usage', memoryMetric);
      
      // Alert on high memory usage
      if (memoryMetric.metadata.usagePercentage > 80) {
        console.warn('High memory usage detected:', memoryMetric.metadata.usagePercentage + '%');
      }
    }
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      vitals: {
        LCP: this.metrics.get('LCP')?.value || 0,
        FID: this.metrics.get('FID')?.value || 0,
        CLS: this.metrics.get('CLS')?.value || 0,
        TTFB: this.metrics.get('TTFB')?.value || 0,
        FCP: this.metrics.get('FCP')?.value || 0
      },
      resources: Array.from(this.metrics.values()).filter(m => m.type === 'resource'),
      components: Array.from(this.metrics.values()).filter(m => m.type === 'component'),
      memory: this.metrics.get('memory-usage')?.metadata || {},
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
  
  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const lcp = this.metrics.get('LCP')?.value || 0;
    if (lcp > PERFORMANCE_TARGETS.LCP.excellent) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and improving server response times');
    }
    
    const fid = this.metrics.get('FID')?.value || 0;
    if (fid > PERFORMANCE_TARGETS.FID.excellent) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution and reducing main thread blocking');
    }
    
    const cls = this.metrics.get('CLS')?.value || 0;
    if (cls > PERFORMANCE_TARGETS.CLS.excellent) {
      recommendations.push('Improve Cumulative Layout Shift by setting dimensions on images and avoiding content shifts');
    }
    
    const memoryUsage = this.metrics.get('memory-usage')?.metadata?.usagePercentage || 0;
    if (memoryUsage > 70) {
      recommendations.push('Reduce memory usage by optimizing component re-renders and cleaning up event listeners');
    }
    
    return recommendations;
  }
  
  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.monitorMemoryUsage();
      this.checkPerformanceThresholds();
    }, 30000);
    
    // Monitor on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.monitorMemoryUsage();
      }
    });
  }
  
  private checkPerformanceThresholds() {
    const lcp = this.metrics.get('LCP')?.value || 0;
    const fid = this.metrics.get('FID')?.value || 0;
    const cls = this.metrics.get('CLS')?.value || 0;
    
    if (lcp > PERFORMANCE_TARGETS.LCP.poor ||
        fid > PERFORMANCE_TARGETS.FID.poor ||
        cls > PERFORMANCE_TARGETS.CLS.poor) {
      
      // Send alert to monitoring service
      this.sendPerformanceAlert({
        type: 'performance_degradation',
        metrics: { lcp, fid, cls },
        timestamp: Date.now()
      });
    }
  }
  
  private processNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      TTFB: entry.responseStart - entry.requestStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart
    };
    
    Object.entries(metrics).forEach(([name, value]) => {
      this.metrics.set(name, {
        name,
        value,
        timestamp: Date.now(),
        type: 'navigation'
      });
    });
  }
  
  private processResourceTiming(entry: PerformanceResourceTiming) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration,
      timestamp: Date.now(),
      type: 'resource',
      metadata: {
        size: entry.transferSize,
        type: entry.initiatorType
      }
    };
    
    this.metrics.set(entry.name, metric);
  }
  
  private processPaintTiming(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.startTime,
      timestamp: Date.now(),
      type: 'paint'
    };
    
    if (entry.name === 'first-contentful-paint') {
      metric.threshold = PERFORMANCE_TARGETS.FCP;
    }
    
    this.metrics.set(entry.name, metric);
  }
  
  private processMeasure(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration,
      timestamp: Date.now(),
      type: 'measure'
    };
    
    this.metrics.set(entry.name, metric);
  }
  
  private reportMetric(metric: PerformanceMetric) {
    // Report to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      this.sendToMonitoringService(metric);
    } else {
      console.log('Performance metric:', metric);
    }
  }
  
  private reportBundleMetric(src: string, size: number, loadTime: number) {
    const metric: PerformanceMetric = {
      name: 'bundle-load',
      value: loadTime,
      timestamp: Date.now(),
      type: 'bundle',
      metadata: {
        src,
        size,
        sizeKB: Math.round(size / 1024)
      }
    };
    
    this.metrics.set(`bundle-${src}`, metric);
    this.reportMetric(metric);
  }
  
  private sendToMonitoringService(metric: PerformanceMetric) {
    // Implementation depends on your monitoring service
    // e.g., send to Google Analytics, DataDog, New Relic, etc.
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(error => {
      console.warn('Failed to send metric:', error);
    });
  }
  
  private sendPerformanceAlert(alert: PerformanceAlert) {
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(error => {
      console.warn('Failed to send alert:', error);
    });
  }
}

// Type definitions
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'vital' | 'navigation' | 'resource' | 'paint' | 'measure' | 'component' | 'bundle' | 'memory';
  threshold?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  vitals: {
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
    FCP: number;
  };
  resources: PerformanceMetric[];
  components: PerformanceMetric[];
  memory: Record<string, any>;
  recommendations: string[];
}

interface PerformanceAlert {
  type: string;
  metrics: Record<string, number>;
  timestamp: number;
}
```

---

## **🎯 PERFORMANCE CHECKLIST**

### **Development Performance Checklist**
- [ ] Components are properly memoized
- [ ] Expensive calculations are memoized
- [ ] Event handlers are properly optimized
- [ ] Images are optimized and lazy-loaded
- [ ] Bundle size is within targets
- [ ] Code splitting is implemented
- [ ] Performance monitoring is active
- [ ] Memory leaks are prevented
- [ ] Touch events are optimized
- [ ] Animations use hardware acceleration

### **Production Performance Checklist**
- [ ] Core Web Vitals meet targets
- [ ] Bundle sizes are optimized
- [ ] Images are compressed and responsive
- [ ] CDN is configured
- [ ] Caching strategies are implemented
- [ ] Service worker is active
- [ ] Performance monitoring is enabled
- [ ] Alerts are configured
- [ ] Database queries are optimized
- [ ] API responses are cached

---

## **🎯 CONCLUSION**

Performance is not just about speed—it's about creating exceptional user experiences. Remember:

1. **Mobile-first approach** - Optimize for the slowest devices first
2. **Measure everything** - You can't optimize what you don't measure
3. **Continuous monitoring** - Performance degrades over time without attention
4. **User-centric metrics** - Focus on what users actually experience
5. **Progressive enhancement** - Core functionality should work everywhere
6. **Proactive optimization** - Fix performance issues before they become problems

**Performance is a feature, not an afterthought!** ⚡

---

*This guide is living documentation. Please update it as new performance techniques and tools become available.*