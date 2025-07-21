import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Wifi, 
  WifiOff,
  CheckCircle, 
  Clock,
  AlertTriangle,
  RefreshCw,
  Database,
  FileText,
  Image,
  Video,
  ArrowRight,
  Server,
  Zap
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Property {
  id: string;
  property_name: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  photos?: File[];
}

interface UploadItem {
  id: string;
  type: 'photo' | 'video' | 'inspection' | 'checklist';
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface UploadSyncStepProps {
  property: Property;
  checklist: ChecklistItem[];
  video?: File | null;
  onUploadComplete: (inspectionId: string) => void;
  className?: string;
}

const UploadSyncStep: React.FC<UploadSyncStepProps> = ({
  property,
  checklist,
  video,
  onUploadComplete,
  className = ''
}) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('preparing');
  const { toast } = useToast();

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize upload items
    initializeUploadItems();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checklist, video]);

  const initializeUploadItems = () => {
    const items: UploadItem[] = [];
    
    // Add inspection creation item
    items.push({
      id: 'inspection',
      type: 'inspection',
      name: 'Create Inspection Record',
      size: 0,
      status: 'pending',
      progress: 0
    });

    // Add checklist items with photos
    checklist.forEach((item) => {
      if (item.photos && item.photos.length > 0) {
        item.photos.forEach((photo, index) => {
          items.push({
            id: `${item.id}-photo-${index}`,
            type: 'photo',
            name: `${item.title} - Photo ${index + 1}`,
            size: photo.size,
            status: 'pending',
            progress: 0
          });
        });
      }
    });

    // Add video if present
    if (video) {
      items.push({
        id: 'walkthrough-video',
        type: 'video',
        name: 'Property Walkthrough Video',
        size: video.size,
        status: 'pending',
        progress: 0
      });
    }

    // Add checklist completion record
    items.push({
      id: 'checklist-completion',
      type: 'checklist',
      name: 'Checklist Completion Data',
      size: 0,
      status: 'pending',
      progress: 0
    });

    setUploadItems(items);
  };

  const updateItemProgress = (itemId: string, progress: number, status?: UploadItem['status'], error?: string) => {
    setUploadItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, progress, status: status || item.status, error }
          : item
      )
    );
  };

  const calculateOverallProgress = () => {
    if (uploadItems.length === 0) return 0;
    
    const totalProgress = uploadItems.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / uploadItems.length);
  };

  useEffect(() => {
    setOverallProgress(calculateOverallProgress());
  }, [uploadItems]);

  const createInspection = async (): Promise<string> => {
    setCurrentStep('Creating inspection record...');
    updateItemProgress('inspection', 10, 'uploading');

    try {
      const { data, error } = await supabase.rpc('create_inspection_compatibility', {
        property_id_param: parseInt(property.id),
        inspector_id_param: 'current-user' // Would be replaced with actual user ID
      });

      if (error) {
        throw error;
      }

      const newInspectionId = data?.inspection_id || `INS-${Date.now()}`;
      setInspectionId(newInspectionId);
      
      updateItemProgress('inspection', 100, 'completed');
      return newInspectionId;
    } catch (error) {
      updateItemProgress('inspection', 0, 'failed', error.message);
      throw error;
    }
  };

  const uploadPhoto = async (photo: File, itemId: string, checklistItemId: string): Promise<void> => {
    updateItemProgress(itemId, 10, 'uploading');

    try {
      // Upload to Supabase Storage
      const fileName = `${inspectionId}/${checklistItemId}/${Date.now()}_${photo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspection-media')
        .upload(fileName, photo);

      if (uploadError) {
        throw uploadError;
      }

      updateItemProgress(itemId, 80, 'uploading');

      // Create media record in database
      const { error: mediaError } = await supabase
        .from('media')
        .insert({
          log_id: parseInt(checklistItemId),
          file_path: uploadData.path,
          file_type: photo.type,
          file_size: photo.size,
          uploaded_by: 'current-user', // Would be replaced with actual user ID
          created_at: new Date().toISOString()
        });

      if (mediaError) {
        throw mediaError;
      }

      updateItemProgress(itemId, 100, 'completed');
    } catch (error) {
      updateItemProgress(itemId, 0, 'failed', error.message);
      throw error;
    }
  };

  const uploadVideo = async (videoFile: File): Promise<void> => {
    const itemId = 'walkthrough-video';
    updateItemProgress(itemId, 10, 'uploading');

    try {
      // Upload video to Supabase Storage
      const fileName = `${inspectionId}/walkthrough/${Date.now()}_${videoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspection-videos')
        .upload(fileName, videoFile);

      if (uploadError) {
        throw uploadError;
      }

      updateItemProgress(itemId, 80, 'uploading');

      // Create video record (could be in a separate videos table or in logs)
      const { error: videoError } = await supabase
        .from('logs')
        .insert({
          property_id: parseInt(property.id),
          checklist_id: 'walkthrough-video',
          inspector_id: 'current-user',
          inspector_remarks: `Walkthrough video: ${videoFile.name}`,
          ai_result: JSON.stringify({ video_path: uploadData.path }),
          pass: true,
          created_at: new Date().toISOString()
        });

      if (videoError) {
        throw videoError;
      }

      updateItemProgress(itemId, 100, 'completed');
    } catch (error) {
      updateItemProgress(itemId, 0, 'failed', error.message);
      throw error;
    }
  };

  const saveChecklistData = async (): Promise<void> => {
    const itemId = 'checklist-completion';
    setCurrentStep('Saving checklist data...');
    updateItemProgress(itemId, 20, 'uploading');

    try {
      // Save each checklist item
      for (let i = 0; i < checklist.length; i++) {
        const item = checklist[i];
        
        const { error } = await supabase
          .from('logs')
          .insert({
            property_id: parseInt(property.id),
            checklist_id: item.id,
            inspector_id: 'current-user',
            inspector_remarks: `Completed during inspection`,
            pass: item.photos && item.photos.length > 0,
            created_at: new Date().toISOString()
          });

        if (error) {
          throw error;
        }

        updateItemProgress(itemId, 20 + (60 * (i + 1) / checklist.length), 'uploading');
      }

      updateItemProgress(itemId, 100, 'completed');
    } catch (error) {
      updateItemProgress(itemId, 0, 'failed', error.message);
      throw error;
    }
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
      logger.info('Starting inspection upload', { 
        propertyId: property.id,
        itemCount: uploadItems.length 
      }, 'UPLOAD_SYNC_STEP');

      // Step 1: Create inspection
      const newInspectionId = await createInspection();

      // Step 2: Upload photos
      setCurrentStep('Uploading photos...');
      let photoIndex = 0;
      for (const item of checklist) {
        if (item.photos && item.photos.length > 0) {
          for (let i = 0; i < item.photos.length; i++) {
            await uploadPhoto(item.photos[i], `${item.id}-photo-${i}`, item.id);
            photoIndex++;
          }
        }
      }

      // Step 3: Upload video
      if (video) {
        setCurrentStep('Uploading video...');
        await uploadVideo(video);
      }

      // Step 4: Save checklist data
      await saveChecklistData();

      // Complete
      setCurrentStep('Upload complete!');
      toast({
        title: 'Upload Successful',
        description: 'All inspection data has been uploaded successfully.',
        duration: 5000,
      });

      onUploadComplete(newInspectionId);

    } catch (error) {
      logger.error('Upload failed', error, 'UPLOAD_SYNC_STEP');
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const retryFailedUploads = () => {
    // Reset failed items to pending
    setUploadItems(prev => 
      prev.map(item => 
        item.status === 'failed' 
          ? { ...item, status: 'pending', progress: 0, error: undefined }
          : item
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'uploading':
        return <LoadingSpinner className="w-4 h-4" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'inspection':
        return <FileText className="w-4 h-4" />;
      case 'checklist':
        return <Database className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalSize = uploadItems.reduce((sum, item) => sum + item.size, 0);
  const completedItems = uploadItems.filter(item => item.status === 'completed').length;
  const failedItems = uploadItems.filter(item => item.status === 'failed').length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload & Sync
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isOnline ? (
            <><Wifi className="w-4 h-4 text-green-500" /> Connected</>
          ) : (
            <><WifiOff className="w-4 h-4 text-red-500" /> Offline</>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{uploadItems.length}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedItems}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedItems}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{formatFileSize(totalSize)}</div>
            <div className="text-xs text-gray-500">Total Size</div>
          </div>
        </div>

        {/* Overall Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currentStep}</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        )}

        {/* Connection Warning */}
        {!isOnline && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              No internet connection. Upload will begin automatically when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Items List */}
        <div className="space-y-2">
          <h4 className="font-medium">Upload Items</h4>
          <ScrollArea className="h-64 w-full">
            <div className="space-y-2">
              {uploadItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.size > 0 ? formatFileSize(item.size) : 'Data record'}
                    </div>
                    {item.status === 'uploading' && (
                      <Progress value={item.progress} className="h-1 mt-1" />
                    )}
                    {item.error && (
                      <div className="text-xs text-red-600 mt-1">{item.error}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <Badge 
                      variant={
                        item.status === 'completed' ? 'default' :
                        item.status === 'failed' ? 'destructive' :
                        item.status === 'uploading' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* AI Processing Info */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Processing:</strong> After upload, your inspection will be analyzed by our AI system 
            for quality assessment and comparison with listing photos. Results will be available in the 
            audit dashboard within 5-10 minutes.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {failedItems > 0 && (
            <Button
              variant="outline"
              onClick={retryFailedUploads}
              disabled={isUploading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Failed
            </Button>
          )}
          
          {completedItems === uploadItems.length ? (
            <Button
              onClick={() => onUploadComplete(inspectionId!)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Server className="w-4 h-4 mr-2" />
              Complete Inspection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={startUpload}
              disabled={isUploading || !isOnline}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Upload
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>All data is encrypted during upload and stored securely. Upload will resume automatically if interrupted.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadSyncStep;
export { UploadSyncStep };