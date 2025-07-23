/**
 * Photo Capture Additional Controls - Focused Component
 *
 * Secondary controls for settings and save functionality
 */

import React from "react";
import { Settings, Download } from "lucide-react";

interface PhotoCaptureAdditionalControlsProps {
  onSettings?: () => void;
  onSave?: () => void;
  className?: string;
}

export const PhotoCaptureAdditionalControls: React.FC<
  PhotoCaptureAdditionalControlsProps
> = ({ onSettings, onSave, className }) => {
  return (
    <div
      className={`flex justify-center gap-4 text-sm text-gray-600 ${className}`}
      id="photo-capture-additional-controls"
    >
      <button
        className="flex items-center gap-1 hover:text-gray-800 focus:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        onClick={onSettings}
        aria-label="Open camera settings"
      >
        <Settings className="w-4 h-4" />
        Settings
      </button>
      <button
        className="flex items-center gap-1 hover:text-gray-800 focus:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        onClick={onSave}
        aria-label="Save current settings"
      >
        <Download className="w-4 h-4" />
        Save
      </button>
    </div>
  );
};
