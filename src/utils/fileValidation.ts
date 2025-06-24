
import { useToast } from "@/hooks/use-toast";

export interface FileValidationResult {
  isValid: boolean;
  detectedType: 'photo' | 'video';
}

export const useFileValidation = () => {
  const { toast } = useToast();

  const validateFile = (file: File): FileValidationResult => {
    // Detect the actual file type based on MIME type
    const isPhoto = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const detectedType: 'photo' | 'video' = isPhoto ? 'photo' : 'video';

    if (!isPhoto && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please select a photo or video file.",
        variant: "destructive",
      });
      return { isValid: false, detectedType };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return { isValid: false, detectedType };
    }

    return { isValid: true, detectedType };
  };

  return { validateFile };
};
