import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, RotateCcw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { CameraManager } from './CameraManager';
import { PhotoCapture } from './PhotoCapture';
import { FileUploadFallback } from './FileUploadFallback';
import { CaptureProgress } from './CaptureProgress';
import { FlashControls } from './FlashControls';

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

interface PhotoCaptureContainerProps {
  checklist: ChecklistItem[];
  onPhotosUpdate: (itemId: string, photos: File[]) => void;
  onStepComplete: () => void;
  className?: string;
}

export const PhotoCaptureContainer: React.FC<PhotoCaptureContainerProps> = ({
  checklist,
  onPhotosUpdate,
  onStepComplete,
  className = ''
}) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<{ [itemId: string]: File[] }>({});
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { toast } = useToast();

  const currentItem = checklist[currentItemIndex];
  const completedItems = checklist.filter(item => 
    capturedPhotos[item.id] && capturedPhotos[item.id].length > 0
  ).length;

  const handleCameraReady = useCallback((stream: MediaStream) => {
    setCameraStream(stream);
    setCameraError(null);
  }, []);

  const handleCameraError = useCallback((error: { message: string; code?: string }) => {
    setCameraError(error.message);
    setCameraStream(null);
  }, []);

  const handlePhotoTaken = useCallback(async (file: File) => {
    if (!currentItem) return;
    
    setIsCapturing(true);
    
    try {
      const currentPhotos = capturedPhotos[currentItem.id] || [];
      const updatedPhotos = [...currentPhotos, file];
      
      const newCapturedPhotos = {
        ...capturedPhotos,
        [currentItem.id]: updatedPhotos
      };
      
      setCapturedPhotos(newCapturedPhotos);
      onPhotosUpdate(currentItem.id, updatedPhotos);
      
      toast({
        title: 'Photo Captured',
        description: `Photo added to ${currentItem.title}`,
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to save photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [currentItem, capturedPhotos, onPhotosUpdate, toast]);

  const handleCaptureError = useCallback((error: Error) => {
    toast({
      title: 'Capture Failed',
      description: error.message,
      variant: 'destructive',
    });
  }, [toast]);

  const handleFlashToggle = useCallback((enabled: boolean) => {
    // Flash state handled by FlashControls component
  }, []);

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

  const handleItemSelect = (index: number) => {
    setCurrentItemIndex(index);
  };

  const completeStep = () => {
    const requiredItems = checklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => 
      capturedPhotos[item.id] && capturedPhotos[item.id].length > 0
    );
    
    if (completedRequired.length < requiredItems.length) {
      toast({
        title: 'Required Photos Missing',
        description: 'Please complete all required photo items before proceeding.',
        variant: 'destructive',
      });
      return;
    }
    
    onStepComplete();
  };

  return (
    <div id="photo-capture-container" className={`space-y-6 ${className}`}>
      <div id="progress-section">
        <CaptureProgress
          checklist={checklist}
          capturedPhotos={capturedPhotos}
          currentItemIndex={currentItemIndex}
          onItemSelect={handleItemSelect}
        />
      </div>
      
      <div id="camera-section" className="grid lg:grid-cols-2 gap-6">
        <Card id="camera-display-card">
          <CardContent className="p-6">
            {cameraError ? (
              <FileUploadFallback
                onFileSelected={handlePhotoTaken}
                onError={handleCaptureError}
                cameraError={cameraError}
              />
            ) : (
              <div id="camera-interface" className="space-y-4">
                <CameraManager
                  onCameraReady={handleCameraReady}
                  onCameraError={handleCameraError}
                />
                
                <div id="camera-controls" className="flex items-center justify-between">
                  <FlashControls
                    cameraStream={cameraStream}
                    onFlashToggle={handleFlashToggle}
                    disabled={isCapturing}
                  />
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    id="retry-camera-button"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Camera
                  </Button>
                </div>
                
                <PhotoCapture
                  cameraStream={cameraStream!}
                  onPhotoTaken={handlePhotoTaken}
                  onCaptureError={handleCaptureError}
                  isCapturing={isCapturing}
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card id="upload-fallback-card">
          <CardContent className="p-6">
            <FileUploadFallback
              onFileSelected={handlePhotoTaken}
              onError={handleCaptureError}
            />
          </CardContent>
        </Card>
      </div>
      
      <div id="navigation-section" className="flex items-center justify-between">
        <div id="navigation-buttons" className="space-x-2">
          <Button
            onClick={previousItem}
            disabled={currentItemIndex === 0}
            variant="outline"
            id="previous-item-button"
          >
            Previous Item
          </Button>
          
          <Button
            onClick={nextItem}
            disabled={currentItemIndex === checklist.length - 1}
            variant="outline"
            id="next-item-button"
          >
            Next Item
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        <Button
          onClick={completeStep}
          size="lg"
          disabled={completedItems === 0}
          id="complete-capture-step-button"
        >
          Complete Photo Capture
          <Eye className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};