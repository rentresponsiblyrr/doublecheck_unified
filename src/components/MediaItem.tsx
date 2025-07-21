import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Download, Camera, Video, FileX } from "lucide-react";

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  user_id?: string;
  uploaded_by_name?: string;
  created_at: string;
}

interface MediaItemProps {
  item: MediaItem;
  onView?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  isDeleting?: boolean;
  showActions?: boolean;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  item,
  onView,
  onDelete,
  onDownload,
  isDeleting = false,
  showActions = true
}) => {
  const getMediaIcon = () => {
    switch (item.type) {
      case 'photo':
        return <Camera className="w-5 h-5 text-blue-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      default:
        return <FileX className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMediaTypeColor = () => {
    switch (item.type) {
      case 'photo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'video':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card id={`media-item-${item.id}`} className="bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getMediaIcon()}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={getMediaTypeColor()}>
                  {item.type}
                </Badge>
                <span className="text-sm text-gray-600">
                  {formatDate(item.created_at)}
                </span>
              </div>
              {item.uploaded_by_name && (
                <p className="text-xs text-gray-500">
                  Uploaded by {item.uploaded_by_name}
                </p>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1">
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onView}
                  className="h-8 w-8 p-0"
                  title="View media"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="h-8 w-8 p-0"
                  title="Download media"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                  title="Delete media"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};