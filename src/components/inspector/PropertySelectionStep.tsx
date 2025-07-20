/**
 * PROFESSIONAL COMPONENT - SINGLE RESPONSIBILITY PRINCIPLE
 * Property Selection Step - Does ONE thing well
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PropertySelector } from '@/components/scrapers/PropertySelector';

interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  listingUrl?: string;
  images?: string[];
}

interface PropertySelectionStepProps {
  selectedProperty: Property | null;
  onPropertySelected: (property: Property) => void;
  onTestProperty: () => void;
  isLoading?: boolean;
}

export function PropertySelectionStep({
  selectedProperty,
  onPropertySelected,
  onTestProperty,
  isLoading = false
}: PropertySelectionStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Property for Inspection</CardTitle>
        <CardDescription>
          Choose an existing property or add a new one from a listing URL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Test Property Creation Button */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h3 className="font-medium text-blue-900">Quick Test</h3>
              <p className="text-sm text-blue-700">Skip property selection with a test property</p>
            </div>
            <Button
              onClick={onTestProperty}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Use Test Property
            </Button>
          </div>

          {/* Property Selector */}
          <div>
            <h3 className="font-medium mb-4">Or Select Existing Property</h3>
            <div className="border rounded-lg p-4">
              <PropertySelector
                onPropertySelected={onPropertySelected}
                selectedProperty={selectedProperty}
              />
            </div>
          </div>

          {/* Selected Property Display */}
          {selectedProperty && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Selected Property</h4>
              <div className="text-sm text-green-700">
                <p><strong>Address:</strong> {selectedProperty.address}</p>
                <p><strong>Type:</strong> {selectedProperty.type}</p>
                <p><strong>Size:</strong> {selectedProperty.bedrooms} bed / {selectedProperty.bathrooms} bath</p>
                <p><strong>Square Feet:</strong> {selectedProperty.sqft.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}