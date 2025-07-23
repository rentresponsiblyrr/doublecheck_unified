import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, Trash2 } from "lucide-react";

interface UploadSuccessStateProps {
  fileName: string;
  fileUrl?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  onView?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const UploadSuccessState: React.FC<UploadSuccessStateProps> = ({
  fileName,
  fileUrl,
  uploadedBy,
  uploadedAt,
  onView,
  onDelete,
  isDeleting = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card id="upload-success-state" className="bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-green-900 truncate">{fileName}</p>
              {uploadedBy && (
                <p className="text-sm text-green-700">
                  Uploaded by {uploadedBy}
                  {uploadedAt && ` on ${formatDate(uploadedAt)}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {onView && fileUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                className="h-8 w-8 p-0 text-green-700 hover:bg-green-100"
                title="View file"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                title="Delete file"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
