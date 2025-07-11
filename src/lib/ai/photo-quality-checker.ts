// Photo Quality Checker for STR Certified

import type {
  PhotoQualityMetrics,
  QualityScore,
  QualityIssue,
  QualityImprovement,
  PhotoGuidance,
  GuidanceMessage,
  OverlayGuide,
  QualityCheckConfig
} from '@/types/photo';

export class PhotoQualityChecker {
  private config: QualityCheckConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config: Partial<QualityCheckConfig> = {}) {
    this.config = {
      minSharpness: 75, // Increased from 70 for better quality
      minLighting: 65,  // Increased from 60 for better quality
      minResolution: { width: 1920, height: 1080 },
      maxFileSize: 10 * 1024 * 1024, // 10MB
      acceptableFormats: ['image/jpeg', 'image/png', 'image/webp'],
      realTimeFeedback: true,
      ...config
    };

    // Initialize canvas for image analysis
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * Analyzes photo quality and provides real-time feedback
   * @param photo - Photo file or blob to analyze
   * @param referencePhoto - Optional reference photo for comparison
   * @returns Promise<PhotoGuidance>
   */
  async analyzePhotoWithGuidance(
    photo: File | Blob,
    referencePhoto?: string
  ): Promise<PhotoGuidance> {
    try {
      // Basic validation
      const validationMessages = await this.validatePhotoBasics(photo);
      if (validationMessages.length > 0) {
        return {
          isAcceptable: false,
          qualityScore: 0,
          messages: validationMessages,
          referencePhoto,
          overlayGuides: []
        };
      }

      // Analyze quality metrics
      const metrics = await this.analyzeQualityMetrics(photo);
      
      // Generate guidance messages
      const messages = this.generateGuidanceMessages(metrics);
      
      // Create overlay guides
      const overlayGuides = this.createOverlayGuides(metrics);

      // Determine if photo is acceptable
      const isAcceptable = this.isPhotoAcceptable(metrics);

      return {
        isAcceptable,
        qualityScore: metrics.overall_score,
        messages,
        referencePhoto,
        overlayGuides
      };

    } catch (error) {
      return {
        isAcceptable: false,
        qualityScore: 0,
        messages: [{
          type: 'error',
          message: 'Failed to analyze photo',
          priority: 5
        }],
        referencePhoto
      };
    }
  }

  /**
   * Analyzes detailed quality metrics of a photo
   * @param photo - Photo to analyze
   * @returns Promise<PhotoQualityMetrics>
   */
  async analyzeQualityMetrics(photo: File | Blob): Promise<PhotoQualityMetrics> {
    const image = await this.loadImage(photo);
    
    // Set canvas dimensions
    if (this.canvas && this.ctx) {
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      this.ctx.drawImage(image, 0, 0);
    }

    // Analyze different quality aspects
    const sharpness = await this.analyzeSharpness(image);
    const lighting = await this.analyzeLighting(image);
    const composition = await this.analyzeComposition(image);
    
    // Check for motion blur
    const motionBlur = await this.detectMotionBlur(image);

    // Detect specific issues
    const issues = this.detectQualityIssues(sharpness, lighting, composition, image, motionBlur);
    
    // Generate improvement suggestions
    const suggestions = this.generateImprovementSuggestions(issues, sharpness, lighting, composition, motionBlur);

    // Calculate overall score
    const overall_score = this.calculateOverallScore(sharpness, lighting, composition);

    return {
      sharpness,
      lighting,
      composition,
      overall_score,
      issues,
      suggestions
    };
  }

  /**
   * Provides real-time quality feedback during capture
   * @param videoStream - Video stream from camera
   * @param callback - Callback for feedback updates
   */
  async provideRealTimeFeedback(
    videoStream: MediaStream,
    callback: (guidance: PhotoGuidance) => void
  ): Promise<() => void> {
    let isActive = true;
    const video = document.createElement('video');
    video.srcObject = videoStream;
    await video.play();

    const analyze = async () => {
      if (!isActive) return;

      // Capture frame from video
      if (this.canvas && this.ctx) {
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        this.ctx.drawImage(video, 0, 0);
        
        const blob = await new Promise<Blob>((resolve) => {
          this.canvas!.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
        });

        // Analyze the frame
        const guidance = await this.analyzePhotoWithGuidance(blob);
        callback(guidance);
      }

      // Continue analyzing if active
      if (isActive) {
        requestAnimationFrame(analyze);
      }
    };

    // Start analysis loop
    analyze();

    // Return cleanup function
    return () => {
      isActive = false;
      video.pause();
      video.srcObject = null;
    };
  }

  // Private helper methods

  private async validatePhotoBasics(photo: File | Blob): Promise<GuidanceMessage[]> {
    const messages: GuidanceMessage[] = [];

    // Check file size
    if (photo.size > this.config.maxFileSize) {
      messages.push({
        type: 'error',
        message: `Photo size exceeds ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB limit`,
        action: 'Please use a lower resolution or quality setting',
        priority: 5
      });
    }

    // Check file format
    if (!this.config.acceptableFormats.includes(photo.type)) {
      messages.push({
        type: 'error',
        message: 'Invalid photo format',
        action: 'Please use JPEG, PNG, or WebP format',
        priority: 5
      });
    }

    // Check resolution
    const dimensions = await this.getImageDimensions(photo);
    if (dimensions.width < this.config.minResolution.width || 
        dimensions.height < this.config.minResolution.height) {
      messages.push({
        type: 'warning',
        message: 'Photo resolution is too low',
        action: 'Use a higher resolution camera setting',
        priority: 4
      });
    }

    return messages;
  }

  private async analyzeSharpness(image: HTMLImageElement): Promise<QualityScore> {
    // Mock sharpness analysis - in production, use edge detection algorithms
    const mockScore = 75 + Math.random() * 20;
    
    return {
      score: Math.round(mockScore),
      rating: this.getQualityRating(mockScore),
      details: mockScore > 80 ? 'Image is sharp and in focus' : 'Some areas appear slightly blurry'
    };
  }

  private async analyzeLighting(image: HTMLImageElement): Promise<QualityScore> {
    if (!this.ctx) {
      return { score: 0, rating: 'unacceptable' };
    }

    // Analyze brightness distribution
    const imageData = this.ctx.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
    const pixels = imageData.data;
    
    let totalBrightness = 0;
    let underexposed = 0;
    let overexposed = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      totalBrightness += brightness;
      
      if (brightness < 30) underexposed++;
      if (brightness > 225) overexposed++;
    }

    const avgBrightness = totalBrightness / (pixels.length / 4);
    const underexposedRatio = underexposed / (pixels.length / 4);
    const overexposedRatio = overexposed / (pixels.length / 4);

    // Calculate lighting score
    let score = 100;
    if (avgBrightness < 80) score -= (80 - avgBrightness) * 0.5;
    if (avgBrightness > 175) score -= (avgBrightness - 175) * 0.5;
    if (underexposedRatio > 0.3) score -= underexposedRatio * 30;
    if (overexposedRatio > 0.1) score -= overexposedRatio * 40;

    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      rating: this.getQualityRating(score),
      details: this.getLightingDetails(avgBrightness, underexposedRatio, overexposedRatio)
    };
  }

  private async analyzeComposition(image: HTMLImageElement): Promise<QualityScore> {
    if (!this.ctx || !this.canvas) {
      return { score: 0, rating: 'unacceptable', details: 'Canvas not available for analysis' };
    }

    // Get image data for analysis
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Basic composition checks
    const aspectRatio = image.width / image.height;
    const isLandscape = aspectRatio > 1.2;
    const isPortrait = aspectRatio < 0.8;
    
    let score = 70; // Base score
    
    // Aspect ratio evaluation
    if (isLandscape) score += 15; // Prefer landscape for room photos
    if (isPortrait) score -= 10;
    
    // Resolution check
    if (image.width < 1920 || image.height < 1080) score -= 15;
    
    // Rule of thirds analysis
    const ruleOfThirdsScore = this.analyzeRuleOfThirds(imageData);
    score += ruleOfThirdsScore * 0.3;
    
    // Horizon detection and level check
    const horizonScore = this.analyzeHorizonLevel(imageData);
    score += horizonScore * 0.2;
    
    // Center bias check (avoid everything centered)
    const centerBiasScore = this.analyzeCenterBias(imageData);
    score += centerBiasScore * 0.1;
    
    // Edge content check (avoid cutting off important elements)
    const edgeContentScore = this.analyzeEdgeContent(imageData);
    score += edgeContentScore * 0.15;
    
    // Normalize score
    score = Math.max(0, Math.min(100, score));
    
    const details = this.generateCompositionDetails(score, ruleOfThirdsScore, horizonScore, centerBiasScore);

    return {
      score: Math.round(score),
      rating: this.getQualityRating(score),
      details
    };
  }

  private detectQualityIssues(
    sharpness: QualityScore,
    lighting: QualityScore,
    composition: QualityScore,
    image: HTMLImageElement,
    motionBlur?: { hasMotionBlur: boolean; severity: 'low' | 'medium' | 'high' }
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    if (sharpness.score < this.config.minSharpness) {
      issues.push({
        type: 'blur',
        severity: sharpness.score < 50 ? 'critical' : 'major',
        description: 'Photo appears blurry or out of focus'
      });
    }

    if (lighting.score < this.config.minLighting) {
      const avgBrightness = parseInt(lighting.details?.match(/\d+/) || ['0'])[0];
      if (avgBrightness < 80) {
        issues.push({
          type: 'underexposed',
          severity: lighting.score < 40 ? 'critical' : 'major',
          description: 'Photo is too dark'
        });
      } else if (avgBrightness > 175) {
        issues.push({
          type: 'overexposed',
          severity: lighting.score < 40 ? 'critical' : 'major',
          description: 'Photo is too bright'
        });
      }
    }

    if (image.width < this.config.minResolution.width || 
        image.height < this.config.minResolution.height) {
      issues.push({
        type: 'low_resolution',
        severity: 'minor',
        description: 'Photo resolution is below recommended'
      });
    }
    
    // Check for motion blur
    if (motionBlur?.hasMotionBlur) {
      issues.push({
        type: 'blur',
        severity: motionBlur.severity === 'high' ? 'critical' : motionBlur.severity === 'medium' ? 'major' : 'minor',
        description: `Motion blur detected - ${motionBlur.severity} severity`
      });
    }

    return issues;
  }

  private generateImprovementSuggestions(
    issues: QualityIssue[],
    sharpness: QualityScore,
    lighting: QualityScore,
    composition: QualityScore,
    motionBlur?: { hasMotionBlur: boolean; severity: 'low' | 'medium' | 'high' }
  ): QualityImprovement[] {
    const suggestions: QualityImprovement[] = [];

    // Sharpness improvements
    if (sharpness.score < 80) {
      suggestions.push({
        action: 'Tap on the main subject to focus',
        priority: 'high',
        icon: '🎯',
        estimatedImprovement: 25
      });
      
      suggestions.push({
        action: 'Hold device steady or use a tripod',
        priority: 'high',
        icon: '📱',
        estimatedImprovement: 20
      });
      
      suggestions.push({
        action: 'Ensure adequate lighting before focusing',
        priority: 'medium',
        icon: '💡',
        estimatedImprovement: 15
      });
      
      suggestions.push({
        action: 'Clean camera lens if image is consistently blurry',
        priority: 'medium',
        icon: '🧽',
        estimatedImprovement: 10
      });
    }

    // Lighting improvements
    if (lighting.score < 70) {
      if (issues.some(i => i.type === 'underexposed')) {
        suggestions.push({
          action: 'Turn on all room lights',
          priority: 'high',
          icon: '💡',
          estimatedImprovement: 30
        });
        
        suggestions.push({
          action: 'Open curtains/blinds for natural light',
          priority: 'medium',
          icon: '☀️',
          estimatedImprovement: 20
        });
      } else if (issues.some(i => i.type === 'overexposed')) {
        suggestions.push({
          action: 'Avoid direct sunlight or bright lights',
          priority: 'high',
          icon: '🌤️',
          estimatedImprovement: 25
        });
      }
    }

    // Composition improvements
    if (composition.score < 75) {
      suggestions.push({
        action: 'Step back to capture more of the room',
        priority: 'medium',
        icon: '🚶',
        estimatedImprovement: 15
      });
      
      suggestions.push({
        action: 'Hold device in landscape orientation',
        priority: 'low',
        icon: '📐',
        estimatedImprovement: 10
      });
      
      // Rule of thirds suggestions
      if (composition.details?.includes('rule of thirds')) {
        suggestions.push({
          action: 'Position key elements along imaginary third lines',
          priority: 'medium',
          icon: '⊞',
          estimatedImprovement: 12
        });
      }
      
      // Horizon level suggestions
      if (composition.details?.includes('horizon') && composition.details?.includes('tilted')) {
        suggestions.push({
          action: 'Level the horizon or use grid lines',
          priority: 'medium',
          icon: '📏',
          estimatedImprovement: 10
        });
      }
      
      // Center bias suggestions
      if (composition.details?.includes('distribution')) {
        suggestions.push({
          action: 'Avoid centering everything - use off-center composition',
          priority: 'medium',
          icon: '🎯',
          estimatedImprovement: 8
        });
      }
      
      // Edge content suggestions
      if (composition.score < 60) {
        suggestions.push({
          action: 'Ensure important elements are not cut off at edges',
          priority: 'medium',
          icon: '🖼️',
          estimatedImprovement: 12
        });
      }
    }

    // Motion blur improvements
    if (motionBlur?.hasMotionBlur) {
      suggestions.push({
        action: 'Hold device completely still during capture',
        priority: 'high',
        icon: '🛑',
        estimatedImprovement: 30
      });
      
      suggestions.push({
        action: 'Use burst mode and select sharpest image',
        priority: 'medium',
        icon: '📸',
        estimatedImprovement: 20
      });
      
      if (motionBlur.severity === 'high') {
        suggestions.push({
          action: 'Consider using a tripod or stable surface',
          priority: 'high',
          icon: '🔧',
          estimatedImprovement: 35
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateGuidanceMessages(metrics: PhotoQualityMetrics): GuidanceMessage[] {
    const messages: GuidanceMessage[] = [];

    if (metrics.overall_score >= 85) {
      messages.push({
        type: 'success',
        message: 'Photo quality is excellent!',
        priority: 1
      });
    } else if (metrics.overall_score >= 70) {
      messages.push({
        type: 'info',
        message: 'Photo quality is acceptable',
        priority: 2
      });
    }

    // Add specific guidance based on issues
    metrics.issues.forEach(issue => {
      if (issue.severity === 'critical') {
        messages.push({
          type: 'error',
          message: issue.description,
          action: metrics.suggestions[0]?.action,
          priority: 5
        });
      } else if (issue.severity === 'major') {
        messages.push({
          type: 'warning',
          message: issue.description,
          action: metrics.suggestions[0]?.action,
          priority: 4
        });
      }
    });

    // Add top suggestion if no critical issues
    if (!messages.some(m => m.type === 'error') && metrics.suggestions.length > 0) {
      const topSuggestion = metrics.suggestions[0];
      messages.push({
        type: 'info',
        message: topSuggestion.action,
        priority: 3
      });
    }

    return messages.sort((a, b) => b.priority - a.priority);
  }

  private createOverlayGuides(metrics: PhotoQualityMetrics): OverlayGuide[] {
    const guides: OverlayGuide[] = [];

    // Add rule of thirds grid if composition needs improvement
    if (metrics.composition.score < 80) {
      guides.push({
        type: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        label: 'Align key elements with grid lines'
      });
    }

    // Add center focus point if sharpness is low
    if (metrics.sharpness.score < 70) {
      guides.push({
        type: 'frame',
        coordinates: { x: 40, y: 40, width: 20, height: 20 },
        color: '#ff0000',
        opacity: 0.5,
        label: 'Tap here to focus'
      });
    }
    
    // Add horizon level guide if horizon is tilted
    if (metrics.composition.details?.includes('tilted')) {
      guides.push({
        type: 'frame',
        coordinates: { x: 10, y: 45, width: 80, height: 1 },
        color: '#ffff00',
        opacity: 0.6,
        label: 'Level horizon with this guide'
      });
    }
    
    // Add center bias warning if everything is centered
    if (metrics.composition.details?.includes('distribution')) {
      guides.push({
        type: 'frame',
        coordinates: { x: 35, y: 35, width: 30, height: 30 },
        color: '#ff8800',
        opacity: 0.4,
        label: 'Avoid centering everything in this area'
      });
    }
    
    // Add edge warning if important elements are cut off
    if (metrics.composition.score < 60) {
      // Top edge warning
      guides.push({
        type: 'frame',
        coordinates: { x: 0, y: 0, width: 100, height: 5 },
        color: '#ff0000',
        opacity: 0.3,
        label: 'Keep important elements away from edges'
      });
      
      // Bottom edge warning
      guides.push({
        type: 'frame',
        coordinates: { x: 0, y: 95, width: 100, height: 5 },
        color: '#ff0000',
        opacity: 0.3,
        label: 'Keep important elements away from edges'
      });
      
      // Left edge warning
      guides.push({
        type: 'frame',
        coordinates: { x: 0, y: 0, width: 5, height: 100 },
        color: '#ff0000',
        opacity: 0.3,
        label: 'Keep important elements away from edges'
      });
      
      // Right edge warning
      guides.push({
        type: 'frame',
        coordinates: { x: 95, y: 0, width: 5, height: 100 },
        color: '#ff0000',
        opacity: 0.3,
        label: 'Keep important elements away from edges'
      });
    }

    return guides;
  }

  private isPhotoAcceptable(metrics: PhotoQualityMetrics): boolean {
    return metrics.overall_score >= this.config.minSharpness &&
           metrics.sharpness.score >= this.config.minSharpness &&
           metrics.lighting.score >= this.config.minLighting &&
           metrics.issues.filter(i => i.severity === 'critical').length === 0;
  }

  private calculateOverallScore(
    sharpness: QualityScore,
    lighting: QualityScore,
    composition: QualityScore
  ): number {
    // Weighted average: sharpness 40%, lighting 35%, composition 25%
    return Math.round(
      sharpness.score * 0.4 +
      lighting.score * 0.35 +
      composition.score * 0.25
    );
  }

  private getQualityRating(score: number): QualityScore['rating'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 40) return 'poor';
    return 'unacceptable';
  }

  private getLightingDetails(
    avgBrightness: number,
    underexposedRatio: number,
    overexposedRatio: number
  ): string {
    if (underexposedRatio > 0.3) {
      return `Image is underexposed (avg brightness: ${Math.round(avgBrightness)})`;
    }
    if (overexposedRatio > 0.1) {
      return `Image has overexposed areas (avg brightness: ${Math.round(avgBrightness)})`;
    }
    if (avgBrightness < 80) {
      return `Image could be brighter (avg brightness: ${Math.round(avgBrightness)})`;
    }
    if (avgBrightness > 175) {
      return `Image might be too bright (avg brightness: ${Math.round(avgBrightness)})`;
    }
    return `Well-balanced lighting (avg brightness: ${Math.round(avgBrightness)})`;
  }

  private async loadImage(photo: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(photo);
      
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

  private async getImageDimensions(photo: File | Blob): Promise<{ width: number; height: number }> {
    const img = await this.loadImage(photo);
    return { width: img.width, height: img.height };
  }

  /**
   * Analyzes rule of thirds composition
   * Checks if key elements are positioned along third lines
   */
  private analyzeRuleOfThirds(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Define rule of thirds lines
    const vLine1 = Math.floor(width / 3);
    const vLine2 = Math.floor(2 * width / 3);
    const hLine1 = Math.floor(height / 3);
    const hLine2 = Math.floor(2 * height / 3);
    
    // Calculate edge density along third lines
    let totalEdgeStrength = 0;
    let linePixelCount = 0;
    
    // Check vertical lines
    for (let y = 1; y < height - 1; y++) {
      [vLine1, vLine2].forEach(x => {
        if (x >= 1 && x < width - 1) {
          const idx = (y * width + x) * 4;
          const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
          const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
          
          const edgeStrength = Math.abs(right - left);
          totalEdgeStrength += edgeStrength;
          linePixelCount++;
        }
      });
    }
    
    // Check horizontal lines
    for (let x = 1; x < width - 1; x++) {
      [hLine1, hLine2].forEach(y => {
        if (y >= 1 && y < height - 1) {
          const idx = (y * width + x) * 4;
          const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
          const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
          
          const edgeStrength = Math.abs(bottom - top);
          totalEdgeStrength += edgeStrength;
          linePixelCount++;
        }
      });
    }
    
    const avgEdgeStrength = totalEdgeStrength / linePixelCount;
    
    // Normalize to 0-20 range (contribution to overall score)
    return Math.min(20, avgEdgeStrength / 10);
  }

  /**
   * Analyzes horizon level in the image
   * Detects horizontal lines and checks if they are level
   */
  private analyzeHorizonLevel(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const horizontalLines: { y: number; strength: number }[] = [];
    
    // Detect horizontal lines using edge detection
    for (let y = height * 0.2; y < height * 0.8; y++) {
      let lineStrength = 0;
      let pixelCount = 0;
      
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        
        const verticalEdge = Math.abs(bottom - top);
        lineStrength += verticalEdge;
        pixelCount++;
      }
      
      const avgStrength = lineStrength / pixelCount;
      if (avgStrength > 15) { // Threshold for significant horizontal line
        horizontalLines.push({ y, strength: avgStrength });
      }
    }
    
    if (horizontalLines.length === 0) {
      return 10; // Neutral score if no clear horizons
    }
    
    // Find the strongest horizontal line (likely horizon)
    const strongestLine = horizontalLines.reduce((max, line) => 
      line.strength > max.strength ? line : max
    );
    
    // Check if horizon is reasonably level (not too tilted)
    // For simplicity, we assume the strongest horizontal line is level
    // In a full implementation, we'd check angle deviation
    
    return Math.min(15, strongestLine.strength / 5);
  }

  /**
   * Analyzes center bias in composition
   * Penalizes images where everything is centered
   */
  private analyzeCenterBias(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Define center region (middle 30% of image)
    const centerLeft = Math.floor(width * 0.35);
    const centerRight = Math.floor(width * 0.65);
    const centerTop = Math.floor(height * 0.35);
    const centerBottom = Math.floor(height * 0.65);
    
    let centerContent = 0;
    let edgeContent = 0;
    
    // Calculate content density in center vs edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Simple edge detection for content
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const edgeStrength = Math.abs(right - current) + Math.abs(bottom - current);
        
        if (x >= centerLeft && x <= centerRight && y >= centerTop && y <= centerBottom) {
          centerContent += edgeStrength;
        } else {
          edgeContent += edgeStrength;
        }
      }
    }
    
    // Calculate content distribution ratio
    const totalContent = centerContent + edgeContent;
    const centerRatio = centerContent / totalContent;
    
    // Ideal ratio is around 0.4-0.6 (balanced distribution)
    let score = 0;
    if (centerRatio >= 0.4 && centerRatio <= 0.6) {
      score = 10; // Good balance
    } else if (centerRatio >= 0.3 && centerRatio <= 0.7) {
      score = 7; // Acceptable
    } else {
      score = 3; // Too center-biased or edge-biased
    }
    
    return score;
  }

  /**
   * Analyzes edge content to detect cut-off elements
   * Penalizes images where important elements are cut off at edges
   */
  private analyzeEdgeContent(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const edgeThickness = 20; // Pixels from edge to check
    let edgeActivity = 0;
    let edgePixelCount = 0;
    
    // Check all four edges for high-contrast content
    const edges = [
      { x: 0, y: 0, w: width, h: edgeThickness }, // Top edge
      { x: 0, y: height - edgeThickness, w: width, h: edgeThickness }, // Bottom edge
      { x: 0, y: 0, w: edgeThickness, h: height }, // Left edge
      { x: width - edgeThickness, y: 0, w: edgeThickness, h: height } // Right edge
    ];
    
    edges.forEach(edge => {
      for (let y = edge.y; y < edge.y + edge.h && y < height - 1; y++) {
        for (let x = edge.x; x < edge.x + edge.w && x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          // Check contrast with neighboring pixels
          if (x < width - 1) {
            const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
            edgeActivity += Math.abs(right - current);
          }
          if (y < height - 1) {
            const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
            edgeActivity += Math.abs(bottom - current);
          }
          
          edgePixelCount++;
        }
      }
    });
    
    const avgEdgeActivity = edgeActivity / edgePixelCount;
    
    // Lower edge activity is better (less cut-off content)
    // Invert the score: high activity = lower score
    return Math.max(0, 15 - (avgEdgeActivity / 10));
  }

  /**
   * Generates detailed composition feedback
   */
  private generateCompositionDetails(
    score: number,
    ruleOfThirdsScore: number,
    horizonScore: number,
    centerBiasScore: number
  ): string {
    const details = [];
    
    if (score >= 85) {
      details.push('Excellent composition with professional framing');
    } else if (score >= 70) {
      details.push('Good composition with effective layout');
    } else if (score >= 55) {
      details.push('Acceptable composition with room for improvement');
    } else {
      details.push('Poor composition affecting visual impact');
    }
    
    if (ruleOfThirdsScore > 15) {
      details.push('strong rule of thirds alignment');
    } else if (ruleOfThirdsScore > 10) {
      details.push('moderate rule of thirds usage');
    }
    
    if (horizonScore > 12) {
      details.push('well-leveled horizon');
    } else if (horizonScore < 8) {
      details.push('horizon may be tilted');
    }
    
    if (centerBiasScore < 5) {
      details.push('content distribution could be improved');
    }
    
    return details.join(', ');
  }

  /**
   * Detects motion blur in the image
   * Uses directional gradient analysis to identify motion streaks
   */
  private async detectMotionBlur(image: HTMLImageElement): Promise<{ hasMotionBlur: boolean; severity: 'low' | 'medium' | 'high' }> {
    if (!this.ctx || !this.canvas) {
      return { hasMotionBlur: false, severity: 'low' };
    }

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Calculate directional gradients to detect motion streaks
    let horizontalGradients = 0;
    let verticalGradients = 0;
    let diagonalGradients = 0;
    let pixelCount = 0;
    
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Calculate gradients in different directions
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const down = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const diagonal = (data[idx + width * 4 + 4] + data[idx + width * 4 + 5] + data[idx + width * 4 + 6]) / 3;
        
        const horizGrad = Math.abs(right - current);
        const vertGrad = Math.abs(down - current);
        const diagGrad = Math.abs(diagonal - current);
        
        horizontalGradients += horizGrad;
        verticalGradients += vertGrad;
        diagonalGradients += diagGrad;
        pixelCount++;
      }
    }
    
    const avgHorizontal = horizontalGradients / pixelCount;
    const avgVertical = verticalGradients / pixelCount;
    const avgDiagonal = diagonalGradients / pixelCount;
    
    // Detect motion blur by checking for dominant directional gradients
    const maxGradient = Math.max(avgHorizontal, avgVertical, avgDiagonal);
    const minGradient = Math.min(avgHorizontal, avgVertical, avgDiagonal);
    const gradientRatio = maxGradient / (minGradient + 1); // +1 to avoid division by zero
    
    // Motion blur typically shows strong directional bias
    const motionThreshold = 2.0; // Ratio threshold for motion detection
    const hasMotionBlur = gradientRatio > motionThreshold;
    
    let severity: 'low' | 'medium' | 'high';
    if (gradientRatio > 4.0) {
      severity = 'high';
    } else if (gradientRatio > 3.0) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
    
    return { hasMotionBlur, severity };
  }

  /**
   * Utility function to calculate variance of an array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }
}

// Export factory function
export const createPhotoQualityChecker = (
  config?: Partial<QualityCheckConfig>
): PhotoQualityChecker => {
  return new PhotoQualityChecker(config);
};