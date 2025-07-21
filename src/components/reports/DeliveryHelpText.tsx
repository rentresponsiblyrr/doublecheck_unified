/**
 * Delivery Help Text Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';

export const DeliveryHelpText: React.FC = () => {
  return (
    <div className="text-xs text-gray-500 border-t pt-3">
      <div className="flex items-start gap-2">
        <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div>
          <p>Reports are delivered securely with tracking and delivery confirmation.</p>
          <p className="mt-1">Property managers will receive a professional package including all selected components.</p>
        </div>
      </div>
    </div>
  );
};