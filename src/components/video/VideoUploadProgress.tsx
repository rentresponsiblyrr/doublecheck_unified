// Video Upload Progress Component for STR Certified

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Pause,
  Play,
  Wifi,
  WifiOff,
  HardDrive,
  Cloud,
  FileVideo,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoRecording } from '@/types/video';

export interface VideoUploadState {
  videoId: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  uploadSpeed: number; // bytes per second
  remainingTime: number; // seconds
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
  startTime: Date;
  endTime?: Date;
}

interface VideoUploadProgressProps {
  video: VideoRecording;
  onComplete?: (videoId: string) => void;
  onCancel?: (videoId: string) => void;
  onRetry?: (videoId: string) => void;
  allowBackground?: boolean;
  wifiOnly?: boolean;
  className?: string;
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  video,
  onComplete,
  onCancel,
  onRetry,
  allowBackground = true,
  wifiOnly = true,
  className
}) => {
  // State
  const [uploadState, setUploadState] = useState<VideoUploadState>({
    videoId: video.id,
    fileName: video.file.name,
    fileSize: video.size,
    uploadedBytes: 0,
    uploadSpeed: 0,
    remainingTime: 0,
    status: 'pending',
    retryCount: 0,
    startTime: new Date()
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isWifi, setIsWifi] = useState(true); // Mock - would check actual connection
  const [isPaused, setIsPaused] = useState(false);

  // Calculate progress percentage
  const progressPercentage = (uploadState.uploadedBytes / uploadState.fileSize) * 100;

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  // Format remaining time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Simulate upload progress
  useEffect(() => {
    if (uploadState.status !== 'uploading' || isPaused) return;

    const interval = setInterval(() => {
      setUploadState(prev => {
        // Simulate upload speed variations
        const baseSpeed = 1024 * 1024; // 1 MB/s base
        const variation = (Math.random() - 0.5) * 0.5; // ±50% variation
        const currentSpeed = baseSpeed * (1 + variation);
        
        // Calculate new uploaded bytes
        const newUploadedBytes = Math.min(
          prev.uploadedBytes + currentSpeed / 10, // Update every 100ms
          prev.fileSize
        );
        
        // Calculate remaining time
        const remainingBytes = prev.fileSize - newUploadedBytes;
        const remainingTime = remainingBytes / currentSpeed;
        
        // Check if complete
        const isComplete = newUploadedBytes >= prev.fileSize;
        
        if (isComplete) {
          onComplete?.(prev.videoId);
        }
        
        return {
          ...prev,
          uploadedBytes: newUploadedBytes,
          uploadSpeed: currentSpeed,
          remainingTime,
          status: isComplete ? 'completed' : 'uploading',
          endTime: isComplete ? new Date() : undefined
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [uploadState.status, isPaused, onComplete]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle pause/resume based on network conditions
  useEffect(() => {
    if (!isOnline || (wifiOnly && !isWifi)) {
      setIsPaused(true);
    }
  }, [isOnline, isWifi, wifiOnly]);

  // Start upload
  const startUpload = () => {
    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      startTime: new Date()
    }));
    setIsPaused(false);
  };

  // Pause upload
  const pauseUpload = () => {
    setIsPaused(true);
  };

  // Resume upload
  const resumeUpload = () => {
    setIsPaused(false);
  };

  // Cancel upload
  const cancelUpload = () => {
    setUploadState(prev => ({ ...prev, status: 'failed' }));
    onCancel?.(video.id);
  };

  // Retry upload
  const retryUpload = () => {
    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      uploadedBytes: 0,
      retryCount: prev.retryCount + 1,
      error: undefined
    }));
    setIsPaused(false);
    onRetry?.(video.id);
  };

  // Get status color
  const getStatusColor = (status: VideoUploadState['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'paused': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: VideoUploadState['status']) => {
    switch (status) {
      case 'uploading': return <Upload className="h-4 w-4 animate-pulse" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileVideo className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{video.file.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(video.size)} • {formatTime(video.duration)} duration
              </p>
            </div>
          </div>
          <Badge className={cn('flex items-center space-x-1', getStatusColor(uploadState.status))}>
            {getStatusIcon(uploadState.status)}
            <span className="capitalize">{uploadState.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{formatBytes(uploadState.uploadedBytes)} / {formatBytes(uploadState.fileSize)}</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Upload Stats */}
        {uploadState.status === 'uploading' && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Speed:</span>
              <span className="font-medium">{formatSpeed(uploadState.uploadSpeed)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-medium">{formatTime(uploadState.remainingTime)}</span>
            </div>
          </div>
        )}

        {/* Network Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                {isWifi ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-yellow-600" />}
                <span className="text-sm">
                  {isWifi ? 'WiFi Connected' : 'Mobile Data'}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">No Connection</span>
              </>
            )}
          </div>
          {allowBackground && (
            <Badge variant="secondary" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Background Upload
            </Badge>
          )}
        </div>

        {/* Error Message */}
        {uploadState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{uploadState.error}</AlertDescription>
          </Alert>
        )}

        {/* Warning for WiFi-only mode */}
        {wifiOnly && !isWifi && uploadState.status === 'uploading' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Upload paused. Waiting for WiFi connection.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2">
          {uploadState.status === 'pending' && (
            <Button onClick={startUpload} size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Start Upload
            </Button>
          )}

          {uploadState.status === 'uploading' && (
            <>
              {!isPaused ? (
                <Button variant="secondary" size="sm" onClick={pauseUpload}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={resumeUpload}>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={cancelUpload}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          )}

          {uploadState.status === 'failed' && (
            <Button onClick={retryUpload} size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry ({uploadState.retryCount})
            </Button>
          )}
        </div>

        {/* Retry info */}
        {uploadState.retryCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Retry attempt {uploadState.retryCount} of 3
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Batch upload manager
export const VideoUploadManager: React.FC<{
  videos: VideoRecording[];
  onAllComplete?: () => void;
  className?: string;
}> = ({ videos, onAllComplete, className }) => {
  const [uploadStates, setUploadStates] = useState<Map<string, VideoUploadState>>(new Map());
  const [completedCount, setCompletedCount] = useState(0);

  // Initialize upload states
  useEffect(() => {
    const initialStates = new Map<string, VideoUploadState>();
    videos.forEach(video => {
      initialStates.set(video.id, {
        videoId: video.id,
        fileName: video.file.name,
        fileSize: video.size,
        uploadedBytes: 0,
        uploadSpeed: 0,
        remainingTime: 0,
        status: 'pending',
        retryCount: 0,
        startTime: new Date()
      });
    });
    setUploadStates(initialStates);
  }, [videos]);

  // Handle completion
  const handleComplete = (videoId: string) => {
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount === videos.length) {
        onAllComplete?.();
      }
      return newCount;
    });
  };

  // Calculate total progress
  const totalSize = videos.reduce((sum, v) => sum + v.size, 0);
  const totalUploaded = Array.from(uploadStates.values())
    .reduce((sum, state) => sum + state.uploadedBytes, 0);
  const totalProgress = (totalUploaded / totalSize) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Uploading {videos.length} Videos</span>
            <Badge variant="secondary">
              {completedCount} / {videos.length} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={totalProgress} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatBytes(totalUploaded)} / {formatBytes(totalSize)}</span>
              <span>{totalProgress.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Uploads */}
      {videos.map(video => (
        <VideoUploadProgress
          key={video.id}
          video={video}
          onComplete={handleComplete}
        />
      ))}
    </div>
  );
};

// Helper function
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}