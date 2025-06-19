
import { Wifi, WifiOff, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

export const OfflineIndicator = () => {
  const { isOnline, getOfflinePhotosCount, clearUploadedPhotos } = useOfflineStorage();
  const offlineCount = getOfflinePhotosCount();

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Status */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Offline Photos Count */}
      {offlineCount > 0 && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Upload className="w-3 h-3 mr-1" />
          {offlineCount} pending
        </Badge>
      )}

      {/* Clear Uploaded Photos Button (only show if online and have uploaded photos) */}
      {isOnline && offlineCount === 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearUploadedPhotos}
          className="text-xs px-2 py-1 h-auto"
        >
          Clear cache
        </Button>
      )}
    </div>
  );
};
