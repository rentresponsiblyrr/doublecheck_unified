import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Square, 
  Play, 
  Pause,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileVideo
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface VideoRecordingStepProps {
  onVideoRecorded: (video: File) => void;
  recordedVideo?: File | null;
  onStepComplete: () => void;
  className?: string;
}

const VideoRecordingStep: React.FC<VideoRecordingStepProps> = ({
  onVideoRecorded,
  recordedVideo,
  onStepComplete,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const MAX_DURATION = 300; // 5 minutes max
  const MIN_DURATION = 30; // 30 seconds minimum

  React.useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    stopRecording();
    stopCamera();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const initializeCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      logger.error('Failed to initialize camera for video', error, 'VIDEO_RECORDING_STEP');
      setCameraError('Failed to access camera and microphone. Please check permissions.');
      toast({
        title: 'Camera Access Failed',
        description: 'Please allow camera and microphone access or upload a video file.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startRecording = useCallback(async () => {
    if (!cameraStream) {
      toast({
        title: 'Camera Not Ready',
        description: 'Please wait for camera to initialize.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const recorder = new MediaRecorder(cameraStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const file = new File([blob], `inspection_video_${Date.now()}.webm`, {
            type: 'video/webm'
          });
          
          onVideoRecorded(file);
          setRecordedChunks(chunks);
          
          toast({
            title: 'Video Recorded Successfully',
            description: `Recording duration: ${formatDuration(recordingDuration)}`,
            duration: 3000,
          });
        } catch (error) {
          logger.error('Failed to process recorded video', error, 'VIDEO_RECORDING_STEP');
          toast({
            title: 'Processing Failed',
            description: 'Failed to process recorded video.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      
      recorder.start(1000); // Record in 1-second chunks

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          
          return newDuration;
        });
      }, 1000);

      toast({
        title: 'Recording Started',
        description: 'Video recording has begun. Speak clearly and show all areas.',
        duration: 3000,
      });

    } catch (error) {
      logger.error('Failed to start video recording', error, 'VIDEO_RECORDING_STEP');
      toast({
        title: 'Recording Failed',
        description: 'Failed to start video recording.',
        variant: 'destructive',
      });
    }
  }, [cameraStream, onVideoRecorded, recordingDuration, toast]);

  const pauseRecording = () => {
    if (mediaRecorder && isRecording) {
      if (isPaused) {
        mediaRecorder.resume();
        setIsPaused(false);
        toast({
          title: 'Recording Resumed',
          description: 'Video recording has resumed.',
          duration: 2000,
        });
      } else {
        mediaRecorder.pause();
        setIsPaused(true);
        toast({
          title: 'Recording Paused',
          description: 'Video recording has been paused.',
          duration: 2000,
        });
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [mediaRecorder, isRecording]);

  const resetRecording = () => {
    setRecordedChunks([]);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a video file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Video file must be less than 100MB.',
        variant: 'destructive',
      });
      return;
    }

    onVideoRecorded(file);
    
    toast({
      title: 'Video Uploaded',
      description: `Video "${file.name}" has been uploaded successfully.`,
      duration: 3000,
    });

    // Clear file input
    event.target.value = '';
  }, [onVideoRecorded, toast]);

  const downloadVideo = () => {
    if (!recordedVideo) return;

    const url = URL.createObjectURL(recordedVideo);
    const link = document.createElement('a');
    link.href = url;
    link.download = recordedVideo.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDurationColor = () => {
    if (recordingDuration < MIN_DURATION) return 'text-red-600';
    if (recordingDuration > MAX_DURATION * 0.8) return 'text-yellow-600';
    return 'text-green-600';
  };

  const canComplete = recordedVideo && recordingDuration >= MIN_DURATION;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Walkthrough Recording
        </CardTitle>
        <div className="text-sm text-gray-600">
          Record a comprehensive video walkthrough of the property
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Guidelines */}
        <Alert>
          <Video className="h-4 w-4" />
          <AlertDescription>
            <strong>Recording Guidelines:</strong>
            <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
              <li>Record for at least {MIN_DURATION} seconds, maximum {MAX_DURATION / 60} minutes</li>
              <li>Speak clearly while showing each room and feature</li>
              <li>Focus on safety items, amenities, and property condition</li>
              <li>Ensure good lighting and stable camera movement</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Recording Status */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-800 font-medium">Recording in Progress</span>
                {isPaused && <Badge variant="secondary">Paused</Badge>}
              </div>
              <div className={`text-lg font-mono font-bold ${getDurationColor()}`}>
                {formatDuration(recordingDuration)}
              </div>
            </div>
            <Progress 
              value={(recordingDuration / MAX_DURATION) * 100} 
              className="mt-2 h-2" 
            />
          </div>
        )}

        {/* Camera View or Error */}
        <div className="relative">
          {cameraError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {cameraError}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              
              {/* Recording Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                {!isRecording ? (
                  <Button
                    size="lg"
                    onClick={startRecording}
                    disabled={!cameraStream}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Video className="w-6 h-6 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={pauseRecording}
                      className="bg-black/50 text-white border-white/50"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      onClick={stopRecording}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initializeCamera}
                  className="bg-black/50 text-white border-white/50"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* File Upload Alternative */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="video-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload video from device
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  MP4, WebM up to 100MB
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="video-upload"
                name="video-upload"
                type="file"
                className="sr-only"
                accept="video/*"
                onChange={handleFileUpload}
              />
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Video File
              </Button>
            </div>
          </div>
        </div>

        {/* Recorded Video Preview */}
        {recordedVideo && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Recorded Video
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <video
                ref={playbackRef}
                controls
                className="w-full h-48 object-cover rounded"
                src={URL.createObjectURL(recordedVideo)}
              />
              
              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <span>File: {recordedVideo.name}</span>
                <span>Size: {(recordedVideo.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
              
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadVideo}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetRecording}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Record New Video
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Duration Requirements */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Duration Requirements</span>
          </div>
          <div className="text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Minimum duration:</span>
              <span className="font-medium">{MIN_DURATION} seconds</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum duration:</span>
              <span className="font-medium">{MAX_DURATION / 60} minutes</span>
            </div>
            {recordingDuration > 0 && (
              <div className="flex justify-between mt-1 pt-1 border-t border-blue-200">
                <span>Current duration:</span>
                <span className={`font-medium ${getDurationColor()}`}>
                  {formatDuration(recordingDuration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetRecording}
            disabled={!recordedVideo && !isRecording}
            className="flex-1"
          >
            Reset
          </Button>
          
          <Button
            onClick={onStepComplete}
            disabled={!canComplete || isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              <>
                Complete Video Recording
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        {!canComplete && recordedVideo && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Video must be at least {MIN_DURATION} seconds long to complete this step.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoRecordingStep;
export { VideoRecordingStep };