/**
 * Optimized Checklist Item Component for Mobile
 * Uses virtual scrolling and lazy loading for performance
 */

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Check, X, AlertCircle, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mobileOptimization } from '@/services/mobileOptimizationService';
import { reliableSubmission } from '@/services/reliableSubmissionService';
import { useOfflineInspection } from '@/hooks/useOfflineInspection';

interface OptimizedChecklistItemProps {
  item: {
    id: string;
    label: string;
    category: string;
    status: 'completed' | 'failed' | 'not_applicable' | 'pending' | null;
    notes?: string;
    media?: Array<{ url: string; type: string }>;
    ai_status?: string;
  };
  inspectionId: string;
  onStatusChange?: (itemId: string, status: string) => void;
  onPhotoCapture?: (itemId: string) => void;
  isVisible?: boolean;
}

export const OptimizedChecklistItem = memo(({ 
  item, 
  inspectionId,
  onStatusChange,
  onPhotoCapture,
  isVisible = true
}: OptimizedChecklistItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState(item.status);
  const [touchStart, setTouchStart] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const { updateChecklistItem, isOnline } = useOfflineInspection({ inspectionId });

  // Only render content if visible (virtual scrolling)
  useEffect(() => {
    if (isVisible && itemRef.current) {
      mobileOptimization.observeLazyElements();
    }
  }, [isVisible]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLocalStatus(newStatus as any);

    try {
      // Optimistic update
      if (onStatusChange) {
        onStatusChange(item.id, newStatus);
      }

      // Submit with offline support
      await updateChecklistItem(item.id, { status: newStatus });
    } catch (error) {
      // Revert on error
      setLocalStatus(item.status);
      console.error('Failed to update status', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [item.id, item.status, isSubmitting, onStatusChange, updateChecklistItem]);

  // Touch gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left to mark as failed
    if (diff > 100 && localStatus !== 'failed') {
      handleStatusChange('failed');
    }
    // Swipe right to mark as completed
    else if (diff < -100 && localStatus !== 'completed') {
      handleStatusChange('completed');
    }
  };

  const getStatusColor = () => {
    switch (localStatus) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      case 'not_applicable':
        return 'border-gray-400 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (localStatus) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <X className="w-5 h-5 text-red-600" />;
      case 'not_applicable':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  if (!isVisible) {
    // Render placeholder for virtual scrolling
    return <div style={{ height: '80px' }} />;
  }

  return (
    <div
      ref={itemRef}
      className={cn(
        'border rounded-lg p-4 mb-3 transition-all duration-200',
        getStatusColor(),
        isSubmitting && 'opacity-50'
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <h3 className="font-medium text-sm">{item.label}</h3>
          </div>
          
          {item.category && (
            <span className="text-xs text-gray-500 mt-1 block">
              {item.category}
            </span>
          )}

          {!isOnline && (
            <span className="text-xs text-orange-500 mt-1 block">
              Offline - will sync when connected
            </span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 touch-manipulation"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
          {/* Quick status buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant={localStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => handleStatusChange('completed')}
              disabled={isSubmitting}
              className="touch-manipulation"
            >
              <Check className="w-4 h-4 mr-1" />
              Pass
            </Button>
            
            <Button
              size="sm"
              variant={localStatus === 'failed' ? 'destructive' : 'outline'}
              onClick={() => handleStatusChange('failed')}
              disabled={isSubmitting}
              className="touch-manipulation"
            >
              <X className="w-4 h-4 mr-1" />
              Fail
            </Button>
            
            <Button
              size="sm"
              variant={localStatus === 'not_applicable' ? 'secondary' : 'outline'}
              onClick={() => handleStatusChange('not_applicable')}
              disabled={isSubmitting}
              className="touch-manipulation"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              N/A
            </Button>
          </div>

          {/* Photo capture button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPhotoCapture?.(item.id)}
            className="w-full touch-manipulation"
          >
            <Camera className="w-4 h-4 mr-2" />
            Add Photo
          </Button>

          {/* Notes section */}
          {item.notes && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {item.notes}
            </div>
          )}

          {/* Media thumbnails with lazy loading */}
          {item.media && item.media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {item.media.map((media, index) => (
                <img
                  key={index}
                  data-src={media.url}
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23ddd'/%3E%3C/svg%3E"
                  alt={`Photo ${index + 1}`}
                  className="w-15 h-15 object-cover rounded border"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* AI Status indicator */}
          {item.ai_status && (
            <div className={cn(
              'text-xs px-2 py-1 rounded inline-block',
              item.ai_status === 'pass' ? 'bg-green-100 text-green-700' :
              item.ai_status === 'fail' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            )}>
              AI: {item.ai_status}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

OptimizedChecklistItem.displayName = 'OptimizedChecklistItem';