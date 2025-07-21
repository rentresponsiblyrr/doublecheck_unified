import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  X,
  RotateCcw,
  FlashOff,
  FlashOn,
  Eye,
  ArrowRight,
  AlertTriangle,
  FileImage
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  evidence_type: string;
  description?: string;
  completed?: boolean;
  photos?: File[];
}

interface PhotoCaptureStepProps {
  checklist: ChecklistItem[];
  onPhotosUpdate: (itemId: string, photos: File[]) => void;
  onStepComplete: () => void;
  className?: string;
}

const PhotoCaptureStep: React.FC<PhotoCaptureStepProps> = ({
  checklist,
  onPhotosUpdate,
  onStepComplete,
  className = ''
}) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<{ [itemId: string]: File[] }>({});
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentItem = checklist[currentItemIndex];
  const completedItems = checklist.filter(item => 
    capturedPhotos[item.id] && capturedPhotos[item.id].length > 0
  ).length;
  const progressPercentage = (completedItems / checklist.length) * 100;

  React.useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      logger.error('Failed to initialize camera', error, 'PHOTO_CAPTURE_STEP');
      setCameraError('Failed to access camera. Please check permissions.');
      toast({
        title: 'Camera Access Failed',
        description: 'Please allow camera access or use file upload instead.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !currentItem) return;

    try {
      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob'));
        }, 'image/jpeg', 0.8);
      });

      // Create file from blob
      const file = new File([blob], `${currentItem.id}_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Add photo to current item
      const existingPhotos = capturedPhotos[currentItem.id] || [];
      const updatedPhotos = [...existingPhotos, file];
      
      setCapturedPhotos(prev => ({
        ...prev,
        [currentItem.id]: updatedPhotos
      }));

      onPhotosUpdate(currentItem.id, updatedPhotos);

      toast({
        title: 'Photo Captured',
        description: `Photo added for ${currentItem.title}`,
        duration: 2000,
      });

    } catch (error) {
      logger.error('Failed to capture photo', error, 'PHOTO_CAPTURE_STEP');
      toast({
        title: 'Capture Failed',
        description: 'Failed to capture photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [currentItem, capturedPhotos, onPhotosUpdate, toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !currentItem) return;

    const existingPhotos = capturedPhotos[currentItem.id] || [];
    const updatedPhotos = [...existingPhotos, ...files];
    
    setCapturedPhotos(prev => ({
      ...prev,
      [currentItem.id]: updatedPhotos
    }));

    onPhotosUpdate(currentItem.id, updatedPhotos);

    toast({
      title: 'Photos Uploaded',
      description: `${files.length} photo(s) added for ${currentItem.title}`,
      duration: 2000,
    });

    // Clear file input
    event.target.value = '';
  }, [currentItem, capturedPhotos, onPhotosUpdate, toast]);

  const removePhoto = (itemId: string, photoIndex: number) => {
    const itemPhotos = capturedPhotos[itemId] || [];
    const updatedPhotos = itemPhotos.filter((_, index) => index !== photoIndex);
    
    setCapturedPhotos(prev => ({
      ...prev,
      [itemId]: updatedPhotos
    }));

    onPhotosUpdate(itemId, updatedPhotos);
  };

  const nextItem = () => {
    if (currentItemIndex < checklist.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const previousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const canComplete = checklist.every(item => {
    if (item.required && item.evidence_type === 'photo') {
      return capturedPhotos[item.id] && capturedPhotos[item.id].length > 0;
    }
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety':
        return 'bg-red-100 text-red-800';
      case 'amenity':
        return 'bg-blue-100 text-blue-800';
      case 'cleanliness':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentItem) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">All Photos Captured!</h3>
          <Button onClick={onStepComplete}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Next Step
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo Capture
          </CardTitle>
          <Badge variant="outline">
            {currentItemIndex + 1} of {checklist.length}
          </Badge>
        </div>
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-sm text-gray-600">
            {completedItems} of {checklist.length} items completed
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Item Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{currentItem.title}</h3>
            <Badge className={getCategoryColor(currentItem.category)}>
              {currentItem.category}
            </Badge>
            {currentItem.required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
          
          {currentItem.description && (
            <p className="text-sm text-gray-600">{currentItem.description}</p>
          )}
        </div>

        {/* Camera View or Error */}
        <div className="relative">
          {cameraError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {cameraError}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              
              {/* Camera Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className="bg-black/50 text-white border-white/50"
                >
                  {flashEnabled ? <FlashOn className="w-4 h-4" /> : <FlashOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  {isCapturing ? (
                    <LoadingSpinner className="w-6 h-6" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initializeCamera}
                  className="bg-black/50 text-white border-white/50"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* File Upload Alternative */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileImage className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload photos from gallery
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG up to 10MB each
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        </div>

        {/* Captured Photos for Current Item */}
        {capturedPhotos[currentItem.id] && capturedPhotos[currentItem.id].length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Captured Photos ({capturedPhotos[currentItem.id].length})</h4>
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos[currentItem.id].map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`${currentItem.title} ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removePhoto(currentItem.id, index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={previousItem}
            disabled={currentItemIndex === 0}
          >
            Previous
          </Button>
          
          <div className="text-sm text-gray-600">
            Item {currentItemIndex + 1} of {checklist.length}
          </div>
          
          {currentItemIndex === checklist.length - 1 ? (
            <Button
              onClick={onStepComplete}
              disabled={!canComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Photo Capture
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextItem}>
              Next Item
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Progress Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Required items with photos:</span>
            <span className="font-medium">
              {checklist.filter(item => 
                item.required && 
                item.evidence_type === 'photo' && 
                capturedPhotos[item.id] && 
                capturedPhotos[item.id].length > 0
              ).length} / {checklist.filter(item => item.required && item.evidence_type === 'photo').length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoCaptureStep;
export { PhotoCaptureStep };