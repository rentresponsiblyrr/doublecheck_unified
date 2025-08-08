/**
 * MEDIA CAPTURE SECTION COMPONENT
 *
 * Professional component for handling photo and video capture functionality
 * in inspection workflows. Extracted from OfflineInspectionWorkflow for
 * better maintainability and single responsibility.
 *
 * @author STR Certified Engineering Team
 */

import React, { useState, useRef } from "react";
import { debugLogger } from "@/lib/logger/debug-logger";

export interface MediaCaptureProps {
  activeItemId: string | null;
  onPhotoCapture: (itemId: string, photo: File) => void;
  onVideoCapture: (itemId: string, video: File) => void;
  onNoteAdd: (itemId: string, note: string) => void;
  emergencyMode: boolean;
  batteryLevel: number;
}

export const MediaCaptureSection: React.FC<MediaCaptureProps> = ({
  activeItemId,
  onPhotoCapture,
  onVideoCapture,
  onNoteAdd,
  emergencyMode,
  batteryLevel,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMode, setCaptureMode] = useState<"photo" | "video" | null>(
    null,
  );
  const [noteText, setNoteText] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = async () => {
    if (!activeItemId || batteryLevel < 10) return;

    setIsCapturing(true);
    setCaptureMode("photo");

    try {
      // In emergency mode, use file input fallback
      if (emergencyMode) {
        fileInputRef.current?.click();
        return;
      }

      // Use camera API if available
      if ("mediaDevices" in navigator) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1920,
            height: 1080,
            facingMode: "environment", // Use back camera on mobile
          },
        });

        // Create video element for capture
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const file = new File([blob], `photo-${Date.now()}.jpg`, {
                  type: "image/jpeg",
                });
                onPhotoCapture(activeItemId, file);
              }
            },
            "image/jpeg",
            0.9,
          );

          // Stop camera stream
          stream.getTracks().forEach((track) => track.stop());
        };
      } else {
        // Fallback to file input
        fileInputRef.current?.click();
      }
    } catch (error) {
      debugLogger.error("Photo capture failed:", error);
      // Fallback to file input
      fileInputRef.current?.click();
    } finally {
      setIsCapturing(false);
      setCaptureMode(null);
    }
  };

  const handleVideoCapture = () => {
    if (!activeItemId || batteryLevel < 20) return;
    videoInputRef.current?.click();
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && activeItemId) {
      onPhotoCapture(activeItemId, file);
    }
  };

  const handleVideoInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && activeItemId) {
      onVideoCapture(activeItemId, file);
    }
  };

  const handleNoteSubmit = () => {
    if (noteText.trim() && activeItemId) {
      onNoteAdd(activeItemId, noteText.trim());
      setNoteText("");
      setShowNoteDialog(false);
    }
  };

  if (!activeItemId) {
    return null;
  }

  return (
    <div id="media-capture-section" className="bg-white border-t p-4">
      <div id="capture-controls" className="flex flex-wrap gap-2 mb-4">
        {/* Photo Capture Button */}
        <button
          id="photo-capture-btn"
          className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium transition-all ${
            isCapturing || batteryLevel < 10
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={handlePhotoCapture}
          disabled={isCapturing || batteryLevel < 10}
        >
          {isCapturing && captureMode === "photo" ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">📷</span>
              Capturing...
            </span>
          ) : (
            <span className="flex items-center justify-center">📷 Photo</span>
          )}
        </button>

        {/* Video Capture Button */}
        <button
          id="video-capture-btn"
          className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium transition-all ${
            batteryLevel < 20
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          onClick={handleVideoCapture}
          disabled={batteryLevel < 20}
        >
          🎥 Video
        </button>

        {/* Note Button */}
        <button
          id="note-btn"
          className="flex-1 min-w-[120px] px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all"
          onClick={() => setShowNoteDialog(true)}
        >
          📝 Note
        </button>
      </div>

      {/* Battery Warning */}
      {batteryLevel < 20 && (
        <div
          id="battery-warning"
          className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-4"
        >
          <div className="flex items-center">
            <span className="text-orange-400 mr-2">🔋</span>
            <p className="text-sm text-orange-800">
              Low battery ({batteryLevel}%) - Video capture disabled
            </p>
          </div>
        </div>
      )}

      {/* Emergency Mode Notice */}
      {emergencyMode && (
        <div
          id="emergency-notice"
          className="bg-red-50 border-l-4 border-red-400 p-3 mb-4"
        >
          <div className="flex items-center">
            <span className="text-red-400 mr-2">🚨</span>
            <p className="text-sm text-red-800">
              Emergency mode active - Using simplified capture methods
            </p>
          </div>
        </div>
      )}

      {/* Note Dialog */}
      {showNoteDialog && (
        <div
          id="note-dialog-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNoteDialog(false)}
        >
          <div
            id="note-dialog"
            className="bg-white rounded-lg p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>

            <textarea
              id="note-textarea"
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter inspection notes..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />

            <div id="note-dialog-actions" className="flex gap-2 mt-4">
              <button
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                onClick={() => setShowNoteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleNoteSubmit}
                disabled={!noteText.trim()}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleVideoInputChange}
      />
    </div>
  );
};
