import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface OfflinePhoto {
  id: string;
  checklistItemId: string;
  inspectionId: string;
  file: File;
  timestamp: number;
  uploaded: boolean;
}

export const useOfflineStorage = () => {
  const [offlinePhotos, setOfflinePhotos] = useState<OfflinePhoto[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    // Load offline photos from localStorage on mount
    const stored = localStorage.getItem("doublecheck_offline_photos");
    if (stored) {
      try {
        const photos = JSON.parse(stored);
        setOfflinePhotos(photos);
      } catch (error) {}
    }

    // Set up online/offline event listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Attempting to sync offline photos...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description:
          "Photos will be saved locally and synced when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const savePhotoOffline = async (
    file: File,
    checklistItemId: string,
    inspectionId: string,
  ): Promise<string> => {
    const photoId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const offlinePhoto: OfflinePhoto = {
      id: photoId,
      checklistItemId,
      inspectionId,
      file,
      timestamp: Date.now(),
      uploaded: false,
    };

    const updatedPhotos = [...offlinePhotos, offlinePhoto];
    setOfflinePhotos(updatedPhotos);

    // Save to localStorage (note: this won't work for large files in production)
    try {
      localStorage.setItem(
        "doublecheck_offline_photos",
        JSON.stringify(
          updatedPhotos.map((photo) => ({
            ...photo,
            file: null, // Don't store the actual file in localStorage
          })),
        ),
      );

      toast({
        title: "Photo saved offline",
        description: "Photo will be uploaded when you're back online.",
      });
    } catch (error) {
      toast({
        title: "Storage error",
        description: "Could not save photo offline. Storage might be full.",
        variant: "destructive",
      });
    }

    return photoId;
  };

  const getOfflinePhotosCount = () => {
    return offlinePhotos.filter((photo) => !photo.uploaded).length;
  };

  const markPhotoAsUploaded = (photoId: string) => {
    const updatedPhotos = offlinePhotos.map((photo) =>
      photo.id === photoId ? { ...photo, uploaded: true } : photo,
    );
    setOfflinePhotos(updatedPhotos);

    // Update localStorage
    localStorage.setItem(
      "doublecheck_offline_photos",
      JSON.stringify(
        updatedPhotos.map((photo) => ({
          ...photo,
          file: null,
        })),
      ),
    );
  };

  const clearUploadedPhotos = () => {
    const remainingPhotos = offlinePhotos.filter((photo) => !photo.uploaded);
    setOfflinePhotos(remainingPhotos);
    localStorage.setItem(
      "doublecheck_offline_photos",
      JSON.stringify(
        remainingPhotos.map((photo) => ({
          ...photo,
          file: null,
        })),
      ),
    );
  };

  return {
    isOnline,
    offlinePhotos,
    savePhotoOffline,
    getOfflinePhotosCount,
    markPhotoAsUploaded,
    clearUploadedPhotos,
  };
};
