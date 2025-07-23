/**
 * Recording Tips Component
 * Extracted from VideoRecorder.tsx
 */

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface RecordingTipsProps {
  isRecording: boolean;
}

export const RecordingTips: React.FC<RecordingTipsProps> = ({
  isRecording,
}) => {
  if (isRecording) {
    return null;
  }

  return (
    <Alert id="recording-tips">
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
  );
};
