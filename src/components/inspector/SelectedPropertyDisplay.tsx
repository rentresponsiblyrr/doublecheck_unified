/**
 * Selected Property Display - Focused Component
 * 
 * Shows the currently selected property with clear visual indication
 */

import React from 'react';
import { CheckCircle, MapPin } from 'lucide-react';
import type { Property } from './PropertySelectionStep';

interface SelectedPropertyDisplayProps {
  property: Property;
}

export const SelectedPropertyDisplay: React.FC<SelectedPropertyDisplayProps> = ({
  property
}) => {
  return (
    <div 
      className="p-4 bg-green-50 border border-green-200 rounded-lg" 
      id="selected-property-display"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">Selected Property</span>
      </div>
      <div className="text-sm text-green-700">
        <div className="font-medium">{property.property_name}</div>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" />
          {property.street_address}
        </div>
      </div>
    </div>
  );
};