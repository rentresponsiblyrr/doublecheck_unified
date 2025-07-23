/**
 * Property Selector Header - Enterprise Grade
 *
 * Header with title, description, and add new property button
 */

import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PropertySelectorHeaderProps {
  totalProperties: number;
  filteredCount: number;
  isFiltered: boolean;
  onAddProperty?: () => void;
}

export const PropertySelectorHeader: React.FC<PropertySelectorHeaderProps> = ({
  totalProperties,
  filteredCount,
  isFiltered,
  onAddProperty,
}) => {
  return (
    <CardHeader id="property-selector-header">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Properties
            {isFiltered && (
              <span className="text-sm font-normal text-gray-500">
                ({filteredCount} of {totalProperties})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Select a property to start a new inspection. Virtual scrolling
            enabled for optimal performance.
          </CardDescription>
        </div>
      </div>

      {/* Add New Property Button */}
      {onAddProperty && (
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full h-12 text-blue-600 border-blue-200 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500"
            onClick={onAddProperty}
            aria-label="Add new property to inspection list"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Property
          </Button>
        </div>
      )}
    </CardHeader>
  );
};
