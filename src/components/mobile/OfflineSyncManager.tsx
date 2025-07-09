// Offline Sync Manager Component for STR Certified
// Handles offline data storage, sync, and conflict resolution

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Cloud,
  CloudOff,
  Download,
  Upload,
  RefreshCw,
  Wifi,
  WifiOff,
  Check,
  X,
  AlertTriangle,
  Database,
  HardDrive,
  Smartphone,
  Clock,
  ArrowUpDown,
  FileWarning,
  CheckCircle,
  Info,
  Loader2,
  Zap,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';

interface OfflineSyncManagerProps {
  className?: string;
}

interface SyncItem {
  id: string;
  type: 'inspection' | 'photo' | 'video' | 'checklist' | 'report';
  action: 'create' | 'update' | 'delete';
  data: any;
  size: number;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  error?: string;
  conflictData?: any;
}

interface SyncConflict {
  id: string;
  item: SyncItem;
  localVersion: any;
  remoteVersion: any;
  detectedAt: Date;
  resolution?: 'local' | 'remote' | 'merge';
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  failedItems: number;
  conflicts: number;
  lastSync: Date | null;
  dataUsage: {
    uploaded: number;
    downloaded: number;
  };
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({
  className
}) => {
  // State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingItems: 0,
    failedItems: 0,
    conflicts: 0,
    lastSync: null,
    dataUsage: {
      uploaded: 0,
      downloaded: 0
    }
  });
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoSync, setAutoSync] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Refs
  const syncWorker = useRef<Worker | null>(null);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize sync worker
  useEffect(() => {
    // In production, would use actual Web Worker
    // syncWorker.current = new Worker('/workers/sync-worker.js');

    // Monitor online status
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (autoSync) {
        startSync();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load saved sync queue
    loadSyncQueue();

    // Start auto-sync if online
    if (navigator.onLine && autoSync) {
      startAutoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, [autoSync]);

  // Load sync queue from storage
  const loadSyncQueue = async () => {
    try {
      const stored = localStorage.getItem('syncQueue');
      if (stored) {
        const queue = JSON.parse(stored);
        setSyncQueue(queue);
        updateSyncStatus(queue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  };

  // Save sync queue to storage
  const saveSyncQueue = useCallback((queue: SyncItem[]) => {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(queue));
      setSyncQueue(queue);
      updateSyncStatus(queue);
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }, []);

  // Update sync status based on queue
  const updateSyncStatus = (queue: SyncItem[]) => {
    const pending = queue.filter(item => item.status === 'pending').length;
    const failed = queue.filter(item => item.status === 'failed').length;
    const conflictCount = queue.filter(item => item.status === 'conflict').length;

    setSyncStatus(prev => ({
      ...prev,
      pendingItems: pending,
      failedItems: failed,
      conflicts: conflictCount
    }));
  };

  // Start auto-sync
  const startAutoSync = () => {
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
    }

    syncInterval.current = setInterval(() => {
      if (navigator.onLine && !syncStatus.isSyncing) {
        startSync();
      }
    }, 30000); // Every 30 seconds
  };

  // Start manual sync
  const startSync = async () => {
    if (!navigator.onLine || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    setSyncProgress(0);

    try {
      const queue = [...syncQueue];
      const totalItems = queue.filter(item => 
        item.status === 'pending' || item.status === 'failed'
      ).length;

      let processed = 0;

      for (const item of queue) {
        if (item.status === 'pending' || item.status === 'failed') {
          const result = await syncItem(item);
          
          if (result.success) {
            item.status = 'completed';
            setSyncStatus(prev => ({
              ...prev,
              dataUsage: {
                uploaded: prev.dataUsage.uploaded + (item.size || 0),
                downloaded: prev.dataUsage.downloaded
              }
            }));
          } else if (result.conflict) {
            item.status = 'conflict';
            const conflict: SyncConflict = {
              id: `conflict_${Date.now()}`,
              item,
              localVersion: item.data,
              remoteVersion: result.remoteData,
              detectedAt: new Date()
            };
            setConflicts(prev => [...prev, conflict]);
          } else {
            item.status = 'failed';
            item.error = result.error;
            item.retries++;
          }

          processed++;
          setSyncProgress((processed / totalItems) * 100);
        }
      }

      // Clean up completed items
      const updatedQueue = queue.filter(item => 
        item.status !== 'completed' || 
        (Date.now() - item.timestamp.getTime()) < 24 * 60 * 60 * 1000 // Keep for 24h
      );

      saveSyncQueue(updatedQueue);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Sync individual item
  const syncItem = async (item: SyncItem): Promise<{
    success: boolean;
    conflict?: boolean;
    remoteData?: any;
    error?: string;
  }> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock sync logic
        const random = Math.random();
        if (random > 0.9) {
          // Simulate conflict
          resolve({
            success: false,
            conflict: true,
            remoteData: { ...item.data, updated: 'remote' }
          });
        } else if (random > 0.8) {
          // Simulate failure
          resolve({
            success: false,
            error: 'Network timeout'
          });
        } else {
          // Success
          resolve({ success: true });
        }
      }, 500 + Math.random() * 1000);
    });
  };

  // Add item to sync queue
  const addToSyncQueue = (item: Omit<SyncItem, 'id' | 'timestamp' | 'retries' | 'status'>) => {
    const newItem: SyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retries: 0,
      status: 'pending'
    };

    const updatedQueue = [...syncQueue, newItem];
    saveSyncQueue(updatedQueue);

    // Auto-sync if online
    if (navigator.onLine && autoSync) {
      setTimeout(() => startSync(), 1000);
    }
  };

  // Resolve conflict
  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    conflict.resolution = resolution;

    // Apply resolution
    let resolvedData;
    switch (resolution) {
      case 'local':
        resolvedData = conflict.localVersion;
        break;
      case 'remote':
        resolvedData = conflict.remoteVersion;
        break;
      case 'merge':
        // Simple merge - in production would be more sophisticated
        resolvedData = { ...conflict.remoteVersion, ...conflict.localVersion };
        break;
    }

    // Update sync item
    const queueIndex = syncQueue.findIndex(item => item.id === conflict.item.id);
    if (queueIndex !== -1) {
      syncQueue[queueIndex].data = resolvedData;
      syncQueue[queueIndex].status = 'pending';
      saveSyncQueue(syncQueue);
    }

    // Remove conflict
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    setSelectedConflict(null);

    // Retry sync
    if (navigator.onLine) {
      startSync();
    }
  };

  // Clear sync queue
  const clearSyncQueue = () => {
    if (confirm('Are you sure you want to clear all pending sync items? This action cannot be undone.')) {
      setSyncQueue([]);
      localStorage.removeItem('syncQueue');
      updateSyncStatus([]);
    }
  };

  // Get storage info
  const getStorageInfo = async (): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        used,
        quota,
        percentage: quota > 0 ? (used / quota) * 100 : 0
      };
    }
    return { used: 0, quota: 0, percentage: 0 };
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time ago
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'syncing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'conflict': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection': return <FileWarning className="h-4 w-4" />;
      case 'photo': return <Database className="h-4 w-4" />;
      case 'video': return <HardDrive className="h-4 w-4" />;
      case 'checklist': return <CheckCircle className="h-4 w-4" />;
      case 'report': return <Info className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle>Offline Sync Manager</CardTitle>
              <Badge variant={syncStatus.isOnline ? 'default' : 'secondary'}>
                {syncStatus.isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
              <Button
                size="sm"
                onClick={() => startSync()}
                disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              >
                {syncStatus.isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sync Progress */}
          {syncStatus.isSyncing && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Syncing...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{syncStatus.pendingItems}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{syncStatus.failedItems}</div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{syncStatus.conflicts}</div>
              <p className="text-xs text-muted-foreground">Conflicts</p>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {formatTimeAgo(syncStatus.lastSync)}
              </div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
            </div>
          </div>

          {/* Data Usage */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span>Uploaded: {formatBytes(syncStatus.dataUsage.uploaded)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>Downloaded: {formatBytes(syncStatus.dataUsage.downloaded)}</span>
              </div>
            </div>
          </div>

          {/* Auto-sync Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Auto-sync when online</span>
            </div>
            <Button
              variant={autoSync ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoSync(!autoSync)}
            >
              {autoSync ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {syncStatus.conflicts > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sync Conflicts Detected</AlertTitle>
          <AlertDescription>
            {syncStatus.conflicts} items have conflicts that need resolution.
            <Button
              variant="link"
              size="sm"
              className="ml-2"
              onClick={() => setShowDetails(true)}
            >
              View Conflicts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!syncStatus.isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Working Offline</AlertTitle>
          <AlertDescription>
            Your changes are being saved locally and will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed View */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Queue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {syncQueue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No items in sync queue
                  </p>
                ) : (
                  syncQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <p className="text-sm font-medium">
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} - {item.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(item.size)} • {formatTimeAgo(item.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={cn('text-xs', getStatusColor(item.status))}>
                          {item.status}
                        </Badge>
                        {item.status === 'conflict' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const conflict = conflicts.find(c => c.item.id === item.id);
                              if (conflict) setSelectedConflict(conflict);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {syncQueue.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearSyncQueue}
                >
                  Clear Sync Queue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Local Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <StorageInfo />
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      {selectedConflict && (
        <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolve Sync Conflict</DialogTitle>
              <DialogDescription>
                Choose which version to keep or merge the changes.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Local Version</h4>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedConflict.localVersion, null, 2)}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Remote Version</h4>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedConflict.remoteVersion, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <RadioGroup defaultValue="local" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local">Keep local version</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote">Keep remote version</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge">Merge both versions</Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedConflict(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const resolution = (document.querySelector('input[name="radio-group"]:checked') as HTMLInputElement)?.value as any;
                  resolveConflict(selectedConflict.id, resolution || 'local');
                }}
              >
                Resolve Conflict
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Storage Info Component
const StorageInfo: React.FC = () => {
  const [storage, setStorage] = useState<{
    used: number;
    quota: number;
    percentage: number;
  }>({ used: 0, quota: 0, percentage: 0 });

  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
        });
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Storage Usage</span>
        </div>
        <span className="text-sm font-medium">
          {formatBytes(storage.used)} / {formatBytes(storage.quota)}
        </span>
      </div>
      <Progress value={storage.percentage} className="h-2" />
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Used</p>
          <p className="font-medium">{formatBytes(storage.used)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Available</p>
          <p className="font-medium">{formatBytes(storage.quota - storage.used)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Percentage</p>
          <p className="font-medium">{storage.percentage.toFixed(1)}%</p>
        </div>
      </div>
      {storage.percentage > 80 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Storage is {storage.percentage.toFixed(0)}% full. Consider clearing old data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};