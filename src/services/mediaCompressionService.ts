// Media Compression Service - Optimizes media files for mobile uploads
import { logger } from '@/utils/logger';

interface CompressionOptions {
  quality: number; // 0.1 to 1.0
  maxWidth: number;
  maxHeight: number;
  outputFormat: 'jpeg' | 'webp' | 'png';
  stripMetadata: boolean;
}

interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timeTaken: number;
}

interface VideoCompressionOptions {
  quality: 'low' | 'medium' | 'high';
  maxDuration: number; // seconds
  maxSize: number; // bytes
  resolution: '720p' | '1080p' | '480p';
}

export class MediaCompressionService {
  private readonly DEFAULT_PHOTO_OPTIONS: CompressionOptions = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    outputFormat: 'jpeg',
    stripMetadata: true
  };

  private readonly DEFAULT_VIDEO_OPTIONS: VideoCompressionOptions = {
    quality: 'medium',
    maxDuration: 300, // 5 minutes
    maxSize: 10 * 1024 * 1024, // 10MB (reduced from 50MB for faster uploads)
    resolution: '720p'
  };

  /**
   * Compress photo for mobile upload
   */
  async compressPhoto(
    file: File, 
    options: Partial<CompressionOptions> = {}
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.DEFAULT_PHOTO_OPTIONS, ...options };
    
    logger.info('Starting photo compression', {
      fileName: file.name,
      originalSize: file.size,
      options: finalOptions
    }, 'MEDIA_COMPRESSION');

    try {
      // Skip compression if file is already small
      if (file.size < 100 * 1024) { // 100KB
        logger.info('Photo is already small, skipping compression', {
          fileName: file.name,
          size: file.size
        }, 'MEDIA_COMPRESSION');
        
        return {
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          timeTaken: Date.now() - startTime
        };
      }

      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Create image from file
      const img = new Image();
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      img.src = URL.createObjectURL(file);
      await imageLoadPromise;

      // Calculate optimal dimensions
      const { width, height } = this.calculateOptimalDimensions(
        img.width,
        img.height,
        finalOptions.maxWidth,
        finalOptions.maxHeight
      );

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${finalOptions.outputFormat}`,
          finalOptions.quality
        );
      });

      // Clean up
      URL.revokeObjectURL(img.src);

      // Create compressed file
      const compressedFile = new File(
        [compressedBlob],
        this.generateCompressedFileName(file.name, finalOptions.outputFormat),
        { type: compressedBlob.type }
      );

      const result: CompressionResult = {
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size / compressedFile.size,
        timeTaken: Date.now() - startTime
      };

      logger.info('Photo compression completed', {
        fileName: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: result.compressionRatio,
        timeTaken: result.timeTaken,
        savedBytes: file.size - compressedFile.size
      }, 'MEDIA_COMPRESSION');

      return result;
    } catch (error) {
      logger.error('Photo compression failed', error, 'MEDIA_COMPRESSION');
      throw error;
    }
  }

  /**
   * Batch compress multiple photos
   */
  async compressPhotos(
    files: File[],
    options: Partial<CompressionOptions> = {},
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    const total = files.length;

    logger.info('Starting batch photo compression', {
      count: total,
      options
    }, 'MEDIA_COMPRESSION');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress((i / total) * 100, file.name);
      }

      try {
        const result = await this.compressPhoto(file, options);
        results.push(result);
      } catch (error) {
        logger.error('Failed to compress photo in batch', error, 'MEDIA_COMPRESSION');
        // Continue with other files
        results.push({
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          timeTaken: 0
        });
      }
    }

    if (onProgress) {
      onProgress(100, 'Completed');
    }

    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalSavings = totalOriginalSize - totalCompressedSize;

    logger.info('Batch photo compression completed', {
      count: results.length,
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRatio: totalOriginalSize / totalCompressedSize
    }, 'MEDIA_COMPRESSION');

    return results;
  }

  /**
   * Estimate video compression (placeholder for future implementation)
   */
  async estimateVideoCompression(file: File): Promise<{
    canCompress: boolean;
    estimatedSize: number;
    estimatedDuration: number;
  }> {
    // For now, we'll do basic size estimation
    // In a full implementation, you'd use WebCodecs API or similar
    
    const canCompress = file.size > 10 * 1024 * 1024; // 10MB
    const estimatedSize = canCompress ? file.size * 0.4 : file.size; // 60% compression
    
    // Estimate duration based on file size (very rough)
    const estimatedDuration = Math.min(file.size / (1024 * 1024) * 10, 300); // ~10 seconds per MB, max 5 minutes

    return {
      canCompress,
      estimatedSize,
      estimatedDuration
    };
  }

  /**
   * Check if file needs compression
   */
  shouldCompressFile(file: File, maxSize: number = 2 * 1024 * 1024): boolean {
    return file.size > maxSize;
  }

  /**
   * Compress video for mobile upload - PERFORMANCE CRITICAL
   * Simple video compression using browser APIs
   */
  async compressVideo(
    file: File,
    options: Partial<VideoCompressionOptions> = {}
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.DEFAULT_VIDEO_OPTIONS, ...options };

    try {
      // Check if compression is needed
      if (file.size <= finalOptions.maxSize) {
        logger.info('Video file is already small enough, skipping compression', {
          fileSize: file.size,
          maxSize: finalOptions.maxSize
        }, 'MEDIA_COMPRESSION');
        
        return {
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          timeTaken: Date.now() - startTime
        };
      }

      // For now, implement a simple file size reduction by reducing quality
      // In a real implementation, you would use FFmpeg.js or similar
      logger.warn('Video compression not fully implemented - using size limit workaround', {
        originalSize: file.size,
        targetSize: finalOptions.maxSize
      }, 'MEDIA_COMPRESSION');

      // Return original file but with warning
      return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        timeTaken: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Video compression failed', error, 'MEDIA_COMPRESSION');
      
      // Return original file if compression fails
      return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        timeTaken: Date.now() - startTime
      };
    }
  }

  /**
   * Get optimal compression settings based on network conditions
   */
  getOptimalCompressionSettings(networkSpeed: 'slow' | 'medium' | 'fast'): CompressionOptions {
    const settings: Record<string, CompressionOptions> = {
      slow: {
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 720,
        outputFormat: 'jpeg',
        stripMetadata: true
      },
      medium: {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        outputFormat: 'jpeg',
        stripMetadata: true
      },
      fast: {
        quality: 0.9,
        maxWidth: 2560,
        maxHeight: 1440,
        outputFormat: 'webp',
        stripMetadata: true
      }
    };

    return settings[networkSpeed];
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);

      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    return { width, height };
  }

  /**
   * Generate compressed filename
   */
  private generateCompressedFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_compressed_${timestamp}.${format}`;
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Analyze image quality and suggest compression settings
   */
  async analyzeImageQuality(file: File): Promise<{
    hasHighDetail: boolean;
    recommendedQuality: number;
    suggestedMaxWidth: number;
    suggestedMaxHeight: number;
  }> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const img = new Image();
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      img.src = URL.createObjectURL(file);
      await imageLoadPromise;

      // Sample image for quality analysis
      const sampleSize = 100;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      // Calculate edge detection score (simplified)
      let edgeScore = 0;
      for (let i = 0; i < data.length - 4; i += 4) {
        const r1 = data[i];
        const r2 = data[i + 4];
        edgeScore += Math.abs(r1 - r2);
      }

      const hasHighDetail = edgeScore > 10000; // Threshold for high detail
      
      URL.revokeObjectURL(img.src);

      return {
        hasHighDetail,
        recommendedQuality: hasHighDetail ? 0.9 : 0.7,
        suggestedMaxWidth: hasHighDetail ? 2048 : 1600,
        suggestedMaxHeight: hasHighDetail ? 1536 : 1200
      };
    } catch (error) {
      logger.error('Image quality analysis failed', error, 'MEDIA_COMPRESSION');
      
      // Return default values
      return {
        hasHighDetail: false,
        recommendedQuality: 0.8,
        suggestedMaxWidth: 1920,
        suggestedMaxHeight: 1080
      };
    }
  }
}

// Export singleton instance
export const mediaCompressionService = new MediaCompressionService();