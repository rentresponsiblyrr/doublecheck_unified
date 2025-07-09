// Video Analyzer for STR Certified

import type {
  VideoAnalysisResult,
  SceneAnalysis,
  VideoTimestamp,
  KeyFrame,
  SceneType,
  DetectedObject,
  SceneQuality,
  SceneTransition,
  TechnicalIssue,
  VideoQualityMetrics
} from '@/types/video';

export class VideoAnalyzer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private frameExtractionInterval: number = 1; // seconds
  private sceneChangeThreshold: number = 0.3;
  private motionThreshold: number = 0.1;
  private previousFrame: ImageData | null = null;
  private frameBuffer: ImageData[] = [];
  private maxBufferSize: number = 10;

  constructor() {
    this.initializeCanvas();
  }

  /**
   * Extracts frames from video at regular intervals
   * @param video - Video element or file
   * @param interval - Extraction interval in seconds
   * @returns Promise<KeyFrame[]>
   */
  async extractFrames(
    video: HTMLVideoElement | File,
    interval: number = this.frameExtractionInterval
  ): Promise<KeyFrame[]> {
    const frames: KeyFrame[] = [];
    let videoElement: HTMLVideoElement;

    // Handle File input
    if (video instanceof File) {
      videoElement = await this.loadVideoFile(video);
    } else {
      videoElement = video;
    }

    const duration = videoElement.duration;
    
    // Extract frames at intervals
    for (let time = 0; time < duration; time += interval) {
      const frame = await this.extractFrameAtTime(videoElement, time);
      if (frame) {
        frames.push(frame);
      }
    }

    // Extract final frame
    const finalFrame = await this.extractFrameAtTime(videoElement, duration - 0.1);
    if (finalFrame) {
      frames.push(finalFrame);
    }

    return frames;
  }

  /**
   * Identifies scene changes in video
   * @param frames - Array of extracted frames
   * @returns SceneTransition[]
   */
  async identifySceneChanges(frames: KeyFrame[]): Promise<SceneTransition[]> {
    const transitions: SceneTransition[] = [];
    
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    for (let i = 1; i < frames.length; i++) {
      const prevFrame = frames[i - 1];
      const currFrame = frames[i];
      
      // Load frame images
      const prevImage = await this.loadImage(prevFrame.frameUrl);
      const currImage = await this.loadImage(currFrame.frameUrl);
      
      // Get image data
      this.canvas.width = prevImage.width;
      this.canvas.height = prevImage.height;
      
      this.ctx.drawImage(prevImage, 0, 0);
      const prevData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.drawImage(currImage, 0, 0);
      const currData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Calculate difference
      const difference = this.calculateFrameDifference(prevData, currData);
      
      if (difference > this.sceneChangeThreshold) {
        const transitionType = this.detectTransitionType(prevData, currData, difference);
        
        transitions.push({
          fromScene: i - 1,
          toScene: i,
          type: transitionType,
          duration: currFrame.timestamp - prevFrame.timestamp,
          smooth: transitionType !== 'cut'
        });
      }
    }

    return transitions;
  }

  /**
   * Detects room transitions in video
   * @param frames - Extracted frames
   * @param sceneChanges - Detected scene changes
   * @returns VideoTimestamp[] with room transitions
   */
  async detectRoomTransitions(
    frames: KeyFrame[],
    sceneChanges: SceneTransition[]
  ): Promise<VideoTimestamp[]> {
    const roomTransitions: VideoTimestamp[] = [];
    const significantChanges = sceneChanges.filter(t => t.type === 'cut' || t.duration > 1);

    for (const transition of significantChanges) {
      const frame = frames[transition.toScene];
      
      // Analyze frame for room features
      const roomAnalysis = await this.analyzeRoomType(frame);
      
      if (roomAnalysis.confidence > 0.7) {
        roomTransitions.push({
          id: `room_transition_${transition.toScene}`,
          time: frame.timestamp,
          sceneType: 'room_entry',
          roomDetected: roomAnalysis.roomType,
          features: roomAnalysis.features,
          description: `Entering ${roomAnalysis.roomType}`,
          thumbnail: frame.frameUrl,
          confidence: roomAnalysis.confidence * 100,
          isKeyFrame: true
        });
      }
    }

    return roomTransitions;
  }

  /**
   * Analyzes overall video quality
   * @param video - Video file or element
   * @param frames - Extracted frames
   * @returns VideoQualityMetrics
   */
  async analyzeVideoQuality(
    video: HTMLVideoElement | File,
    frames: KeyFrame[]
  ): Promise<VideoQualityMetrics> {
    // Analyze individual frame quality
    const frameQualities = await Promise.all(
      frames.map(frame => this.analyzeFrameQuality(frame))
    );

    // Calculate average metrics
    const avgSharpness = this.average(frameQualities.map(q => q.sharpness));
    const avgStability = await this.analyzeStability(frames);
    const avgLighting = this.average(frameQualities.map(q => q.lighting));
    const avgFraming = this.average(frameQualities.map(q => q.framing));

    // Detect technical issues
    const technicalIssues = this.detectTechnicalIssues(frameQualities, frames);

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(frameQualities);

    // Coverage score (mock - would analyze room coverage)
    const coverageScore = 75 + Math.random() * 20;

    // Generate recommendations
    const recommendations = this.generateQualityRecommendations(
      avgSharpness,
      avgStability,
      avgLighting,
      technicalIssues
    );

    return {
      averageQuality: (avgSharpness + avgStability + avgLighting + avgFraming) / 4,
      stabilityScore: avgStability,
      consistencyScore,
      coverageScore,
      technicalIssues,
      recommendations
    };
  }

  /**
   * Detects motion between frames
   * @param frame1 - First frame
   * @param frame2 - Second frame
   * @returns Motion score (0-1)
   */
  async detectMotion(frame1: ImageData, frame2: ImageData): Promise<number> {
    let motionPixels = 0;
    const threshold = 30; // Pixel difference threshold
    
    for (let i = 0; i < frame1.data.length; i += 4) {
      const r1 = frame1.data[i];
      const g1 = frame1.data[i + 1];
      const b1 = frame1.data[i + 2];
      
      const r2 = frame2.data[i];
      const g2 = frame2.data[i + 1];
      const b2 = frame2.data[i + 2];
      
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      
      if (diff > threshold) {
        motionPixels++;
      }
    }
    
    return motionPixels / (frame1.data.length / 4);
  }

  /**
   * Analyzes a single frame for quality metrics
   * @param frame - Frame to analyze
   * @returns SceneQuality
   */
  private async analyzeFrameQuality(frame: KeyFrame): Promise<SceneQuality> {
    // Load frame image
    const image = await this.loadImage(frame.frameUrl);
    
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    // Draw to canvas
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Analyze sharpness using edge detection
    const sharpness = this.calculateSharpness(imageData);
    
    // Analyze lighting
    const lighting = this.calculateLighting(imageData);
    
    // Analyze framing (mock - would use object detection)
    const framing = 70 + Math.random() * 25;
    
    // Mock stability (would compare with previous frames)
    const stability = 80 + Math.random() * 15;
    
    return {
      sharpness,
      stability,
      lighting,
      framing,
      overall: (sharpness + stability + lighting + framing) / 4
    };
  }

  /**
   * Calculates sharpness score using Laplacian variance
   * @param imageData - Image data to analyze
   * @returns Sharpness score (0-100)
   */
  private calculateSharpness(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    let variance = 0;
    let mean = 0;
    let count = 0;
    
    // Apply Laplacian kernel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get grayscale values
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        
        // Laplacian
        const laplacian = -4 * center + top + bottom + left + right;
        
        mean += laplacian;
        variance += laplacian * laplacian;
        count++;
      }
    }
    
    mean /= count;
    variance = variance / count - mean * mean;
    
    // Normalize to 0-100 scale
    const sharpness = Math.min(100, Math.max(0, variance / 50));
    return sharpness;
  }

  /**
   * Calculates lighting quality
   * @param imageData - Image data to analyze
   * @returns Lighting score (0-100)
   */
  private calculateLighting(imageData: ImageData): number {
    const data = imageData.data;
    let totalBrightness = 0;
    let underexposed = 0;
    let overexposed = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      
      if (brightness < 30) underexposed++;
      if (brightness > 225) overexposed++;
    }
    
    const avgBrightness = totalBrightness / (data.length / 4);
    const pixelCount = data.length / 4;
    const underexposedRatio = underexposed / pixelCount;
    const overexposedRatio = overexposed / pixelCount;
    
    // Calculate score
    let score = 100;
    
    // Penalize for poor average brightness
    if (avgBrightness < 60) score -= (60 - avgBrightness) * 0.5;
    if (avgBrightness > 200) score -= (avgBrightness - 200) * 0.5;
    
    // Penalize for extreme exposure
    score -= underexposedRatio * 100;
    score -= overexposedRatio * 100;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyzes stability across frames
   * @param frames - Array of frames to analyze
   * @returns Stability score (0-100)
   */
  private async analyzeStability(frames: KeyFrame[]): Promise<number> {
    if (frames.length < 2) return 100;
    
    let totalMotion = 0;
    let comparisons = 0;
    
    // Sample pairs of frames
    for (let i = 1; i < Math.min(frames.length, 10); i++) {
      const prev = await this.loadFrameData(frames[i - 1]);
      const curr = await this.loadFrameData(frames[i]);
      
      if (prev && curr) {
        const motion = await this.detectMotion(prev, curr);
        totalMotion += motion;
        comparisons++;
      }
    }
    
    if (comparisons === 0) return 100;
    
    const avgMotion = totalMotion / comparisons;
    // Convert motion to stability score (less motion = more stable)
    return Math.max(0, Math.min(100, (1 - avgMotion * 5) * 100));
  }

  /**
   * Calculates frame difference for scene detection
   * @param frame1 - First frame
   * @param frame2 - Second frame
   * @returns Difference score (0-1)
   */
  private calculateFrameDifference(frame1: ImageData, frame2: ImageData): number {
    let totalDiff = 0;
    const pixels = frame1.data.length / 4;
    
    for (let i = 0; i < frame1.data.length; i += 4) {
      const r1 = frame1.data[i];
      const g1 = frame1.data[i + 1];
      const b1 = frame1.data[i + 2];
      
      const r2 = frame2.data[i];
      const g2 = frame2.data[i + 1];
      const b2 = frame2.data[i + 2];
      
      const pixelDiff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / 3;
      totalDiff += pixelDiff / 255;
    }
    
    return totalDiff / pixels;
  }

  /**
   * Detects the type of transition between frames
   * @param prevFrame - Previous frame data
   * @param currFrame - Current frame data
   * @param difference - Calculated difference
   * @returns Transition type
   */
  private detectTransitionType(
    prevFrame: ImageData,
    currFrame: ImageData,
    difference: number
  ): 'cut' | 'pan' | 'zoom' | 'fade' {
    // High difference indicates a cut
    if (difference > 0.5) return 'cut';
    
    // Analyze for specific transition types
    // This is simplified - real implementation would be more sophisticated
    
    // Check for fade (gradual brightness change)
    const prevBrightness = this.getAverageBrightness(prevFrame);
    const currBrightness = this.getAverageBrightness(currFrame);
    const brightnessDiff = Math.abs(prevBrightness - currBrightness);
    
    if (brightnessDiff > 50 && difference < 0.3) return 'fade';
    
    // Default to pan for smooth transitions
    return 'pan';
  }

  /**
   * Analyzes frame to detect room type
   * @param frame - Frame to analyze
   * @returns Room analysis result
   */
  private async analyzeRoomType(frame: KeyFrame): Promise<{
    roomType: string;
    features: string[];
    confidence: number;
  }> {
    // Mock room detection - in production would use AI
    const rooms = ['bedroom', 'bathroom', 'kitchen', 'living-room', 'exterior'];
    const roomFeatures: Record<string, string[]> = {
      bedroom: ['bed', 'nightstand', 'dresser', 'closet'],
      bathroom: ['toilet', 'sink', 'shower', 'mirror'],
      kitchen: ['stove', 'refrigerator', 'sink', 'cabinets'],
      'living-room': ['sofa', 'tv', 'coffee-table', 'chairs'],
      exterior: ['door', 'windows', 'lawn', 'driveway']
    };
    
    const detectedRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const features = roomFeatures[detectedRoom].filter(() => Math.random() > 0.5);
    
    return {
      roomType: detectedRoom,
      features,
      confidence: 0.7 + Math.random() * 0.25
    };
  }

  /**
   * Detects technical issues in video
   * @param frameQualities - Quality metrics for each frame
   * @param frames - Video frames
   * @returns Array of technical issues
   */
  private detectTechnicalIssues(
    frameQualities: SceneQuality[],
    frames: KeyFrame[]
  ): TechnicalIssue[] {
    const issues: TechnicalIssue[] = [];
    
    // Check for consistently poor sharpness
    const avgSharpness = this.average(frameQualities.map(q => q.sharpness));
    if (avgSharpness < 50) {
      issues.push({
        type: 'blurry',
        severity: avgSharpness < 30 ? 'high' : 'medium',
        timestamp: 0,
        duration: frames[frames.length - 1].timestamp,
        description: 'Video is consistently blurry or out of focus'
      });
    }
    
    // Check for poor lighting
    const avgLighting = this.average(frameQualities.map(q => q.lighting));
    if (avgLighting < 60) {
      issues.push({
        type: 'dark',
        severity: avgLighting < 40 ? 'high' : 'medium',
        timestamp: 0,
        duration: frames[frames.length - 1].timestamp,
        description: 'Video has poor lighting throughout'
      });
    }
    
    // Check for instability
    const avgStability = this.average(frameQualities.map(q => q.stability));
    if (avgStability < 70) {
      issues.push({
        type: 'shaky',
        severity: avgStability < 50 ? 'high' : 'medium',
        timestamp: 0,
        duration: frames[frames.length - 1].timestamp,
        description: 'Video is too shaky or unstable'
      });
    }
    
    return issues;
  }

  /**
   * Calculates consistency score
   * @param frameQualities - Quality metrics for each frame
   * @returns Consistency score (0-100)
   */
  private calculateConsistencyScore(frameQualities: SceneQuality[]): number {
    if (frameQualities.length < 2) return 100;
    
    // Calculate variance for each metric
    const sharpnessVar = this.variance(frameQualities.map(q => q.sharpness));
    const lightingVar = this.variance(frameQualities.map(q => q.lighting));
    const framingVar = this.variance(frameQualities.map(q => q.framing));
    
    // Lower variance = higher consistency
    const avgVariance = (sharpnessVar + lightingVar + framingVar) / 3;
    return Math.max(0, Math.min(100, 100 - avgVariance));
  }

  /**
   * Generates quality improvement recommendations
   * @param sharpness - Average sharpness score
   * @param stability - Average stability score
   * @param lighting - Average lighting score
   * @param issues - Detected technical issues
   * @returns Array of recommendations
   */
  private generateQualityRecommendations(
    sharpness: number,
    stability: number,
    lighting: number,
    issues: TechnicalIssue[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (sharpness < 70) {
      recommendations.push('Ensure camera lens is clean and use tap-to-focus feature');
    }
    
    if (stability < 70) {
      recommendations.push('Use a gimbal or stabilizer for smoother footage');
      recommendations.push('Walk slowly and avoid sudden movements');
    }
    
    if (lighting < 70) {
      recommendations.push('Turn on all lights before recording');
      recommendations.push('Open curtains for natural lighting');
      recommendations.push('Avoid recording against bright windows');
    }
    
    if (issues.some(i => i.type === 'framerate')) {
      recommendations.push('Close other apps to improve recording performance');
    }
    
    return recommendations;
  }

  // Utility methods

  private initializeCanvas(): void {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  private async loadVideoFile(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
    });
  }

  private async extractFrameAtTime(
    video: HTMLVideoElement,
    time: number
  ): Promise<KeyFrame | null> {
    return new Promise((resolve) => {
      video.currentTime = time;
      
      video.onseeked = () => {
        if (!this.canvas || !this.ctx) {
          resolve(null);
          return;
        }
        
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        this.ctx.drawImage(video, 0, 0);
        
        const frameUrl = this.canvas.toDataURL('image/jpeg', 0.8);
        const quality = 70 + Math.random() * 25; // Mock quality
        
        resolve({
          timestamp: time,
          frameUrl,
          quality,
          isRepresentative: Math.random() > 0.5,
          features: []
        });
      };
    });
  }

  private async loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private async loadFrameData(frame: KeyFrame): Promise<ImageData | null> {
    try {
      const img = await this.loadImage(frame.frameUrl);
      
      if (!this.canvas || !this.ctx) return null;
      
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);
      
      return this.ctx.getImageData(0, 0, img.width, img.height);
    } catch {
      return null;
    }
  }

  private getAverageBrightness(imageData: ImageData): number {
    let total = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      total += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
    }
    return total / (imageData.data.length / 4);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    return this.average(values.map(v => Math.pow(v - avg, 2)));
  }
}

// Export factory function
export const createVideoAnalyzer = (): VideoAnalyzer => {
  return new VideoAnalyzer();
};