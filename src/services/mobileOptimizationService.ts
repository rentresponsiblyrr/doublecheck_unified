/**
 * Mobile Optimization Service
 * Performance optimizations for mobile inspectors
 */

import { logger } from '@/utils/logger';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  loadTime: number;
  interactionTime: number;
  batteryLevel?: number;
  networkSpeed?: string;
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageCompression: boolean;
  enableCodeSplitting: boolean;
  enableVirtualScrolling: boolean;
  enableBatteryOptimization: boolean;
  maxImageSize: number;
  jpegQuality: number;
  webpQuality: number;
}

export class MobileOptimizationService {
  private static instance: MobileOptimizationService;
  private config: OptimizationConfig;
  private observer: IntersectionObserver | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    fps: 60,
    memory: 0,
    loadTime: 0,
    interactionTime: 0
  };

  private readonly DEFAULT_CONFIG: OptimizationConfig = {
    enableLazyLoading: true,
    enableImageCompression: true,
    enableCodeSplitting: true,
    enableVirtualScrolling: true,
    enableBatteryOptimization: true,
    maxImageSize: 1920,
    jpegQuality: 0.85,
    webpQuality: 0.9
  };

  private constructor() {
    this.config = this.DEFAULT_CONFIG;
    this.initializeOptimizations();
  }

  static getInstance(): MobileOptimizationService {
    if (!MobileOptimizationService.instance) {
      MobileOptimizationService.instance = new MobileOptimizationService();
    }
    return MobileOptimizationService.instance;
  }

  private initializeOptimizations() {
    this.setupLazyLoading();
    this.setupPerformanceMonitoring();
    this.optimizeAnimations();
    this.setupBatteryOptimization();
    this.setupNetworkOptimization();
  }

  /**
   * Setup lazy loading for images and components
   */
  private setupLazyLoading() {
    if (!this.config.enableLazyLoading) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            
            // Load image
            if (element.tagName === 'IMG') {
              const img = element as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                this.observer?.unobserve(img);
              }
            }
            
            // Load component
            if (element.dataset.component) {
              this.loadComponent(element);
              this.observer?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    // Start observing
    this.observeLazyElements();
  }

  /**
   * Observe elements for lazy loading
   */
  observeLazyElements() {
    // Images
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.observer?.observe(img);
    });

    // Components
    document.querySelectorAll('[data-component]').forEach(element => {
      this.observer?.observe(element);
    });
  }

  /**
   * Load component dynamically
   */
  private async loadComponent(element: HTMLElement) {
    const componentName = element.dataset.component;
    if (!componentName) return;

    try {
      // Dynamic import for code splitting
      const module = await import(`../components/${componentName}`);
      // Component would be mounted here
      logger.info('Component lazy loaded', { componentName });
    } catch (error) {
      logger.error('Failed to lazy load component', { componentName, error });
    }
  }

  /**
   * Compress image before upload
   */
  async compressImage(file: File): Promise<File> {
    if (!this.config.enableImageCompression) return file;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxSize = this.config.maxImageSize;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: blob.type,
                lastModified: Date.now()
              });

              const compressionRatio = (1 - compressedFile.size / file.size) * 100;
              logger.info('Image compressed', {
                original: file.size,
                compressed: compressedFile.size,
                ratio: `${compressionRatio.toFixed(1)}%`
              });

              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp',
          file.type === 'image/jpeg' ? this.config.jpegQuality : this.config.webpQuality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring() {
    // Monitor FPS
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round(frames * 1000 / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        if (this.metrics.fps < 30) {
          this.reduceQuality();
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);

    // Monitor memory
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memory = memory.usedJSHeapSize / 1048576; // Convert to MB
        
        if (this.metrics.memory > 100) {
          this.triggerMemoryCleanup();
        }
      }, 5000);
    }

    // Monitor page load
    this.performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
        }
        
        if (entry.entryType === 'first-input') {
          this.metrics.interactionTime = entry.processingStart - entry.startTime;
        }
      });
    });

    this.performanceObserver.observe({ 
      entryTypes: ['navigation', 'first-input'] 
    });
  }

  /**
   * Optimize animations for mobile
   */
  private optimizeAnimations() {
    // Reduce motion for low-end devices
    if (this.isLowEndDevice()) {
      document.documentElement.classList.add('reduce-motion');
      
      // Add CSS
      const style = document.createElement('style');
      style.textContent = `
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Use CSS transforms instead of position changes
    document.querySelectorAll('[data-animate]').forEach(element => {
      (element as HTMLElement).style.willChange = 'transform';
    });
  }

  /**
   * Setup battery optimization
   */
  private async setupBatteryOptimization() {
    if (!this.config.enableBatteryOptimization) return;

    try {
      const battery = await (navigator as any).getBattery?.();
      if (!battery) return;

      this.metrics.batteryLevel = battery.level * 100;

      battery.addEventListener('levelchange', () => {
        this.metrics.batteryLevel = battery.level * 100;
        
        if (battery.level < 0.2) {
          this.enablePowerSaveMode();
        }
      });

      if (battery.level < 0.2) {
        this.enablePowerSaveMode();
      }
    } catch (error) {
      logger.warn('Battery API not available');
    }
  }

  /**
   * Setup network optimization
   */
  private setupNetworkOptimization() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.metrics.networkSpeed = connection.effectiveType;
      
      connection.addEventListener('change', () => {
        this.metrics.networkSpeed = connection.effectiveType;
        this.adjustQualityForNetwork();
      });
      
      this.adjustQualityForNetwork();
    }
  }

  /**
   * Adjust quality based on network speed
   */
  private adjustQualityForNetwork() {
    const speed = this.metrics.networkSpeed;
    
    switch (speed) {
      case 'slow-2g':
      case '2g':
        this.config.jpegQuality = 0.6;
        this.config.maxImageSize = 800;
        break;
      case '3g':
        this.config.jpegQuality = 0.7;
        this.config.maxImageSize = 1200;
        break;
      case '4g':
      default:
        this.config.jpegQuality = 0.85;
        this.config.maxImageSize = 1920;
        break;
    }
    
    logger.info('Quality adjusted for network', { 
      speed, 
      quality: this.config.jpegQuality 
    });
  }

  /**
   * Enable power save mode
   */
  private enablePowerSaveMode() {
    logger.info('Enabling power save mode');
    
    // Reduce animation frame rate
    document.documentElement.classList.add('power-save');
    
    // Reduce image quality
    this.config.jpegQuality = 0.6;
    this.config.maxImageSize = 800;
    
    // Disable non-essential features
    this.config.enableVirtualScrolling = false;
    
    // Reduce sync frequency
    this.reduceSyncFrequency();
  }

  /**
   * Reduce quality when performance is poor
   */
  private reduceQuality() {
    logger.warn('Reducing quality due to poor performance', {
      fps: this.metrics.fps
    });
    
    this.config.jpegQuality = Math.max(0.5, this.config.jpegQuality - 0.1);
    this.config.maxImageSize = Math.max(600, this.config.maxImageSize - 200);
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup() {
    logger.info('Triggering memory cleanup', {
      memory: `${this.metrics.memory.toFixed(1)}MB`
    });
    
    // Clear image caches
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!this.isInViewport(img)) {
        (img as HTMLImageElement).src = '';
      }
    });
    
    // Clear unused data
    if (typeof gc === 'function') {
      gc();
    }
  }

  /**
   * Check if element is in viewport
   */
  private isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  /**
   * Check if device is low-end
   */
  private isLowEndDevice(): boolean {
    // Check for low memory
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.jsHeapSizeLimit < 512 * 1024 * 1024) {
        return true;
      }
    }
    
    // Check for low core count
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      return true;
    }
    
    // Check for slow network
    if (this.metrics.networkSpeed === '2g' || this.metrics.networkSpeed === 'slow-2g') {
      return true;
    }
    
    return false;
  }

  /**
   * Reduce sync frequency for battery/network saving
   */
  private reduceSyncFrequency() {
    // This would communicate with offline service to reduce sync frequency
    window.dispatchEvent(new CustomEvent('reduce-sync-frequency'));
  }

  /**
   * Prefetch critical resources
   */
  prefetchResources(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.fps < 30) {
      recommendations.push('Reduce animations and visual effects');
    }
    
    if (this.metrics.memory > 100) {
      recommendations.push('Close unused tabs or restart the app');
    }
    
    if (this.metrics.loadTime > 3000) {
      recommendations.push('Clear cache or check network connection');
    }
    
    if (this.metrics.batteryLevel && this.metrics.batteryLevel < 20) {
      recommendations.push('Connect charger to maintain performance');
    }
    
    return recommendations;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.observer?.disconnect();
    this.performanceObserver?.disconnect();
  }
}

// Export singleton instance
export const mobileOptimization = MobileOptimizationService.getInstance();