// Photo Optimizer for STR Certified Mobile Upload

import type { PhotoOptimizationConfig, OptimizationResult, DeviceCapabilities } from '@/types/photo';

export interface PhotoOptimizerOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
  maxFileSize?: number;
  preserveMetadata?: boolean;
  enableProgressive?: boolean;
}

export class PhotoOptimizer {
  private defaultOptions: Required<PhotoOptimizerOptions> = {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    format: 'jpeg',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    preserveMetadata: false,
    enableProgressive: true
  };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;

  constructor(options: PhotoOptimizerOptions = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.initializeCanvas();
    this.detectDeviceCapabilities();
  }

  /**
   * Optimizes a photo for upload while maintaining quality for AI analysis
   * @param file - Original photo file
   * @param options - Override default optimization options
   * @returns Promise<OptimizationResult>
   */
  async optimizeForUpload(
    file: File,
    options: Partial<PhotoOptimizerOptions> = {}
  ): Promise<OptimizationResult> {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Validate input
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Expected an image.');
      }

      // Load image
      const originalImage = await this.loadImage(file);
      const originalSize = file.size;
      const originalDimensions = {
        width: originalImage.width,
        height: originalImage.height
      };

      // Calculate optimal dimensions
      const { width, height } = this.calculateOptimalDimensions(
        originalImage.width,
        originalImage.height,
        opts.maxWidth,
        opts.maxHeight
      );

      // Resize image
      const resizedImage = await this.resizeImage(originalImage, width, height);

      // Apply device-specific optimizations
      const deviceOptimizedQuality = this.getDeviceOptimizedQuality(opts.quality);

      // Convert to blob with quality adjustments
      let blob = await this.imageToBlob(resizedImage, opts.format, deviceOptimizedQuality);
      
      // If file is still too large, progressively reduce quality
      if (blob.size > opts.maxFileSize) {
        blob = await this.progressiveQualityReduction(
          resizedImage,
          opts.format,
          deviceOptimizedQuality,
          opts.maxFileSize
        );
      }

      // Create optimized file
      const optimizedFile = new File([blob], file.name, {
        type: `image/${opts.format}`,
        lastModified: Date.now()
      });

      // Calculate metrics
      const compressionRatio = ((originalSize - blob.size) / originalSize) * 100;
      const processingTime = performance.now() - startTime;

      return {
        originalFile: file,
        optimizedFile,
        originalSize,
        optimizedSize: blob.size,
        compressionRatio,
        originalDimensions,
        optimizedDimensions: { width, height },
        format: opts.format,
        quality: deviceOptimizedQuality,
        processingTime,
        success: true,
        metadata: {
          deviceCapabilities: this.deviceCapabilities,
          optimizationSettings: opts
        }
      };

    } catch (error) {
      return {
        originalFile: file,
        optimizedFile: file,
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 0,
        originalDimensions: { width: 0, height: 0 },
        optimizedDimensions: { width: 0, height: 0 },
        format: 'jpeg',
        quality: 0,
        processingTime: performance.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Optimization failed'
      };
    }
  }

  /**
   * Batch optimize multiple photos
   * @param files - Array of photo files
   * @param options - Optimization options
   * @returns Promise<OptimizationResult[]>
   */
  async batchOptimize(
    files: File[],
    options: Partial<PhotoOptimizerOptions> = {}
  ): Promise<OptimizationResult[]> {
    // Process in chunks to avoid memory issues
    const chunkSize = this.getOptimalBatchSize();
    const results: OptimizationResult[] = [];

    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(file => this.optimizeForUpload(file, options))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Prepares photo for AI analysis (higher quality preservation)
   * @param file - Photo file
   * @returns Promise<OptimizationResult>
   */
  async optimizeForAI(file: File): Promise<OptimizationResult> {
    return this.optimizeForUpload(file, {
      quality: 0.95,
      maxWidth: 4096,
      maxHeight: 4096,
      maxFileSize: 10 * 1024 * 1024 // 10MB for AI analysis
    });
  }

  /**
   * Creates a thumbnail for preview
   * @param file - Photo file
   * @param size - Thumbnail size
   * @returns Promise<string> - Data URL
   */
  async createThumbnail(file: File, size: number = 200): Promise<string> {
    try {
      const image = await this.loadImage(file);
      const { width, height } = this.calculateOptimalDimensions(
        image.width,
        image.height,
        size,
        size
      );

      const thumbnail = await this.resizeImage(image, width, height);
      return thumbnail.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      // REMOVED: console.error('Failed to create thumbnail:', error);
      return '';
    }
  }

  // Private helper methods

  private initializeCanvas(): void {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  private detectDeviceCapabilities(): void {
    if (typeof window === 'undefined') return;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    this.deviceCapabilities = {
      maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 4096,
      deviceMemory: (navigator as any).deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        saveData: (navigator as any).connection.saveData
      } : null,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1
      }
    };
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // Don't upscale
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    let width = maxWidth;
    let height = maxHeight;

    if (originalWidth / originalHeight > maxWidth / maxHeight) {
      height = Math.round(maxWidth / aspectRatio);
    } else {
      width = Math.round(maxHeight * aspectRatio);
    }

    return { width, height };
  }

  private async resizeImage(
    image: HTMLImageElement,
    width: number,
    height: number
  ): Promise<HTMLCanvasElement> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    // Use step-down approach for better quality
    let currentWidth = image.width;
    let currentHeight = image.height;
    let currentImage: HTMLImageElement | HTMLCanvasElement = image;

    // Step down in halves for better quality
    while (currentWidth > width * 2 || currentHeight > height * 2) {
      currentWidth = Math.round(currentWidth / 2);
      currentHeight = Math.round(currentHeight / 2);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = currentWidth;
      tempCanvas.height = currentHeight;
      
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Failed to get canvas context');
      
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(currentImage, 0, 0, currentWidth, currentHeight);
      
      currentImage = tempCanvas;
    }

    // Final resize
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(currentImage, 0, 0, width, height);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Failed to get canvas context');
    
    finalCtx.drawImage(this.canvas, 0, 0);
    return finalCanvas;
  }

  private async imageToBlob(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'webp',
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        `image/${format}`,
        quality
      );
    });
  }

  private async progressiveQualityReduction(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'webp',
    startQuality: number,
    targetSize: number
  ): Promise<Blob> {
    let quality = startQuality;
    let blob = await this.imageToBlob(canvas, format, quality);
    
    // Reduce quality in steps until target size is reached
    while (blob.size > targetSize && quality > 0.3) {
      quality -= 0.05;
      blob = await this.imageToBlob(canvas, format, quality);
    }

    return blob;
  }

  private getDeviceOptimizedQuality(baseQuality: number): number {
    if (!this.deviceCapabilities) return baseQuality;

    // Adjust quality based on device capabilities
    let quality = baseQuality;

    // Lower quality for low-memory devices
    if (this.deviceCapabilities.deviceMemory < 4) {
      quality *= 0.9;
    }

    // Lower quality for slow connections
    if (this.deviceCapabilities.connection?.effectiveType === '2g' ||
        this.deviceCapabilities.connection?.effectiveType === 'slow-2g') {
      quality *= 0.85;
    }

    // Honor data saver preferences
    if (this.deviceCapabilities.connection?.saveData) {
      quality *= 0.8;
    }

    return Math.max(0.5, Math.min(1, quality));
  }

  private getOptimalBatchSize(): number {
    if (!this.deviceCapabilities) return 3;

    const memory = this.deviceCapabilities.deviceMemory;
    const cores = this.deviceCapabilities.hardwareConcurrency;

    if (memory >= 8 && cores >= 8) return 10;
    if (memory >= 4 && cores >= 4) return 5;
    return 3;
  }
}

// Export types
export interface OptimizationResult {
  originalFile: File;
  optimizedFile: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  optimizedDimensions: { width: number; height: number };
  format: string;
  quality: number;
  processingTime: number;
  success: boolean;
  error?: string;
  metadata?: any;
}

export interface DeviceCapabilities {
  maxTextureSize: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  connection: {
    effectiveType: string;
    downlink: number;
    saveData: boolean;
  } | null;
  userAgent: string;
  platform: string;
  screenResolution: {
    width: number;
    height: number;
    pixelRatio: number;
  };
}

// Export factory function
export const createPhotoOptimizer = (
  options?: PhotoOptimizerOptions
): PhotoOptimizer => {
  return new PhotoOptimizer(options);
};