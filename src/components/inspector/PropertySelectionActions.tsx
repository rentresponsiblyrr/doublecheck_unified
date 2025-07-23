/**
 * Property Selection Actions - Focused Component
 *
 * Handles action buttons for property selection workflow
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Property } from "./PropertySelectionStep";

interface PropertySelectionActionsProps {
  selectedProperty?: Property | null;
  isSelecting: boolean;
  onRefresh: () => void;
}

export const PropertySelectionActions: React.FC<
  PropertySelectionActionsProps
> = ({ selectedProperty, isSelecting, onRefresh }) => {
  return (
    <div className="flex gap-2 pt-4 border-t" id="property-selection-actions">
      <Button
        onClick={onRefresh}
        variant="outline"
        className="flex-1"
        disabled={isSelecting}
      >
        Refresh List
      </Button>

      {selectedProperty && (
        <Button
          className="flex-1"
          disabled={isSelecting}
          aria-label={`Continue with ${selectedProperty.property_name}`}
        >
          {isSelecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Proceeding...
            </>
          ) : (
            <>
              Continue with Selected Property
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};
