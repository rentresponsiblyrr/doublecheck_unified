// Video Walkthrough Prompt Component
// Prominent first-item UI for mandatory video walkthrough with permissions handling

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle,
  Camera,
  Clock,
  MapPin
} from 'lucide-react';
import { useVideoRecording } from '@/hooks/useVideoRecording';
import { logger } from '@/utils/logger';

interface VideoWalkthroughPromptProps {
  propertyName: string;
  expectedDuration: number; // in minutes
  onVideoRecorded: (videoBlob: Blob, duration: number) => void;
  onSkip?: () => void; // Optional skip for emergencies
  className?: string;
}


export const VideoWalkthroughPrompt: React.FC<VideoWalkthroughPromptProps> = ({
  propertyName,
  expectedDuration,
  onVideoRecorded,
  onSkip,
  className = ''
}) => {
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    stream,
    isReady,
    error,
    permissions,
    recording,
    recordedBlob,
    requestPermissions,
    startRecording,
    stopRecording,
    resetRecording
  } = useVideoRecording({
    video: true,
    audio: true,
    facingMode: 'environment'
  });

  // Update video element when stream becomes available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle errors and show permission help
  useEffect(() => {
    if (error && (permissions.camera === 'denied' || permissions.microphone === 'denied')) {
      setShowPermissionHelp(true);
    } else {
      setShowPermissionHelp(false);
    }
  }, [error, permissions]);

  /**
   * Submit the recorded video
   */
  const submitRecording = () => {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob, recording.duration);
    }
  };

  /**
   * Handle recording restart
   */
  const handleRecordAgain = () => {
    resetRecording();
  };

  /**
   * Format duration for display
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get permission status color
   */
  const getPermissionColor = (status: 'unknown' | 'granted' | 'denied' | 'requesting'): string => {
    switch (status) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      case 'requesting': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const allPermissionsGranted = permissions.camera === 'granted' && permissions.microphone === 'granted';
  const anyPermissionDenied = permissions.camera === 'denied' || permissions.microphone === 'denied';
  const hasRecording = recording.isAvailable && recordedBlob;

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-900">
          <Video className="h-8 w-8" />
          🎥 Property Video Walkthrough
        </CardTitle>
        <div className="flex items-center justify-center gap-4 text-sm text-blue-700 mt-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {propertyName}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~{expectedDuration} minutes
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Welcome Message */}
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Great! Before we go through the full checklist, let's get our bearings.</strong>
            <br />
            Give me a video tour of the property to help orient the audit process. This helps ensure we don't miss anything important!
          </AlertDescription>
        </Alert>

        {/* Permission Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Camera & Microphone Permissions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Camera className={`h-5 w-5 ${getPermissionColor(permissions.camera)}`} />
              <span className="text-sm">
                Camera: <span className={`font-medium ${getPermissionColor(permissions.camera)}`}>
                  {permissions.camera === 'granted' ? 'Enabled' : 
                   permissions.camera === 'denied' ? 'Denied' :
                   permissions.camera === 'requesting' ? 'Requesting...' : 'Not requested'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className={`h-5 w-5 ${getPermissionColor(permissions.microphone)}`} />
              <span className="text-sm">
                Microphone: <span className={`font-medium ${getPermissionColor(permissions.microphone)}`}>
                  {permissions.microphone === 'granted' ? 'Enabled' : 
                   permissions.microphone === 'denied' ? 'Denied' :
                   permissions.microphone === 'requesting' ? 'Requesting...' : 'Not requested'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Camera Preview */}
        {isReady && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 object-cover"
            />
            {recording.isRecording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording: {formatDuration(recording.duration)}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {!allPermissionsGranted && (
            <Button
              onClick={requestPermissions}
              disabled={permissions.camera === 'requesting'}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {permissions.camera === 'requesting' ? (
                'Requesting Permissions...'
              ) : (
                'Enable Camera & Microphone'
              )}
            </Button>
          )}

          {allPermissionsGranted && !hasRecording && (
            <Button
              onClick={recording.isRecording ? stopRecording : startRecording}
              disabled={!isReady}
              size="lg"
              className={`w-full ${
                recording.isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {recording.isRecording ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording ({formatDuration(recording.duration)})
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Video Walkthrough
                </>
              )}
            </Button>
          )}

          {hasRecording && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Great! Video recorded successfully ({formatDuration(recording.duration)}). 
                  Ready to continue with the inspection checklist.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button
                  onClick={submitRecording}
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Continue with Checklist
                </Button>
                
                <Button
                  onClick={handleRecordAgain}
                  variant="outline"
                  size="lg"
                >
                  Record Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Help */}
        {showPermissionHelp && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Need help with permissions?</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Look for the camera/microphone icon in your browser's address bar</li>
                <li>Click "Allow" when prompted for camera and microphone access</li>
                <li>Check your browser settings if permissions were previously denied</li>
                <li>Try refreshing the page if permissions are stuck</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Recording Instructions */}
        {allPermissionsGranted && !recording.isRecording && !hasRecording && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Recording Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Walk through each room slowly and narrate what you see</li>
              <li>• Point out key features, amenities, and overall condition</li>
              <li>• Include all areas guests will access (bedrooms, bathrooms, kitchen, living areas)</li>
              <li>• Show any outdoor spaces like patios, decks, or pools</li>
              <li>• Aim for {expectedDuration} minutes to cover everything thoroughly</li>
            </ul>
          </div>
        )}

        {/* Emergency Skip Option */}
        {onSkip && anyPermissionDenied && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              Skip video walkthrough (not recommended)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoWalkthroughPrompt;