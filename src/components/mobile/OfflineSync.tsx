import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Clock,
  X
} from 'lucide-react';
import { syncService } from '@/services/syncService';
import { offlineStorageService } from '@/services/offlineStorageService';
import { logger } from '@/utils/logger';

// Types from InspectorWorkflow
interface InspectionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  required: boolean;
  data?: any;
}

interface OfflineSyncProps {
  inspectionData: InspectionStep[];
  propertyId?: string;
  onSyncComplete: () => void;
  progress?: number;
}

interface SyncItem {
  id: string;
  type: 'checklist' | 'photo' | 'video' | 'metadata';
  name: string;
  size: number;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export function OfflineSync({ 
  inspectionData, 
  propertyId, 
  onSyncComplete,
  progress: externalProgress = 0
}: OfflineSyncProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [currentSyncItem, setCurrentSyncItem] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [uploadedSize, setUploadedSize] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [syncSpeed, setSyncSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [realSyncProgress, setRealSyncProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [pendingItems, setPendingItems] = useState(0);

  // Monitor online status and sync service
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup sync service listeners
    const syncProgressListener = (progress: any) => {
      setRealSyncProgress(progress);
      setOverallProgress(progress.total > 0 ? (progress.current / progress.total) * 100 : 0);
      setSyncStatus(progress.status);
    };

    const syncStatusListener = (status: any) => {
      setIsOnline(status.isOnline);
      setPendingItems(status.totalSyncItems);
    };

    syncService.addSyncListener(syncProgressListener);
    syncService.addStatusListener(syncStatusListener);

    // Get initial sync status
    syncService.getSyncStatus().then(status => {
      setPendingItems(status.totalSyncItems);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncService.removeSyncListener(syncProgressListener);
      syncService.removeStatusListener(syncStatusListener);
    };
  }, []);

  // Generate sync items from inspection data
  useEffect(() => {
    if (inspectionData.length > 0) {
      const items: SyncItem[] = [];
      let totalSizeCalc = 0;

      // Add checklist data
      items.push({
        id: 'checklist_data',
        type: 'checklist',
        name: 'Checklist Data',
        size: 50 * 1024, // 50KB
        status: 'pending',
        progress: 0
      });
      totalSizeCalc += 50 * 1024;

      // Add photos from completed steps
      inspectionData.forEach((step, index) => {
        if (step.status === 'completed' && step.data) {
          items.push({
            id: `photo_${step.id}`,
            type: 'photo',
            name: `Photo - ${step.title}`,
            size: 2 * 1024 * 1024, // 2MB per photo
            status: 'pending',
            progress: 0
          });
          totalSizeCalc += 2 * 1024 * 1024;
        }
      });

      // Add video if available
      const videoStep = inspectionData.find(step => step.id === 'video_walkthrough');
      if (videoStep && videoStep.status === 'completed') {
        items.push({
          id: 'video_walkthrough',
          type: 'video',
          name: 'Property Video Walkthrough',
          size: 100 * 1024 * 1024, // 100MB
          status: 'pending',
          progress: 0
        });
        totalSizeCalc += 100 * 1024 * 1024;
      }

      // Add metadata
      items.push({
        id: 'metadata',
        type: 'metadata',
        name: 'Inspection Metadata',
        size: 10 * 1024, // 10KB
        status: 'pending',
        progress: 0
      });
      totalSizeCalc += 10 * 1024;

      setSyncItems(items);
      setTotalSize(totalSizeCalc);
    }
  }, [inspectionData]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format sync speed
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  // Simulate sync process
  const simulateSyncItem = useCallback(async (item: SyncItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let bytesUploaded = 0;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const increment = Math.min(item.size / 20, item.size - bytesUploaded); // Upload in 20 chunks
        bytesUploaded += increment;
        
        const progress = (bytesUploaded / item.size) * 100;
        
        // Update item progress
        setSyncItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, progress, status: 'syncing' } : i
        ));
        
        // Update overall progress
        setUploadedSize(prev => prev + increment);
        
        // Calculate speed
        const speed = bytesUploaded / (elapsed / 1000);
        setSyncSpeed(speed);
        
        // Calculate time remaining
        const remainingBytes = totalSize - uploadedSize - bytesUploaded;
        const timeRemaining = remainingBytes / speed;
        setEstimatedTimeRemaining(timeRemaining);
        
        // Complete this item
        if (bytesUploaded >= item.size) {
          clearInterval(interval);
          setSyncItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress: 100, status: 'completed' } : i
          ));
          
          // Simulate potential errors (5% chance)
          if (Math.random() < 0.05) {
            setSyncItems(prev => prev.map(i => 
              i.id === item.id ? { ...i, status: 'error', error: 'Upload failed' } : i
            ));
            reject(new Error('Upload failed'));
          } else {
            resolve();
          }
        }
      }, 100);
    });
  }, [totalSize, uploadedSize]);

  // Start sync process using real sync service
  const startSync = useCallback(async () => {
    if (!isOnline) {
      setError('No internet connection. Please check your connection and try again.');
      return;
    }

    setSyncStatus('syncing');
    setError(null);
    setOverallProgress(0);
    setUploadedSize(0);

    try {
      logger.info('Starting sync from OfflineSync component', {}, 'OFFLINE_SYNC');
      
      // Use real sync service
      const syncResult = await syncService.forceSyncNow();
      
      if (syncResult) {
        setSyncStatus('completed');
        setCurrentSyncItem(null);
        onSyncComplete();
        
        logger.info('Sync completed successfully', {}, 'OFFLINE_SYNC');
      } else {
        throw new Error('Sync failed');
      }
      
    } catch (err) {
      setSyncStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      logger.error('Sync failed', err, 'OFFLINE_SYNC');
    }
  }, [isOnline, onSyncComplete]);

  // Retry failed items using real sync service
  const retryFailedItems = useCallback(async () => {
    setSyncStatus('syncing');
    setError(null);
    
    try {
      logger.info('Retrying failed sync items', {}, 'OFFLINE_SYNC');
      
      // Clear failed items and retry
      await syncService.retryFailedSyncItems();
      
      // Force sync again
      const syncResult = await syncService.forceSyncNow();
      
      if (syncResult) {
        setSyncStatus('completed');
        setCurrentSyncItem(null);
        onSyncComplete();
      } else {
        throw new Error('Retry failed');
      }
      
    } catch (err) {
      setSyncStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
      logger.error('Retry failed', err, 'OFFLINE_SYNC');
    }
  }, [onSyncComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return '📸';
      case 'video': return '🎥';
      case 'checklist': return '📋';
      case 'metadata': return '📄';
      default: return '📁';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={`border-2 ${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
            {isOnline ? 'Online' : 'Offline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isOnline ? 
                  'Ready to sync inspection data to cloud storage' : 
                  'No internet connection. Data will sync when connection is restored.'
                }
              </p>
              {pendingItems > 0 && (
                <p className="text-sm font-medium mt-1">
                  {pendingItems} items ready to sync
                </p>
              )}
            </div>
            
            {syncStatus === 'idle' && isOnline && (
              <Button 
                onClick={startSync} 
                disabled={pendingItems === 0}
                className="h-12 px-6 text-base touch-manipulation"
              >
                <Upload className="h-5 w-5 mr-2" />
                Start Sync
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Progress */}
      {syncStatus === 'syncing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              Syncing Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Sync Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Progress:</span>
                <span className="font-medium ml-2">{realSyncProgress.current} / {realSyncProgress.total}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="font-medium ml-2">{realSyncProgress.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium ml-2">{pendingItems} items</span>
              </div>
              <div>
                <span className="text-gray-600">Connection:</span>
                <span className="font-medium ml-2">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Items */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${
                  currentSyncItem === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(item.type)}</span>
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{formatFileSize(item.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.status === 'syncing' && (
                      <span className="text-sm text-blue-600">{Math.round(item.progress)}%</span>
                    )}
                    {getStatusIcon(item.status)}
                  </div>
                </div>
                
                {item.status === 'syncing' && (
                  <div className="mt-2">
                    <Progress value={item.progress} className="h-1" />
                  </div>
                )}
                
                {item.status === 'error' && item.error && (
                  <div className="mt-2">
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {item.error}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryFailedItems}
                className="h-10 px-4 text-base touch-manipulation"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Failed Items
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Completion State */}
      {syncStatus === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">
              Sync Complete!
            </h3>
            <p className="text-green-700">
              All inspection data has been successfully uploaded to the cloud.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Offline Tips */}
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Working Offline</AlertTitle>
          <AlertDescription>
            Your inspection data is saved locally and will automatically sync when you're back online.
            You can continue working on other inspections in the meantime.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OfflineSync;