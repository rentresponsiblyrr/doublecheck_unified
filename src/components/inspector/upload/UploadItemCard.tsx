import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, Image, Video, FileText } from 'lucide-react';
import { UploadItem } from './types';

interface UploadItemCardProps {
  item: UploadItem;
  onRetry?: (itemId: string) => void;
}

export const UploadItemCard: React.FC<UploadItemCardProps> = ({ item, onRetry }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'uploading': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'photo': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'failed': return 'border-red-200 bg-red-50';
      case 'uploading': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id={`upload-item-${item.id}`}
      className={`p-3 rounded-lg border ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getTypeIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge variant="outline" className="text-xs">
            {item.status}
          </Badge>
        </div>
      </div>

      {item.status === 'uploading' && (
        <Progress value={item.progress} className="h-1 mb-1" />
      )}

      {item.error && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-red-600">{item.error}</p>
          {onRetry && (
            <button
              onClick={() => onRetry(item.id)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};