import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/types/inspection";

interface MediaActionsProps {
  media: MediaUpload;
  onDownload: (media: MediaUpload) => void;
  onView: (media: MediaUpload) => void;
}

export const MediaActions = ({
  media,
  onDownload,
  onView,
}: MediaActionsProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDownload(media)}
        className="h-6 w-6 p-0 hover:bg-gray-100"
      >
        <Download className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onView(media)}
        className="h-6 w-6 p-0 hover:bg-gray-100"
      >
        <ExternalLink className="w-3 h-3" />
      </Button>
    </div>
  );
};
