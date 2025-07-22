/**
 * Reference Photo Panel - Focused Component
 * 
 * Displays reference photo controls with overlay opacity management
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronUp,
  ChevronDown,
  Maximize2
} from 'lucide-react';

interface ReferencePhotoPanelProps {
  referencePhotoUrl: string;
  showReference: boolean;
  onToggleReference: (show: boolean) => void;
  referenceOpacity: number;
  onReferenceOpacityChange: (opacity: number) => void;
  expandedView: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export const ReferencePhotoPanel: React.FC<ReferencePhotoPanelProps> = ({
  referencePhotoUrl,
  showReference,
  onToggleReference,
  referenceOpacity,
  onReferenceOpacityChange,
  expandedView,
  onToggleExpanded
}) => {
  return (
    <Card className="p-4" id="reference-photo-panel">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Reference Photo</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleReference(!showReference)}
            aria-label={showReference ? 'Hide reference photo' : 'Show reference photo'}
          >
            {showReference ? 'Hide' : 'Show'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(!expandedView)}
            aria-label="Toggle expanded view"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showReference && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Overlay Opacity</span>
            <span>{referenceOpacity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReferenceOpacityChange(Math.max(0, referenceOpacity - 10))}
              aria-label="Decrease opacity"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="flex-1 bg-gray-200 h-2 rounded-full">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${referenceOpacity}%` }}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReferenceOpacityChange(Math.min(100, referenceOpacity + 10))}
              aria-label="Increase opacity"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
