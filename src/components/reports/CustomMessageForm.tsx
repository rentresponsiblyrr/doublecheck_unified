/**
 * Custom Message Form Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface CustomMessageFormProps {
  customMessage: string;
  onMessageChange: (message: string) => void;
}

export const CustomMessageForm: React.FC<CustomMessageFormProps> = ({
  customMessage,
  onMessageChange
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Custom Message</label>
      <Textarea
        value={customMessage}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Enter a custom message to include with the report delivery..."
        className="min-h-32"
      />
      <p className="text-xs text-gray-500">
        This message will be included in the email to the property manager.
      </p>
    </div>
  );
};