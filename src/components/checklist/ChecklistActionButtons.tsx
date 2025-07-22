/**
 * Checklist Action Buttons - Enterprise Grade
 * 
 * Action buttons for checklist item status updates with loading states
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, MinusCircle } from 'lucide-react';
import type { SaveState } from './ChecklistStateManager';

interface ChecklistActionButtonsProps {
  saveState: SaveState;
  onStatusChange: (status: 'completed' | 'failed' | 'not_applicable') => Promise<void>;
  isOnline: boolean;
}

export const ChecklistActionButtons: React.FC<ChecklistActionButtonsProps> = ({
  saveState,
  onStatusChange,
  isOnline
}) => {
  const getButtonProps = (disabled: boolean) => ({
    disabled: disabled || saveState === 'saving' || !isOnline,
    className: `w-full h-12 disabled:opacity-50 transition-all duration-200 ${
      saveState === 'saving' ? 'animate-pulse' : ''
    }`
  });

  const renderLoadingSpinner = () => (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
  );

  return (
    <div id="checklist-action-buttons" className="grid grid-cols-1 gap-3 w-full">
      {/* Pass Button */}
      <Button
        onClick={() => onStatusChange('completed')}
        variant="default"
        size="lg"
        {...getButtonProps(false)}
        className={`${getButtonProps(false).className} bg-green-600 hover:bg-green-700 focus:ring-green-500`}
        aria-label="Mark item as passed"
      >
        {saveState === 'saving' ? renderLoadingSpinner() : <CheckCircle className="w-5 h-5 mr-2" />}
        {saveState === 'saving' ? 'Saving...' : 'Pass'}
      </Button>

      {/* Fail Button */}
      <Button
        onClick={() => onStatusChange('failed')}
        variant="destructive"
        size="lg"
        {...getButtonProps(false)}
        aria-label="Mark item as failed"
      >
        {saveState === 'saving' ? renderLoadingSpinner() : <X className="w-5 h-5 mr-2" />}
        {saveState === 'saving' ? 'Saving...' : 'Fail'}
      </Button>

      {/* Not Applicable Button */}
      <Button
        onClick={() => onStatusChange('not_applicable')}
        variant="outline"
        size="lg"
        {...getButtonProps(false)}
        className={`${getButtonProps(false).className} border-gray-300 hover:bg-gray-50`}
        aria-label="Mark item as not applicable"
      >
        {saveState === 'saving' ? renderLoadingSpinner() : <MinusCircle className="w-5 h-5 mr-2" />}
        {saveState === 'saving' ? 'Saving...' : 'Not Applicable'}
      </Button>
    </div>
  );
};