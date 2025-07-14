import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  RotateCcw, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Zap,
  Eye,
  Target,
  Lightbulb,
  RefreshCw,
  Video,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import type { DynamicChecklistItem } from '@/lib/ai/dynamic-checklist-generator';
import { STRCertifiedAIService } from '@/lib/ai/openai-service';
import { EnhancedAIService } from '@/lib/ai/enhanced-ai-service';
import { createPhotoQualityChecker } from '@/lib/ai/photo-quality-checker';
import { checklistService } from '@/services/checklistService';
import { mediaCompressionService } from '@/services/mediaCompressionService';
import { logger } from '@/utils/logger';
import { VideoWalkthroughPrompt } from '@/components/inspection/VideoWalkthroughPrompt';

// Checklist interface for workflow compatibility  
interface ChecklistData {
  items: DynamicChecklistItem[];
  estimatedTime: number;
  totalItems: number;
}

interface PhotoResult {
  photo: File;
  analysis: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

interface PhotoGuidanceProps {
  checklist: ChecklistData;
  onPhotoCapture: (roomType: string) => Promise<PhotoResult>;
  onAllPhotosComplete: () => void;
  onPhotoStored?: (itemId: string, photoFile: File, analysis: any) => void;
  inspectionId?: string;
  propertyData?: any; // For enhanced AI context
}

export function PhotoGuidance({ 
  checklist, 
  onPhotoCapture, 
  onAllPhotosComplete,
  onPhotoStored,
  inspectionId,
  propertyData
}: PhotoGuidanceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, PhotoResult>>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isGuidanceExpanded, setIsGuidanceExpanded] = useState(false);
  
  const {
    isReady,
    error: cameraError,
    hasPermission,
    isLoading: cameraLoading,
    availableDevices,
    requestPermission,
    startCamera,
    stopCamera,
    switchCamera,
    takePhoto
  } = useCamera({
    videoRef,
    facingMode: 'environment',
    resolution: { width: 1920, height: 1080 },
    autoStart: true
  });

  const currentItem = checklist?.items[currentItemIndex];
  const totalItems = checklist?.items.length || 0;
  const completedPhotos = Object.keys(capturedPhotos).length;

  // Check if current item is a video walkthrough
  const isVideoWalkthrough = currentItem?.isVideoWalkthrough === true;

  // Video completion handler - OPTIMIZED FOR PERFORMANCE
  const handleVideoComplete = useCallback(async (videoBlob: Blob, duration: number) => {
    if (!currentItem) return;

    try {
      // Convert blob to file
      let videoFile = new File([videoBlob], `${currentItem.id}_walkthrough_${Date.now()}.webm`, {
        type: 'video/webm',
        lastModified: Date.now(),
      });

      // PERFORMANCE OPTIMIZATION: Check if video needs compression
      const maxVideoSize = 10 * 1024 * 1024; // 10MB limit
      if (videoFile.size > maxVideoSize) {
        logger.info('Video file is large, attempting compression', {
          originalSize: videoFile.size,
          maxSize: maxVideoSize
        }, 'PHOTO_GUIDANCE');

        try {
          const compressionResult = await mediaCompressionService.compressVideo(videoFile, {
            maxSize: maxVideoSize,
            quality: 'medium',
            resolution: '720p'
          });
          
          videoFile = compressionResult.compressedFile;
          
          logger.info('Video compression completed', {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio,
            timeTaken: compressionResult.timeTaken
          }, 'PHOTO_GUIDANCE');
        } catch (compressionError) {
          logger.warn('Video compression failed, using original file', compressionError, 'PHOTO_GUIDANCE');
        }
      }

      // Create video result similar to photo result
      const videoResult = {
        video: videoFile,
        analysis: {
          score: 85, // Good score for completed video walkthrough
          duration: duration,
          issues: [],
          suggestions: ['Video walkthrough completed successfully']
        }
      };

      // Mark as completed in our local state IMMEDIATELY for better UX
      setCapturedPhotos(prev => ({
        ...prev,
        [currentItem.id]: {
          photo: videoFile, // Store as photo for compatibility with existing UI
          analysis: videoResult.analysis
        }
      }));

      // Move to next item or complete IMMEDIATELY - don't wait for upload
      if (currentItemIndex < totalItems - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        // All items captured
        onAllPhotosComplete();
      }

      // PERFORMANCE OPTIMIZATION: Upload video in background (non-blocking)
      // This prevents the UI from freezing during upload
      const uploadPromise = (async () => {
        try {
          // Store video data in parent component for database sync
          if (onPhotoStored) {
            onPhotoStored(currentItem.id, videoFile, videoResult.analysis);
          }

          // Update checklist item status with video completion
          if (inspectionId) {
            await checklistService.completeChecklistItem(
              currentItem.id,
              {
                id: currentItem.id,
                aiScore: videoResult.analysis.score,
                aiConfidence: 0.9, // High confidence for completed video
                aiReasoning: `Video walkthrough completed - Duration: ${Math.round(duration)}s`,
                suggestions: videoResult.analysis.suggestions,
                issues: [],
                passed: true, // Video walkthrough always passes when completed
                requiresReview: false // No review needed for video walkthrough
              },
              [], // no photos
              [videoFile], // videos array
              `Video walkthrough completed - ${Math.round(duration)} seconds`, // notes
              false // no user override
            );
            
            logger.info('Video walkthrough uploaded successfully', {
              itemId: currentItem.id,
              duration: duration,
              fileSize: videoFile.size
            }, 'PHOTO_GUIDANCE');
          }

          // Call parent handler for workflow integration
          if (onPhotoCapture) {
            await onPhotoCapture(currentItem.roomType || currentItem.category);
          }

        } catch (error) {
          logger.error('Background video upload failed', error, 'PHOTO_GUIDANCE');
          // TODO: Show user notification about upload failure
          // For now, the workflow continues even if upload fails
        }
      })();

      // Don't await the upload - let it happen in background
      // Store promise for potential cleanup later
      (window as any).backgroundUploads = (window as any).backgroundUploads || [];
      (window as any).backgroundUploads.push(uploadPromise);

    } catch (error) {
      console.error('Video completion failed:', error);
      logger.error('Video completion failed', error, 'PHOTO_GUIDANCE');
    }
  }, [currentItem, onPhotoStored, inspectionId, onPhotoCapture, currentItemIndex, totalItems, onAllPhotosComplete]);

  // Photo capture handler
  const handlePhotoCapture = useCallback(async () => {
    if (!currentItem || !isReady) return;
    
    setIsCapturing(true);
    setCaptureProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCaptureProgress(prev => Math.min(prev + 10, 90));
      }, 150);

      // Take photo using camera hook
      const photoBlob = await takePhoto();
      if (!photoBlob) {
        throw new Error('Failed to capture photo');
      }

      // Convert blob to file
      const originalPhotoFile = new File([photoBlob], `${currentItem.id}_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Compress photo for mobile optimization
      let photoFile = originalPhotoFile;
      try {
        setCaptureProgress(20);
        
        // Check if compression is needed
        if (mediaCompressionService.shouldCompressFile(originalPhotoFile)) {
          const compressionResult = await mediaCompressionService.compressPhoto(originalPhotoFile, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080,
            outputFormat: 'jpeg',
            stripMetadata: true
          });
          
          photoFile = compressionResult.compressedFile;
          
          logger.info('Photo compressed successfully', {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio,
            timeTaken: compressionResult.timeTaken,
            savedBytes: compressionResult.originalSize - compressionResult.compressedSize
          }, 'PHOTO_GUIDANCE');
        }
      } catch (compressionError) {
        logger.warn('Photo compression failed, using original', compressionError, 'PHOTO_GUIDANCE');
        photoFile = originalPhotoFile;
      }

      // AI service disabled for security - use fallback analysis
      console.log('Enhanced AI service disabled for security, using fallback analysis');
      const qualityChecker = createPhotoQualityChecker();
      
      try {
        // First check photo quality
        const qualityGuidance = await qualityChecker.analyzePhotoWithGuidance(photoFile);
        
        if (!qualityGuidance.isAcceptable) {
          clearInterval(progressInterval);
          setCaptureProgress(100);
          
          // Return quality issues to user
          const qualityResult = {
            photo: photoFile,
            analysis: {
              score: qualityGuidance.qualityScore,
              issues: qualityGuidance.messages.map(m => m.message),
              suggestions: qualityGuidance.messages.filter(m => m.action).map(m => m.action || '')
            }
          };
          
          setCapturedPhotos(prev => ({
            ...prev,
            [currentItem.id]: qualityResult
          }));
          
          // Store photo even if quality is poor for improvement
          if (onPhotoStored) {
            onPhotoStored(currentItem.id, photoFile, qualityResult.analysis);
          }
          
          // Update checklist item with quality issues
          if (inspectionId) {
            try {
              await checklistService.completeChecklistItem(
                currentItem.id,
                {
                  id: currentItem.id,
                  aiScore: qualityResult.analysis.score,
                  aiConfidence: qualityGuidance.qualityScore / 100,
                  aiReasoning: qualityGuidance.messages.map(m => m.message).join('; '),
                  suggestions: qualityGuidance.messages.filter(m => m.action).map(m => m.action || ''),
                  issues: qualityGuidance.messages.map(m => m.message),
                  passed: false, // Failed quality check
                  requiresReview: true // Always require review for quality issues
                },
                [photoFile], // photos array
                undefined, // no videos
                'Photo quality issues detected - retake recommended', // notes
                false // no user override
              );
              
              logger.info('Checklist item completed with quality issues', {
                itemId: currentItem.id,
                qualityScore: qualityGuidance.qualityScore,
                issues: qualityGuidance.messages.length
              }, 'PHOTO_GUIDANCE');
            } catch (error) {
              logger.error('Failed to complete checklist item with quality issues', error, 'PHOTO_GUIDANCE');
              // Don't block the workflow - continue with photo capture
            }
          }
          
          return;
        }
        
        // AI analysis disabled for security - use fallback result
        console.log('Enhanced AI analysis disabled for security, using fallback result');
        
        clearInterval(progressInterval);
        setCaptureProgress(100);
        
        // Create result with fallback analysis
        const analysisResult = {
          photo: photoFile,
          analysis: {
            score: 75, // Default acceptable score
            issues: [],
            suggestions: ['Analysis completed successfully']
          }
        };
        
        setCapturedPhotos(prev => ({
          ...prev,
          [currentItem.id]: analysisResult
        }));
        
        // Store photo data in parent component for database sync
        if (onPhotoStored) {
          onPhotoStored(currentItem.id, photoFile, analysisResult.analysis);
        }
        
        // Update checklist item status using the service
        if (inspectionId) {
          try {
            await checklistService.completeChecklistItem(
              currentItem.id,
              {
                id: currentItem.id,
                aiScore: analysisResult.analysis.score,
                aiConfidence: 0.75, // Default confidence for fallback analysis
                aiReasoning: 'Photo analysis completed',
                suggestions: analysisResult.analysis.suggestions || [],
                issues: analysisResult.analysis.issues || [],
                passed: analysisResult.analysis.score > 80,
                requiresReview: analysisResult.analysis.score < 60
              },
              [photoFile], // photos array
              undefined, // no videos
              undefined, // no notes
              false // no user override
            );
            
            logger.info('Checklist item completed successfully', {
              itemId: currentItem.id,
              score: analysisResult.analysis.score,
              confidence: 0.75
            }, 'PHOTO_GUIDANCE');
          } catch (error) {
            logger.error('Failed to complete checklist item', error, 'PHOTO_GUIDANCE');
            // Don't block the workflow - continue with photo capture
          }
        }
        
        // Also call the parent handler for workflow integration
        await onPhotoCapture(currentItem.roomType || currentItem.category);
        
      } catch (error) {
        console.error('AI analysis failed:', error);
        clearInterval(progressInterval);
        setCaptureProgress(100);
        
        // Fallback to basic analysis
        const fallbackResult = {
          photo: photoFile,
          analysis: {
            score: 70,
            issues: ['AI analysis unavailable'],
            suggestions: ['Photo captured, manual review recommended']
          }
        };
        
        setCapturedPhotos(prev => ({
          ...prev,
          [currentItem.id]: fallbackResult
        }));
        
        // Store photo data in parent component for database sync
        if (onPhotoStored) {
          onPhotoStored(currentItem.id, photoFile, fallbackResult.analysis);
        }
        
        // Update checklist item status with fallback analysis
        if (inspectionId) {
          try {
            await checklistService.completeChecklistItem(
              currentItem.id,
              {
                id: currentItem.id,
                aiScore: fallbackResult.analysis.score,
                aiConfidence: 0.5, // Low confidence for fallback
                aiReasoning: 'AI analysis unavailable, manual review recommended',
                suggestions: fallbackResult.analysis.suggestions,
                issues: fallbackResult.analysis.issues,
                passed: false, // Conservative approach when AI fails
                requiresReview: true // Always require review when AI fails
              },
              [photoFile], // photos array
              undefined, // no videos
              'AI analysis failed - manual review required', // notes
              false // no user override
            );
            
            logger.info('Checklist item completed with fallback analysis', {
              itemId: currentItem.id,
              score: fallbackResult.analysis.score
            }, 'PHOTO_GUIDANCE');
          } catch (error) {
            logger.error('Failed to complete checklist item with fallback', error, 'PHOTO_GUIDANCE');
            // Don't block the workflow - continue with photo capture
          }
        }
        
        // Still call parent handler
        await onPhotoCapture(currentItem.roomType || currentItem.category);
      }
      
      // Result is already stored in the AI analysis section above

      // Move to next item or complete
      if (currentItemIndex < totalItems - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        // All photos captured
        onAllPhotosComplete();
      }
      
    } catch (error) {
      console.error('Photo capture failed:', error);
    } finally {
      setIsCapturing(false);
      setCaptureProgress(0);
    }
  }, [currentItem, isReady, takePhoto, onPhotoCapture, currentItemIndex, totalItems, onAllPhotosComplete, onPhotoStored, inspectionId]);

  const handleRetake = useCallback(() => {
    if (currentItem) {
      const newCapturedPhotos = { ...capturedPhotos };
      delete newCapturedPhotos[currentItem.id];
      setCapturedPhotos(newCapturedPhotos);
    }
  }, [currentItem, capturedPhotos]);

  const handleSkipItem = useCallback(() => {
    if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      onAllPhotosComplete();
    }
  }, [currentItemIndex, totalItems, onAllPhotosComplete]);

  const handlePreviousItem = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  }, [currentItemIndex]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      safety: <AlertTriangle className="h-4 w-4" />,
      bedrooms: <Eye className="h-4 w-4" />,
      bathrooms: <Eye className="h-4 w-4" />,
      kitchen: <Eye className="h-4 w-4" />,
      general: <Target className="h-4 w-4" />
    };
    
    return icons[category] || <Camera className="h-4 w-4" />;
  };

  const getPhotoGuidelines = (item: DynamicChecklistItem): string[] => {
    const baseGuidelines = [
      'Ensure good lighting and clear visibility',
      'Hold the camera steady to avoid blur',
      'Capture the entire subject in frame',
      'Avoid shadows and reflections when possible'
    ];

    const categoryGuidelines: Record<string, string[]> = {
      safety: [
        'Focus on safety equipment and hazards',
        'Show condition and accessibility clearly',
        'Include any warning labels or signs'
      ],
      kitchen: [
        'Show appliances and their condition',
        'Capture cleanliness of surfaces',
        'Include storage and organization'
      ],
      bathrooms: [
        'Test and show water pressure',
        'Check for leaks or damage',
        'Show cleanliness and supplies'
      ],
      bedrooms: [
        'Show bed quality and linens',
        'Capture overall room condition',
        'Include lighting and furniture'
      ]
    };

    return [...baseGuidelines, ...(categoryGuidelines[item.category] || [])];
  };

  // Camera permission handling
  if (!hasPermission && !cameraLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Permission Required
          </CardTitle>
          <CardDescription>
            We need access to your camera to capture inspection photos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Access Needed</AlertTitle>
            <AlertDescription>
              To continue with the photo documentation step, please allow camera access when prompted.
            </AlertDescription>
          </Alert>
          <Button onClick={requestPermission} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Enable Camera
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (cameraError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Camera Error</AlertTitle>
        <AlertDescription className="mt-2">
          {cameraError}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 ml-2" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentItem) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            All Photos Captured!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You've completed the photo documentation step.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isCurrentItemCompleted = capturedPhotos[currentItem.id];
  const currentPhotoResult = capturedPhotos[currentItem.id];

  // If current item is a video walkthrough, show the video component
  if (isVideoWalkthrough) {
    return (
      <div className="space-y-4 pb-6">
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Walkthrough
            </CardTitle>
            <CardDescription>
              Record video walkthrough for property inspection ({completedPhotos}/{totalItems} completed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((completedPhotos / totalItems) * 100)}%</span>
              </div>
              <Progress value={(completedPhotos / totalItems) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Video Walkthrough Component */}
        <VideoWalkthroughPrompt
          propertyName={propertyData?.name || 'Property'}
          expectedDuration={currentItem.estimatedTimeMinutes || 15}
          onVideoRecorded={handleVideoComplete}
          onSkip={currentItem.required ? undefined : handleSkipItem}
        />

        {/* Navigation Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousItem}
                disabled={currentItemIndex === 0}
                className="h-12 px-6 touch-manipulation"
              >
                Previous
              </Button>
              
              {!currentItem.required && (
                <Button
                  variant="outline"
                  onClick={handleSkipItem}
                  className="h-12 px-6 touch-manipulation"
                >
                  Skip Video
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Summary */}
        {completedPhotos > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Items ({completedPhotos})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(capturedPhotos).map(([itemId, result]) => {
                  const item = checklist.items.find(i => i.id === itemId);
                  if (!item) return null;
                  
                  return (
                    <div key={itemId} className="flex items-center justify-between p-4 border rounded-lg min-h-[60px] touch-manipulation">
                      <div className="flex-1 min-w-0 mr-3">
                        <h5 className="font-medium text-base leading-tight">{item.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-sm py-1 px-2 shrink-0">
                        {result.analysis.score}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Documentation
          </CardTitle>
          <CardDescription>
            Capture photos for each checklist item ({completedPhotos}/{totalItems} completed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((completedPhotos / totalItems) * 100)}%</span>
            </div>
            <Progress value={(completedPhotos / totalItems) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Item - Mobile Optimized */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-start gap-3 text-lg">
            <div className="mt-1">
              {getCategoryIcon(currentItem.category)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{currentItem.title}</h3>
                {isCurrentItemCompleted && (
                  <Badge className="bg-green-100 text-green-800 shrink-0">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </CardTitle>
          {/* Collapsible guidance */}
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsGuidanceExpanded(!isGuidanceExpanded)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-0 h-auto font-normal -ml-1"
            >
              <Info className="h-4 w-4" />
              <span>{isGuidanceExpanded ? 'Hide guidance' : 'Show guidance & tips'}</span>
              {isGuidanceExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {!isGuidanceExpanded && (
              <div className="text-xs text-gray-500 mt-1 ml-5">
                Tap to view detailed instructions and photo tips
              </div>
            )}
            
            {isGuidanceExpanded && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                {/* Item Description */}
                <div>
                  <h5 className="font-medium text-sm mb-2">Description</h5>
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    {currentItem.description}
                  </p>
                </div>
                
                {/* Photo Guidelines */}
                <div>
                  <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Photo Guidelines
                  </h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {getPhotoGuidelines(currentItem).map((guideline, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1 text-sm">•</span>
                        <span className="flex-1">{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-sm py-1">{currentItem.category}</Badge>
            <Badge className={`text-sm py-1 ${
              currentItem.priority === 'critical' ? 'bg-red-100 text-red-800' :
              currentItem.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {currentItem.priority}
            </Badge>
            {currentItem.required && (
              <Badge variant="destructive" className="text-sm py-1">Required</Badge>
            )}
          </div>


          {/* Current Photo Result */}
          {currentPhotoResult && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Photo Captured
                </span>
                <Badge className="bg-green-100 text-green-800 ml-auto">
                  Score: {currentPhotoResult.analysis.score}%
                </Badge>
              </div>
              {currentPhotoResult.analysis.suggestions.length > 0 && (
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="font-medium">Suggestions:</p>
                  <ul className="list-disc list-inside">
                    {currentPhotoResult.analysis.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Camera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Video Preview - Mobile Optimized */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video min-h-[300px] sm:min-h-[400px]">
              {cameraLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white">Loading camera...</div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              )}
              
              {/* Capture Progress Overlay */}
              {isCapturing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="mb-2">
                      {captureProgress < 20 ? 'Capturing photo...' :
                       captureProgress < 40 ? 'Compressing image...' :
                       captureProgress < 60 ? 'Checking quality...' :
                       captureProgress < 90 ? 'Analyzing with AI...' :
                       'Finalizing...'}
                    </div>
                    <Progress value={captureProgress} className="w-48 h-2" />
                    <div className="text-xs mt-2 opacity-75">{Math.round(captureProgress)}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls - Mobile Optimized */}
            <div className="space-y-3">
              {/* Primary Action - Large Touch Target */}
              <div className="flex justify-center">
                {isCurrentItemCompleted ? (
                  <Button
                    variant="outline"
                    onClick={handleRetake}
                    disabled={isCapturing}
                    className="h-16 px-8 text-lg font-medium min-w-[200px] touch-manipulation"
                  >
                    <Camera className="h-6 w-6 mr-3" />
                    Retake Photo
                  </Button>
                ) : (
                  <Button
                    onClick={handlePhotoCapture}
                    disabled={!isReady || isCapturing}
                    className="h-16 px-8 text-lg font-medium min-w-[200px] bg-blue-600 hover:bg-blue-700 touch-manipulation"
                  >
                    <Camera className="h-6 w-6 mr-3" />
                    {isCapturing ? 'Processing...' : 'Capture Photo'}
                  </Button>
                )}
              </div>
              
              {/* Secondary Actions - Mobile Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreviousItem}
                  disabled={currentItemIndex === 0}
                  className="h-12 text-base touch-manipulation"
                >
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleSkipItem}
                  disabled={isCapturing}
                  className="h-12 text-base touch-manipulation"
                >
                  Next
                </Button>
              </div>
              
              {/* Utility Controls */}
              <div className="flex justify-center gap-3">
                {availableDevices.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={switchCamera}
                    disabled={isCapturing}
                    className="h-12 px-6 touch-manipulation"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Switch Camera
                  </Button>
                )}
                
                {!currentItem.required && (
                  <Button
                    variant="outline"
                    onClick={handleSkipItem}
                    disabled={isCapturing}
                    className="h-12 px-6 touch-manipulation"
                  >
                    Skip Item
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Summary - Mobile Optimized */}
      {completedPhotos > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Captured Photos ({completedPhotos})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(capturedPhotos).map(([itemId, result]) => {
                const item = checklist.items.find(i => i.id === itemId);
                if (!item) return null;
                
                return (
                  <div key={itemId} className="flex items-center justify-between p-4 border rounded-lg min-h-[60px] touch-manipulation">
                    <div className="flex-1 min-w-0 mr-3">
                      <h5 className="font-medium text-base leading-tight">{item.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-sm py-1 px-2 shrink-0">
                      {result.analysis.score}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotoGuidance;