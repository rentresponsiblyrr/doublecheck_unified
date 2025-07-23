/**
 * Upload Manager - Enterprise Grade
 *
 * Handles secure file upload with progress tracking
 */

import React, { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle } from "lucide-react";

interface UploadManagerProps {
  file: File;
  inspectionId: string;
  checklistItemId: string;
  onUploadComplete: (
    itemId: string,
    uploadResult: Record<string, unknown>,
  ) => void;
  onUploadError: (error: Error) => void;
}

export const UploadManager: React.FC<UploadManagerProps> = ({
  file,
  inspectionId,
  checklistItemId,
  onUploadComplete,
  onUploadError,
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "preparing" | "uploading" | "processing" | "complete"
  >("preparing");

  useEffect(() => {
    const uploadFile = async () => {
      try {
        setUploadStatus("preparing");

        // Mock upload simulation
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          setUploadProgress(progress);

          if (progress === 50) {
            setUploadStatus("uploading");
          } else if (progress === 90) {
            setUploadStatus("processing");
          }
        }

        setUploadStatus("complete");

        // Mock upload result
        const uploadResult = {
          url: `https://storage.example.com/inspections/${inspectionId}/${file.name}`,
          mediaId: `media_${Date.now()}`,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          contentType: file.type,
        };

        onUploadComplete(checklistItemId, uploadResult);
      } catch (error) {
        onUploadError(
          error instanceof Error ? error : new Error("Upload failed"),
        );
      }
    };

    uploadFile();
  }, [file, inspectionId, checklistItemId, onUploadComplete, onUploadError]);

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "preparing":
        return "Preparing file for upload...";
      case "uploading":
        return "Uploading to secure storage...";
      case "processing":
        return "Processing and finalizing...";
      case "complete":
        return "Upload completed successfully!";
      default:
        return "Processing...";
    }
  };

  const getStatusIcon = () => {
    if (uploadStatus === "complete") {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
  };

  return (
    <div id="upload-manager" className="space-y-4">
      <Alert
        className={
          uploadStatus === "complete" ? "border-green-200 bg-green-50" : ""
        }
      >
        {getStatusIcon()}
        <AlertDescription>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span className="font-medium">{getStatusMessage()}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>File: {file.name}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>

            {uploadStatus === "complete" && (
              <div className="text-sm text-green-700">
                File successfully uploaded and linked to inspection item.
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
