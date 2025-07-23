/**
 * Delivery Action Buttons Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PropertyManagerInfo } from "@/hooks/usePropertyManagerDelivery";

interface DeliveryActionButtonsProps {
  isDelivering: boolean;
  deliveryStatus: "pending" | "sent" | "failed";
  managerInfo: PropertyManagerInfo;
  onDelivery: () => void;
  onSendAgain: () => void;
}

export const DeliveryActionButtons: React.FC<DeliveryActionButtonsProps> = ({
  isDelivering,
  deliveryStatus,
  managerInfo,
  onDelivery,
  onSendAgain,
}) => {
  const isDisabled =
    isDelivering ||
    !managerInfo.name ||
    !managerInfo.email ||
    deliveryStatus === "sent";

  return (
    <div className="flex gap-2">
      <Button onClick={onDelivery} disabled={isDisabled} className="flex-1">
        {isDelivering ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" />
            Delivering...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Deliver Report
          </>
        )}
      </Button>

      {deliveryStatus === "sent" && (
        <Button variant="outline" onClick={onSendAgain} className="flex-1">
          Send Again
        </Button>
      )}
    </div>
  );
};
