
import { Button } from "@/components/ui/button";
import { CheckCircle, RotateCcw, X } from "lucide-react";

interface UploadSuccessStateProps {
  evidenceType: 'photo' | 'video';
  onRetake: () => void;
  onDelete?: () => void;
  isUploading: boolean;
}

export const UploadSuccessState = ({ 
  evidenceType, 
  onRetake, 
  onDelete, 
  isUploading 
}: UploadSuccessStateProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <div>
            <p className="text-lg font-medium text-green-900 mb-1">
              {evidenceType === 'photo' ? 'Photo Uploaded' : 'Video Uploaded'}
            </p>
            <p className="text-sm text-green-600">
              Evidence successfully captured and saved
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={onRetake}
          variant="outline"
          className="flex-1 h-12"
          disabled={isUploading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake {evidenceType}
        </Button>
        
        {onDelete && (
          <Button
            onClick={onDelete}
            variant="destructive"
            className="h-12 px-4"
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
