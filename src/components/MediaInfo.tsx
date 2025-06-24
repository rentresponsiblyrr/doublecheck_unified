
import { Calendar, User } from "lucide-react";
import { MediaUpload } from "@/types/inspection";

interface MediaUploadWithAttribution extends MediaUpload {
  user_id?: string;
  uploaded_by_name?: string;
}

interface MediaInfoProps {
  media: MediaUploadWithAttribution;
}

export const MediaInfo = ({ media }: MediaInfoProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{formatTimestamp(media.created_at)}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-gray-500 capitalize">
          {media.type} Evidence
        </div>
        
        {media.uploaded_by_name && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <User className="w-3 h-3" />
            <span>Uploaded by {media.uploaded_by_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
