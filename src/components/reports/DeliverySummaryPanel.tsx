/**
 * Delivery Summary Panel Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from "react";
import { Mail, FileText, Calendar } from "lucide-react";
import {
  PropertyManagerInfo,
  DeliveryOptions,
} from "@/hooks/usePropertyManagerDelivery";

interface DeliverySummaryPanelProps {
  managerInfo: PropertyManagerInfo;
  deliveryOptions: DeliveryOptions;
}

export const DeliverySummaryPanel: React.FC<DeliverySummaryPanelProps> = ({
  managerInfo,
  deliveryOptions,
}) => {
  const getAttachments = () => {
    return (
      [
        deliveryOptions.includeReport && "Inspection Report",
        deliveryOptions.includePhotos && "Photos",
        deliveryOptions.includeRecommendations && "Recommendations",
      ]
        .filter(Boolean)
        .join(", ") || "None selected"
    );
  };

  const formatDeliveryMethod = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
      <h5 className="font-medium text-sm">Delivery Summary</h5>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3" />
          <span>
            Recipient: {managerInfo.name || "Not specified"} (
            {managerInfo.email || "Not specified"})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3" />
          <span>Attachments: {getAttachments()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>
            Method: {formatDeliveryMethod(deliveryOptions.deliveryMethod)}
          </span>
        </div>
      </div>
    </div>
  );
};
