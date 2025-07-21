// Video Processor for STR Certified Walkthrough Videos

import type {
  VideoRecording,
  VideoTimestamp,
  VideoAnalysisResult,
  SceneAnalysis,
  VideoQuality,
  VideoProcessingConfig,
  VideoRecordingConfig,
  KeyFrame,
  SceneType,
  VideoStatus,
  VideoRecordingStats,
  RoomSequence,
  VideoIssue
} from '@/types/video';

export class VideoProcessor {
  private config: VideoProcessingConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTime: number = 0;
  private frameExtractionWorker: Worker | null = null;
  private analysisAbortController: AbortController | null = null;

  constructor(config: Partial<VideoProcessingConfig> = {}) {
    this.config = {
      extractFrameInterval: 2, // Extract frame every 2 seconds
      keyFrameQualityThreshold: 75,
      sceneChangeThreshold: 0.3,
      maxProcessingTime: 300, // 5 minutes
      enableAudioAnalysis: true,
      targetFrameRate: 30,
      compressionQuality: 0.85,
      ...config
    };

    // Initialize frame extraction worker if available
    if (typeof Worker !== 'undefined') {
      // In production, this would be a separate worker file
      // For now, we'll use inline worker simulation
    }
  }

  /**
   * Records a property walkthrough video
   * @param stream - MediaStream from camera
   * @param config - Recording configuration
   * @returns Promise<VideoRecording>
   */
  async recordWalkthrough(
    stream: MediaStream,
    recordingConfig: VideoRecordingConfig,
    onStats?: (stats: VideoRecordingStats) => void
  ): Promise<VideoRecording> {
    return new Promise((resolve, reject) => {
      try {
        // Reset state
        this.recordedChunks = [];
        this.startTime = Date.now();
        this.pausedDuration = 0;

        // Configure MediaRecorder
        const mimeType = this.getSupportedMimeType();
        const options: MediaRecorderOptions = {
          mimeType,
          videoBitsPerSecond: recordingConfig.targetBitrate * 1000,
        };

        this.mediaRecorder = new MediaRecorder(stream, options);
        
        // Stats tracking
        let frameCount = 0;
        const lastStatsUpdate = Date.now();
        const statsInterval = setInterval(() => {
          if (this.mediaRecorder?.state === 'recording') {
            frameCount++;
            const duration = this.getRecordingDuration();
            const fileSize = this.recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0);
            
            const stats: VideoRecordingStats = {
              duration,
              fileSize,
              framesRecorded: frameCount,
              droppedFrames: 0, // Would need actual frame analysis
              averageFps: frameCount / (duration || 1),
              storageUsed: fileSize,
              storageAvailable: this.getAvailableStorage(),
              batteryLevel: this.getBatteryLevel()
            };
            
            onStats?.(stats);
          }
        }, 1000);

        // Handle data available
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        // Handle recording stop
        this.mediaRecorder.onstop = async () => {
          clearInterval(statsInterval);
          
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const duration = this.getRecordingDuration();
          
          // Create video file
          const file = new File([blob], `walkthrough_${Date.now()}.webm`, {
            type: mimeType,
            lastModified: Date.now()
          });

          // Extract video metadata
          const quality = await this.analyzeVideoQuality(file);
          const resolution = await this.getVideoResolution(file);

          const recording: VideoRecording = {
            id: `video_${Date.now()}`,
            propertyId: '',
            inspectorId: '',
            file,
            duration,
            size: file.size,
            format: mimeType,
            resolution,
            quality,
            timestamps: [],
            metadata: {
              deviceInfo: {
                model: navigator.userAgent,
                os: this.getOperatingSystem()
              },
              propertyDetails: {
                address: '',
                propertyType: 'residential'
              },
              recordingConditions: {
                lighting: 'indoor',
                timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon'
              },
              inspectionType: 'standard'
            },
            status: 'stopped',
            createdAt: new Date()
          };

          resolve(recording);
        };

        // Handle errors
        this.mediaRecorder.onerror = (event: MediaRecorderErrorEvent) => {
          clearInterval(statsInterval);
          reject(new Error(`Recording error: ${event.error?.message || 'Unknown recording error'}`));
        };

        // Start recording
        this.mediaRecorder.start(1000); // Collect data every second
        
        // Auto-stop after max duration
        setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            this.stopRecording();
          }
        }, recordingConfig.maxDuration * 1000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Processes video frames to extract key moments
   * @param video - Video file or blob
   * @returns Promise<VideoTimestamp[]>
   */
  async processVideoFrames(video: File | Blob): Promise<VideoTimestamp[]> {
    const timestamps: VideoTimestamp[] = [];
    const videoUrl = URL.createObjectURL(video);
    
    try {
      const videoElement = document.createElement('video');
      videoElement.src = videoUrl;
      videoElement.muted = true;
      
      // Wait for metadata
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });

      const duration = videoElement.duration;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Failed to get canvas context');

      // Set canvas size
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      let previousFrame: ImageData | null = null;
      let sceneStartTime = 0;

      // Process frames at intervals
      for (let time = 0; time < duration; time += this.config.extractFrameInterval) {
        videoElement.currentTime = time;
        
        await new Promise((resolve) => {
          videoElement.onseeked = resolve;
        });

        // Draw frame to canvas
        ctx.drawImage(videoElement, 0, 0);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Detect scene changes
        const isSceneChange = previousFrame 
          ? this.detectSceneChange(previousFrame, currentFrame) 
          : true;

        if (isSceneChange) {
          // Extract thumbnail
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          
          // Analyze frame content
          const analysis = await this.analyzeFrame(currentFrame, canvas);
          
          const timestamp: VideoTimestamp = {
            id: `ts_${time}_${Date.now()}`,
            time,
            sceneType: analysis.sceneType,
            roomDetected: analysis.roomType,
            features: analysis.features,
            description: analysis.description,
            thumbnail,
            confidence: analysis.confidence,
            isKeyFrame: analysis.isKeyFrame,
            annotations: []
          };
          
          timestamps.push(timestamp);
          sceneStartTime = time;
        }

        previousFrame = currentFrame;
      }

      return timestamps;

    } finally {
      URL.revokeObjectURL(videoUrl);
    }
  }

  /**
   * Analyzes video content using AI to identify rooms and features
   * @param video - Video file
   * @param timestamps - Extracted timestamps
   * @returns Promise<VideoAnalysisResult>
   */
  async analyzeVideoContent(
    video: File | Blob,
    timestamps: VideoTimestamp[]
  ): Promise<VideoAnalysisResult> {
    const startTime = performance.now();
    
    // Create abort controller for cancellation
    this.analysisAbortController = new AbortController();

    try {
      // Mock AI analysis - in production, this would call AI services
      await this.simulateProcessing(2000);

      // Group timestamps into scenes
      const scenes = this.groupTimestampsIntoScenes(timestamps);
      
      // Analyze room sequence
      const roomSequence = this.analyzeRoomSequence(scenes);
      
      // Detect features across video
      const featureDetection = this.detectVideoFeatures(timestamps);
      
      // Calculate quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(video, timestamps);
      
      // Identify issues
      const issues = this.identifyVideoIssues(scenes, roomSequence, qualityMetrics);
      
      // Generate summary
      const summary = this.generateAnalysisSummary(scenes, roomSequence, qualityMetrics, issues);

      const result: VideoAnalysisResult = {
        videoId: `analysis_${Date.now()}`,
        scenes,
        qualityMetrics,
        featureDetection,
        roomSequence,
        issues,
        summary,
        processingTime: performance.now() - startTime,
        aiConfidence: 85 + Math.random() * 10
      };

      return result;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Analysis cancelled');
      }
      throw error;
    } finally {
      this.analysisAbortController = null;
    }
  }

  /**
   * Generates navigation timestamps for video playback
   * @param analysis - Video analysis result
   * @returns VideoTimestamp[] with navigation markers
   */
  generateTimestamps(analysis: VideoAnalysisResult): VideoTimestamp[] {
    const navigationTimestamps: VideoTimestamp[] = [];

    // Add room entry timestamps
    analysis.roomSequence.forEach((room, index) => {
      navigationTimestamps.push({
        id: `nav_room_${index}`,
        time: room.startTime,
        sceneType: 'room_entry',
        roomDetected: room.roomType,
        features: [],
        description: `${room.roomType} - Entry`,
        confidence: 90,
        isKeyFrame: true
      });

      // Add key moments within room
      room.keyMoments.forEach((moment) => {
        navigationTimestamps.push({
          ...moment,
          id: `nav_moment_${index}_${moment.time}`,
          description: `${room.roomType} - ${moment.description}`
        });
      });
    });

    // Add issue timestamps
    analysis.issues.forEach((issue, index) => {
      issue.affectedTimestamps.forEach((time) => {
        navigationTimestamps.push({
          id: `nav_issue_${index}_${time}`,
          time,
          sceneType: 'issue_documentation',
          features: [issue.type],
          description: issue.description,
          confidence: 80,
          isKeyFrame: true,
          annotations: [{
            type: 'text',
            content: issue.description,
            position: { x: 10, y: 10 },
            style: {
              color: issue.severity === 'high' ? '#ff0000' : '#ffaa00',
              fontSize: 16
            }
          }]
        });
      });
    });

    // Sort by time
    return navigationTimestamps.sort((a, b) => a.time - b.time);
  }

  // Control methods

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.lastPauseTime = Date.now();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.pausedDuration += Date.now() - this.lastPauseTime;
      this.mediaRecorder.resume();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && 
        (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
      this.mediaRecorder.stop();
    }
  }

  cancelAnalysis(): void {
    if (this.analysisAbortController) {
      this.analysisAbortController.abort();
    }
  }

  // Private helper methods

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  private getRecordingDuration(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime - this.pausedDuration) / 1000;
  }

  private async analyzeVideoQuality(video: File): Promise<VideoQuality> {
    // Mock quality analysis
    await this.simulateProcessing(500);
    
    return {
      overall: 75 + Math.random() * 20,
      stability: 80 + Math.random() * 15,
      brightness: 70 + Math.random() * 25,
      focus: 85 + Math.random() * 10,
      audioQuality: 90 + Math.random() * 10,
      bitrate: 2500 + Math.random() * 1500,
      fps: 29 + Math.random() * 2
    };
  }

  private async getVideoResolution(video: File): Promise<{
    width: number;
    height: number;
    aspectRatio: string;
  }> {
    return new Promise((resolve) => {
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(video);
      
      videoElement.onloadedmetadata = () => {
        resolve({
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
          aspectRatio: `${videoElement.videoWidth}:${videoElement.videoHeight}`
        });
        URL.revokeObjectURL(videoElement.src);
      };
    });
  }

  private detectSceneChange(prev: ImageData, current: ImageData): boolean {
    // Simple scene change detection using pixel difference
    let diff = 0;
    const pixels = prev.data.length / 4;
    
    for (let i = 0; i < prev.data.length; i += 4) {
      const dr = Math.abs(prev.data[i] - current.data[i]);
      const dg = Math.abs(prev.data[i + 1] - current.data[i + 1]);
      const db = Math.abs(prev.data[i + 2] - current.data[i + 2]);
      
      diff += (dr + dg + db) / 3;
    }
    
    const averageDiff = diff / pixels / 255;
    return averageDiff > this.config.sceneChangeThreshold;
  }

  private async analyzeFrame(frame: ImageData, canvas: HTMLCanvasElement): Promise<{
    sceneType: SceneType;
    roomType: string;
    features: string[];
    description: string;
    confidence: number;
    isKeyFrame: boolean;
  }> {
    // Mock frame analysis - in production, this would use AI
    await this.simulateProcessing(100);
    
    const sceneTypes: SceneType[] = [
      'room_overview', 'detail_shot', 'amenity_focus', 'transition'
    ];
    const roomTypes = ['bedroom', 'bathroom', 'kitchen', 'living-room', 'exterior'];
    const features = ['bed', 'tv', 'window', 'door', 'furniture', 'appliances'];
    
    return {
      sceneType: sceneTypes[Math.floor(Math.random() * sceneTypes.length)],
      roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      features: features.filter(() => Math.random() > 0.7),
      description: 'Automated scene detection',
      confidence: 70 + Math.random() * 25,
      isKeyFrame: Math.random() > 0.6
    };
  }

  private groupTimestampsIntoScenes(timestamps: VideoTimestamp[]): SceneAnalysis[] {
    const scenes: SceneAnalysis[] = [];
    let currentScene: SceneAnalysis | null = null;

    timestamps.forEach((ts, index) => {
      if (!currentScene || ts.sceneType !== currentScene.sceneType) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        
        currentScene = {
          startTime: ts.time,
          endTime: ts.time,
          sceneType: ts.sceneType,
          roomType: ts.roomDetected,
          keyFrames: [],
          objects: [],
          quality: {
            sharpness: 80 + Math.random() * 15,
            stability: 75 + Math.random() * 20,
            lighting: 70 + Math.random() * 25,
            framing: 85 + Math.random() * 10,
            overall: 78 + Math.random() * 17
          },
          transitions: []
        };
      }
      
      if (currentScene) {
        currentScene.endTime = ts.time;
        if (ts.isKeyFrame && ts.thumbnail) {
          currentScene.keyFrames.push({
            timestamp: ts.time,
            frameUrl: ts.thumbnail,
            quality: 85 + Math.random() * 10,
            isRepresentative: ts.isKeyFrame,
            features: ts.features
          });
        }
      }
    });

    if (currentScene) {
      scenes.push(currentScene);
    }

    return scenes;
  }

  private analyzeRoomSequence(scenes: SceneAnalysis[]): RoomSequence[] {
    const roomMap = new Map<string, RoomSequence>();
    
    scenes.forEach((scene) => {
      if (scene.roomType) {
        const existing = roomMap.get(scene.roomType);
        
        if (existing) {
          existing.endTime = scene.endTime;
          existing.keyMoments.push(...scene.keyFrames.map(kf => ({
            id: `moment_${kf.timestamp}`,
            time: kf.timestamp,
            sceneType: scene.sceneType,
            roomDetected: scene.roomType,
            features: kf.features,
            description: 'Key moment',
            thumbnail: kf.frameUrl,
            confidence: kf.quality,
            isKeyFrame: true
          })));
        } else {
          roomMap.set(scene.roomType, {
            roomId: `room_${scene.roomType}_${Date.now()}`,
            roomType: scene.roomType,
            startTime: scene.startTime,
            endTime: scene.endTime,
            coverage: 'partial',
            keyMoments: []
          });
        }
      }
    });

    return Array.from(roomMap.values());
  }

  private detectVideoFeatures(timestamps: VideoTimestamp[]): Array<{
    feature: string;
    detected: boolean;
    confidence: number;
    timestamps: number[];
    evidence: string[];
  }> {
    const featureMap = new Map<string, {
      feature: string;
      detected: boolean;
      confidence: number;
      timestamps: number[];
      evidence: string[];
    }>();
    
    timestamps.forEach((ts) => {
      ts.features.forEach((feature) => {
        if (!featureMap.has(feature)) {
          featureMap.set(feature, {
            feature,
            detected: true,
            confidence: 80 + Math.random() * 15,
            timestamps: [ts.time],
            evidence: [`Detected at ${ts.time}s`]
          });
        } else {
          featureMap.get(feature).timestamps.push(ts.time);
        }
      });
    });

    return Array.from(featureMap.values());
  }

  private async calculateQualityMetrics(video: File, timestamps: VideoTimestamp[]): Promise<{
    averageQuality: number;
    stabilityScore: number;
    consistencyScore: number;
    coverageScore: number;
    technicalIssues: string[];
    recommendations: string[];
  }> {
    await this.simulateProcessing(1000);
    
    return {
      averageQuality: 78 + Math.random() * 15,
      stabilityScore: 82 + Math.random() * 12,
      consistencyScore: 85 + Math.random() * 10,
      coverageScore: 75 + Math.random() * 20,
      technicalIssues: [],
      recommendations: [
        'Consider using a gimbal for smoother footage',
        'Ensure all rooms are well-lit before recording',
        'Take time to focus on key features'
      ]
    };
  }

  private identifyVideoIssues(
    scenes: SceneAnalysis[],
    roomSequence: RoomSequence[],
    qualityMetrics: {
      averageQuality: number;
      stabilityScore: number;
      consistencyScore: number;
      coverageScore: number;
      technicalIssues: string[];
      recommendations: string[];
    }
  ): VideoIssue[] {
    const issues: VideoIssue[] = [];
    
    // Check for quality issues
    if (qualityMetrics.averageQuality < 70) {
      issues.push({
        type: 'poor_quality',
        severity: 'medium',
        description: 'Overall video quality is below acceptable threshold',
        affectedTimestamps: scenes.map(s => s.startTime),
        suggestedAction: 'Re-record with better lighting and stability'
      });
    }
    
    // Check for missing rooms (mock)
    const expectedRooms = ['bedroom', 'bathroom', 'kitchen', 'living-room'];
    const coveredRooms = roomSequence.map(r => r.roomType);
    const missingRooms = expectedRooms.filter(r => !coveredRooms.includes(r));
    
    if (missingRooms.length > 0) {
      issues.push({
        type: 'missing_room',
        severity: 'high',
        description: `Missing coverage for: ${missingRooms.join(', ')}`,
        affectedTimestamps: [],
        suggestedAction: 'Record additional footage of missing areas'
      });
    }

    return issues;
  }

  private generateAnalysisSummary(
    scenes: SceneAnalysis[],
    roomSequence: RoomSequence[],
    qualityMetrics: {
      averageQuality: number;
      stabilityScore: number;
      consistencyScore: number;
      coverageScore: number;
      technicalIssues: string[];
      recommendations: string[];
    },
    issues: VideoIssue[]
  ): {
    totalDuration: number;
    roomsCovered: string[];
    roomsMissing: string[];
    overallQuality: number;
    keyFindings: string[];
    recommendedActions: string[];
    readyForSubmission: boolean;
  } {
    const totalDuration = scenes[scenes.length - 1]?.endTime || 0;
    const roomsCovered = roomSequence.map(r => r.roomType);
    const expectedRooms = ['bedroom', 'bathroom', 'kitchen', 'living-room'];
    const roomsMissing = expectedRooms.filter(r => !roomsCovered.includes(r));
    
    return {
      totalDuration,
      roomsCovered,
      roomsMissing,
      overallQuality: qualityMetrics.averageQuality,
      keyFindings: [
        `Recorded ${scenes.length} scenes across ${roomsCovered.length} rooms`,
        `Average quality score: ${Math.round(qualityMetrics.averageQuality)}%`,
        issues.length > 0 ? `${issues.length} issues identified` : 'No major issues found'
      ],
      recommendedActions: qualityMetrics.recommendations,
      readyForSubmission: issues.filter(i => i.severity === 'high').length === 0
    };
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getAvailableStorage(): number {
    // Mock storage - in production, use navigator.storage.estimate()
    return 5 * 1024 * 1024 * 1024; // 5GB
  }

  private getBatteryLevel(): number | undefined {
    // Mock battery - in production, use Battery API
    return 75 + Math.random() * 25;
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export factory function
export const createVideoProcessor = (
  config?: Partial<VideoProcessingConfig>
): VideoProcessor => {
  return new VideoProcessor(config);
};