/**
 * PROFESSIONAL COMPONENT - SINGLE RESPONSIBILITY PRINCIPLE
 * Video Recording Step - Does ONE thing well
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoRecorder } from '@/components/video/VideoRecorder';

interface VideoRecordingStepProps {
  propertyId: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function VideoRecordingStep({
  propertyId,
  isRecording,
  onStartRecording,
  onStopRecording
}: VideoRecordingStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Walkthrough</CardTitle>
        <CardDescription>
          Record a comprehensive video tour of the property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VideoRecorder
          propertyId={propertyId}
          isRecording={isRecording}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
      </CardContent>
    </Card>
  );
}