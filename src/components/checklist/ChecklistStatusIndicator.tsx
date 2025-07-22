/**
 * Checklist Status Indicator - Enterprise Grade
 * 
 * Visual indicators for save state, network status, and error states
 */

import React from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SaveState } from './ChecklistStateManager';

interface ChecklistStatusIndicatorProps {
  saveState: SaveState;
  isOnline: boolean;
  errorMessage: string;
  lastSaveAttempt: Date | null;
  retryCount: number;
  autoSaveEnabled: boolean;
  onRetry: () => Promise<void>;
  onToggleAutoSave: (enabled: boolean) => void;
}

export const ChecklistStatusIndicator: React.FC<ChecklistStatusIndicatorProps> = ({
  saveState,
  isOnline,
  errorMessage,
  lastSaveAttempt,
  retryCount,
  autoSaveEnabled,
  onRetry,
  onToggleAutoSave
}) => {
  /**
   * Render save state indicator
   */
  const renderSaveStateIndicator = () => {
    switch (saveState) {
      case 'saving':
        return (
          <div className="flex items-center text-blue-600 text-xs">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-600 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>Failed</span>
          </div>
        );
      case 'conflict':
        return (
          <div className="flex items-center text-orange-600 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>Conflict</span>
          </div>
        );
      default:
        return null;
    }
  };

  /**
   * Render network status indicator
   */
  const renderNetworkStatus = () => (
    <div className={`flex items-center text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
      {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );

  return (
    <div id="checklist-status-indicator" className="space-y-3">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs border">
        <div className="flex items-center space-x-3">
          {renderNetworkStatus()}
          {renderSaveStateIndicator()}
          {lastSaveAttempt && (
            <div className="flex items-center text-gray-600">
              <Clock className="w-3 h-3 mr-1" />
              <span>Last: {lastSaveAttempt.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleAutoSave(!autoSaveEnabled)}
            className="text-xs h-6 px-2"
            aria-label={`${autoSaveEnabled ? 'Disable' : 'Enable'} auto-save`}
          >
            Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
          </Button>
          
          {(saveState === 'error' || retryCount > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-xs h-6 px-2"
              aria-label="Retry save operation"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry ({retryCount})
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {saveState === 'error' && errorMessage && (
        <Alert variant="destructive" className="text-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <Alert className="text-sm border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            You're currently offline. Changes will be saved when connection is restored.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};