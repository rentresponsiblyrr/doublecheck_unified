/**
 * Video Quality Settings Component
 * Extracted from VideoRecorder.tsx
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Camera, RotateCcw } from "lucide-react";

interface VideoQualitySettingsProps {
  showSettings: boolean;
  audioEnabled: boolean;
  availableDevices: MediaDeviceInfo[];
  isRecording: boolean;
  onToggleAudio: () => void;
  onSwitchCamera: () => Promise<void>;
}

export const VideoQualitySettings: React.FC<VideoQualitySettingsProps> = ({
  showSettings,
  audioEnabled,
  availableDevices,
  isRecording,
  onToggleAudio,
  onSwitchCamera,
}) => {
  if (!showSettings || isRecording) {
    return null;
  }

  return (
    <Card
      id="video-quality-settings"
      className="p-4 bg-gray-50 dark:bg-gray-800"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {audioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
            <span className="text-base font-medium">Audio Recording</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAudio}
            className="h-10 px-4 text-base touch-manipulation"
          >
            {audioEnabled ? "Enabled" : "Disabled"}
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
              onClick={onSwitchCamera}
              className="h-10 px-4 text-base touch-manipulation"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Switch
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
