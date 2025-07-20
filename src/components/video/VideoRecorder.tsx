import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  Circle,
  Square,
  Pause,
  Play,
  RotateCcw,
  AlertTriangle,
  Info,
  Camera,
  Mic,
  MicOff,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface VideoRecorderProps {
  propertyId?: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  maxDuration?: number; // seconds
  className?: string;
}

export function VideoRecorder({
  propertyId,
  isRecording: externalIsRecording,
  onStartRecording,
  onStopRecording,
  maxDuration = 600, // 10 minutes default
  className
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isReady,
    error: cameraError,
    hasPermission,
    isLoading: cameraLoading,
    stream,
    requestPermission,
    startCamera,
    stopCamera,
    switchCamera,
    availableDevices
  } = useCamera({
    videoRef,
    facingMode: 'environment',
    resolution: { width: 1920, height: 1080 },
    autoStart: true
  });

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (internalIsRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [internalIsRecording, isPaused, maxDuration, handleStopRecording]);

  // Setup MediaRecorder when stream is available
  useEffect(() => {
    if (stream && isReady) {
      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9' 
        });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordedVideo(blob);
          chunksRef.current = [];
          setInternalIsRecording(false);
          setIsPaused(false);
          onStopRecording();
        };
        
        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.error('Failed to create MediaRecorder:', err);
        setError('Video recording not supported on this device');
      }
    }
  }, [stream, isReady, onStopRecording]);

  const handleStartRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !stream) {
      setError('Camera not ready for recording');
      return;
    }
    
    try {
      setError(null);
      chunksRef.current = [];
      setDuration(0);
      setRecordedVideo(null);
      
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setInternalIsRecording(true);
      setIsPaused(false);
      
      onStartRecording();
    } catch (err) {
      setError('Failed to start recording');
      console.error('Recording start error:', err);
    }
  }, [stream, onStartRecording]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && internalIsRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [internalIsRecording]);

  const handlePauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && internalIsRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [internalIsRecording]);

  const handleResumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera permission handling
  if (!hasPermission && !cameraLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Permission Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Access Needed</AlertTitle>
            <AlertDescription>
              We need access to your camera to record the property walkthrough.
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

  if (cameraError || error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Camera Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error || cameraError}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 ml-2" 
            onClick={() => window.location.replace(window.location.pathname)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const isCurrentlyRecording = internalIsRecording || externalIsRecording;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Walkthrough
          {isCurrentlyRecording && (
            <Badge className="bg-red-100 text-red-800 animate-pulse">
              Recording
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {/* Video Preview - Mobile Optimized */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video min-h-[300px] sm:min-h-[400px]">
          {cameraLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-lg">Loading camera...</div>
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
          
          {/* Recording Indicator - Mobile Optimized */}
          {isCurrentlyRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-lg font-medium">
              <Circle className="h-4 w-4 fill-current animate-pulse" />
              <span className="font-mono">{formatDuration(duration)}</span>
            </div>
          )}

          {/* Settings Button - Mobile Optimized */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 h-12 w-12 touch-manipulation"
            onClick={() => setShowSettings(!showSettings)}
            disabled={isCurrentlyRecording}
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        {/* Settings Panel - Mobile Optimized */}
        {showSettings && !isCurrentlyRecording && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  <span className="text-base font-medium">Audio Recording</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="h-10 px-4 text-base touch-manipulation"
                >
                  {audioEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              {availableDevices.length > 1 && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5" />
                    <span className="text-base font-medium">Switch Camera</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchCamera}
                    className="h-10 px-4 text-base touch-manipulation"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Switch
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Progress Bar - Mobile Optimized */}
        {isCurrentlyRecording && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-lg font-medium">
              <span>{formatDuration(duration)}</span>
              <span className="text-gray-600">{formatDuration(maxDuration)}</span>
            </div>
            <Progress
              value={(duration / maxDuration) * 100}
              className="h-3"
            />
          </div>
        )}

        {/* Recording Controls - Mobile Optimized */}
        <div className="space-y-4">
          {!isCurrentlyRecording && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleStartRecording}
                disabled={!isReady}
                className="h-16 px-8 text-lg min-w-[200px] touch-manipulation"
              >
                <Circle className="h-6 w-6 mr-3" />
                Start Recording
              </Button>
            </div>
          )}

          {isCurrentlyRecording && !isPaused && (
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePauseRecording}
                className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleStopRecording}
                className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </div>
          )}

          {isPaused && (
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                onClick={handleResumeRecording}
                className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
              >
                <Play className="h-5 w-5 mr-2" />
                Resume
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleStopRecording}
                className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Recording Tips - Mobile Optimized */}
        {!isCurrentlyRecording && (
          <Alert>
            <Info className="h-5 w-5" />
            <AlertDescription>
              <p className="font-medium mb-3 text-base">Recording Tips:</p>
              <ul className="text-base space-y-2 list-disc list-inside text-gray-600 dark:text-gray-400 leading-relaxed">
                <li>Walk slowly and steadily through each room</li>
                <li>Focus on key features and any issues you find</li>
                <li>Narrate what you're showing if audio is enabled</li>
                <li>Ensure good lighting in all areas</li>
                <li>Keep the camera steady to avoid shaky footage</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Completed Video - Mobile Optimized */}
        {recordedVideo && !isCurrentlyRecording && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <Video className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-base">Video Recorded Successfully</span>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your property walkthrough video has been recorded and is ready for upload.
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 shrink-0 text-sm py-1">
                  {formatDuration(duration)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}