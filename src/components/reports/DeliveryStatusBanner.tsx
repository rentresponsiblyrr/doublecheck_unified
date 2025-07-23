/**
 * Delivery Status Banner Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface DeliveryStatusBannerProps {
  status: "pending" | "sent" | "failed";
}

export const DeliveryStatusBanner: React.FC<DeliveryStatusBannerProps> = ({
  status,
}) => {
  if (status === "pending") return null;

  return (
    <div
      className={`p-3 rounded-lg ${
        status === "sent"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <div className="flex items-center gap-2">
        {status === "sent" ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        <span className="font-medium">
          {status === "sent"
            ? "Report Delivered Successfully"
            : "Delivery Failed"}
        </span>
      </div>
    </div>
  );
};
