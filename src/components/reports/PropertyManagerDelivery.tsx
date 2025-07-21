/**
 * Property Manager Delivery Component - SURGICALLY REFACTORED
 * 
 * SURGICAL REFACTORING APPLIED:
 * ✅ Extracted business logic to usePropertyManagerDelivery hook
 * ✅ Decomposed into focused sub-components
 * ✅ Preserved exact functionality and behavior
 * ✅ Maintained type safety and form validation
 * ✅ Reduced from 496 lines to <300 lines using composition
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Send } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Extracted business logic hook
import { usePropertyManagerDelivery } from '@/hooks/usePropertyManagerDelivery';

// Extracted UI components
import { DeliveryStatusBanner } from './DeliveryStatusBanner';
import { PropertyManagerInfoForm } from './PropertyManagerInfoForm';
import { DeliveryOptionsForm } from './DeliveryOptionsForm';
import { CustomMessageForm } from './CustomMessageForm';
import { DeliverySummaryPanel } from './DeliverySummaryPanel';
import { DeliveryActionButtons } from './DeliveryActionButtons';
import { DeliveryHelpText } from './DeliveryHelpText';

interface PropertyManagerDeliveryProps {
  inspectionId: string;
  propertyId: string;
  propertyName: string;
  className?: string;
}

const PropertyManagerDelivery: React.FC<PropertyManagerDeliveryProps> = ({
  inspectionId,
  propertyId,
  propertyName,
  className = ''
}) => {
  const {
    managerInfo,
    deliveryOptions,
    customMessage,
    isDelivering,
    deliveryStatus,
    isLoadingProperty,
    setCustomMessage,
    handleDelivery,
    updateManagerInfo,
    updateDeliveryOption,
    resetDeliveryStatus
  } = usePropertyManagerDelivery(inspectionId, propertyId, propertyName);

  if (isLoadingProperty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Property Manager Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Property Manager Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Status */}
        <DeliveryStatusBanner status={deliveryStatus} />

        {/* Property Manager Information */}
        <PropertyManagerInfoForm
          managerInfo={managerInfo}
          onUpdateManagerInfo={updateManagerInfo}
        />

        <Separator />

        {/* Delivery Options */}
        <DeliveryOptionsForm
          deliveryOptions={deliveryOptions}
          onUpdateDeliveryOption={updateDeliveryOption}
        />

        <Separator />

        {/* Custom Message */}
        <CustomMessageForm
          customMessage={customMessage}
          onMessageChange={setCustomMessage}
        />

        {/* Delivery Summary */}
        <DeliverySummaryPanel
          managerInfo={managerInfo}
          deliveryOptions={deliveryOptions}
        />

        {/* Action Buttons */}
        <DeliveryActionButtons
          isDelivering={isDelivering}
          deliveryStatus={deliveryStatus}
          managerInfo={managerInfo}
          onDelivery={handleDelivery}
          onSendAgain={resetDeliveryStatus}
        />

        {/* Help Text */}
        <DeliveryHelpText />
      </CardContent>
    </Card>
  );
};

export default PropertyManagerDelivery;
export { PropertyManagerDelivery };