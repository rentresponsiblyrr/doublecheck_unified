import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface UploadProgressProps {
  currentStep: string;
  totalProgress: number;
  isUploading: boolean;
  completedItems: number;
  totalItems: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  currentStep,
  totalProgress,
  isUploading,
  completedItems,
  totalItems,
}) => (
  <div id="upload-progress-panel" className="bg-blue-50 p-4 rounded-lg">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {isUploading ? (
          <>
            <LoadingSpinner className="w-5 h-5" />
            <span className="font-medium text-blue-900">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Ready to Upload</span>
          </>
        )}
      </div>
      <Badge variant="outline" className="text-blue-700">
        {completedItems}/{totalItems} items
      </Badge>
    </div>

    <Progress value={totalProgress} className="h-2 mb-2" />

    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{currentStep}</span>
      <span className="text-blue-600 font-medium">
        {Math.round(totalProgress)}%
      </span>
    </div>

    {totalProgress === 100 && (
      <div className="flex items-center gap-2 mt-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Upload Complete!</span>
      </div>
    )}
  </div>
);
