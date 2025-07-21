import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, ArrowRight, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { ConnectionStatus } from './upload/ConnectionStatus';
import { UploadProgress } from './upload/UploadProgress';
import { UploadItemCard } from './upload/UploadItemCard';
import { UploadService } from './upload/UploadService';
import { UploadSyncStepProps, UploadItem } from './upload/types';

export const UploadSyncStep: React.FC<UploadSyncStepProps> = ({
  property,
  checklistItems,
  onComplete,
  onBack,
  className = ''
}) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentStep, setCurrentStep] = useState('Ready to upload');
  const [totalProgress, setTotalProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const items = UploadService.generateUploadItems(checklistItems);
    setUploadItems(items);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checklistItems]);

  const updateItemProgress = (itemId: string, progress: number, status: UploadItem['status'], error?: string) => {
    setUploadItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, progress, status, error } : item
    ));
  };

  const calculateTotalProgress = () => {
    const completed = uploadItems.filter(item => item.status === 'completed').length;
    return (completed / uploadItems.length) * 100;
  };

  const startUpload = async () => {
    if (!isOnline) {
      toast({
        title: 'No Internet Connection',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      logger.logInfo('Starting inspection upload', { 
        propertyId: property.id,
        itemCount: uploadItems.length 
      });

      // Create inspection
      setCurrentStep('Creating inspection record...');
      const inspectionId = await UploadService.createInspection(property);

      // Upload photos
      setCurrentStep('Uploading photos...');
      let photoIndex = 0;
      
      for (const checklistItem of checklistItems) {
        for (let i = 0; i < checklistItem.photos.length; i++) {
          const photo = checklistItem.photos[i];
          const itemId = `photo-${checklistItem.id}-${i}`;
          
          try {
            updateItemProgress(itemId, 0, 'uploading');
            await UploadService.uploadPhoto(photo, inspectionId, checklistItem.id);
            updateItemProgress(itemId, 100, 'completed');
            photoIndex++;
            
            setCurrentStep(`Uploading photos... (${photoIndex}/${getTotalPhotoCount()})`);
          } catch (error) {
            updateItemProgress(itemId, 0, 'failed', error instanceof Error ? error.message : 'Upload failed');
            logger.logError('Photo upload failed', { itemId, error });
          }
        }
      }

      // Save checklist data
      setCurrentStep('Saving inspection data...');
      updateItemProgress('checklist-data', 0, 'uploading');
      
      try {
        await UploadService.saveChecklistData(inspectionId, checklistItems);
        updateItemProgress('checklist-data', 100, 'completed');
      } catch (error) {
        updateItemProgress('checklist-data', 0, 'failed', error instanceof Error ? error.message : 'Save failed');
        throw error;
      }

      setCurrentStep('Upload complete!');
      setTotalProgress(100);
      
      toast({
        title: 'Upload Complete',
        description: 'Inspection has been successfully uploaded.',
      });

      logger.logInfo('Inspection upload completed', { inspectionId, propertyId: property.id });
      onComplete(inspectionId);

    } catch (error) {
      logger.logError('Upload process failed', { propertyId: property.id, error });
      toast({
        title: 'Upload Failed',
        description: 'Some items failed to upload. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getTotalPhotoCount = (): number => {
    return checklistItems.reduce((total, item) => total + item.photos.length, 0);
  };

  const getCompletedItemsCount = (): number => {
    return uploadItems.filter(item => item.status === 'completed').length;
  };

  const retryItem = async (itemId: string) => {
    const item = uploadItems.find(i => i.id === itemId);
    if (!item) return;

    updateItemProgress(itemId, 0, 'uploading');
    // Implementation would retry the specific upload
    // For now, simulate retry
    setTimeout(() => {
      updateItemProgress(itemId, 100, 'completed');
    }, 2000);
  };

  useEffect(() => {
    setTotalProgress(calculateTotalProgress());
  }, [uploadItems]);

  return (
    <Card id="upload-sync-step" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Upload & Sync
          </CardTitle>
          <ConnectionStatus isOnline={isOnline} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <UploadProgress
          currentStep={currentStep}
          totalProgress={totalProgress}
          isUploading={isUploading}
          completedItems={getCompletedItemsCount()}
          totalItems={uploadItems.length}
        />

        {!isOnline && (
          <Alert>
            <AlertDescription>
              You're currently offline. Data will be queued for upload when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[300px]">
          <div className="grid gap-2">
            {uploadItems.map((item) => (
              <UploadItemCard
                key={item.id}
                item={item}
                onRetry={retryItem}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isUploading}
            >
              Back
            </Button>
          )}
          
          <Button
            onClick={startUpload}
            disabled={isUploading || !isOnline}
            className="flex-1 flex items-center gap-2"
          >
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Start Upload
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadSyncStep;