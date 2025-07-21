/**
 * Property Selection Panel Component
 * Extracted from ProductionInspectionWorkflow.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, RefreshCw, PlayCircle } from 'lucide-react';
import { ProductionProperty } from '@/services/productionDatabaseService';

interface PropertySelectionPanelProps {
  properties: ProductionProperty[];
  loading: boolean;
  onPropertySelect: (property: ProductionProperty) => void;
  onRefresh: () => void;
}

export const PropertySelectionPanel: React.FC<PropertySelectionPanelProps> = ({
  properties,
  loading,
  onPropertySelect,
  onRefresh
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="w-5 h-5 mr-2" />
          Select Property to Inspect
        </CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No properties available for inspection.</p>
            <Button onClick={onRefresh} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {properties.map((property) => (
              <Card key={property.property_id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{property.property_name}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{property.property_address}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline">
                          {property.inspection_count} inspections
                        </Badge>
                        <Badge className={
                          property.property_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {property.property_status}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => onPropertySelect(property)}
                      disabled={loading}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Inspection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};