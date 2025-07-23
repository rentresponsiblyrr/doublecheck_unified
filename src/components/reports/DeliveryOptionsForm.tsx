/**
 * Delivery Options Form Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliveryOptions } from "@/hooks/usePropertyManagerDelivery";

interface DeliveryOptionsFormProps {
  deliveryOptions: DeliveryOptions;
  onUpdateDeliveryOption: (
    field: keyof DeliveryOptions,
    value: unknown,
  ) => void;
}

export const DeliveryOptionsForm: React.FC<DeliveryOptionsFormProps> = ({
  deliveryOptions,
  onUpdateDeliveryOption,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Delivery Options</h4>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeReport"
            checked={deliveryOptions.includeReport}
            onCheckedChange={(checked) =>
              onUpdateDeliveryOption("includeReport", checked)
            }
          />
          <label htmlFor="includeReport" className="text-sm font-medium">
            Include Complete Inspection Report (PDF)
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includePhotos"
            checked={deliveryOptions.includePhotos}
            onCheckedChange={(checked) =>
              onUpdateDeliveryOption("includePhotos", checked)
            }
          />
          <label htmlFor="includePhotos" className="text-sm font-medium">
            Include Photo Documentation Package
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeRecommendations"
            checked={deliveryOptions.includeRecommendations}
            onCheckedChange={(checked) =>
              onUpdateDeliveryOption("includeRecommendations", checked)
            }
          />
          <label
            htmlFor="includeRecommendations"
            className="text-sm font-medium"
          >
            Include Listing Optimization Recommendations
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="urgentIssues"
            checked={deliveryOptions.urgentIssues}
            onCheckedChange={(checked) =>
              onUpdateDeliveryOption("urgentIssues", checked)
            }
          />
          <label htmlFor="urgentIssues" className="text-sm font-medium">
            Flag Urgent Safety Issues for Immediate Attention
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="followUpRequired"
            checked={deliveryOptions.followUpRequired}
            onCheckedChange={(checked) =>
              onUpdateDeliveryOption("followUpRequired", checked)
            }
          />
          <label htmlFor="followUpRequired" className="text-sm font-medium">
            Schedule Follow-up Call/Meeting
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery Method</label>
        <Select
          value={deliveryOptions.deliveryMethod}
          onValueChange={(value) =>
            onUpdateDeliveryOption("deliveryMethod", value)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email Only</SelectItem>
            <SelectItem value="portal">Upload to Portal</SelectItem>
            <SelectItem value="both">Email + Portal Access</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
