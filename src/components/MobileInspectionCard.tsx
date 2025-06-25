
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, CheckCircle2 } from "lucide-react";

interface PropertyStatus {
  status: string;
  color: string;
  textLabel: string;
  badgeColor: string;
}

interface MobileInspectionCardProps {
  property: {
    property_id: string;
    property_name: string;
    property_address: string;
    property_vrbo_url?: string | null;
    property_airbnb_url?: string | null;
    inspection_count?: number;
    completed_inspection_count?: number;
    active_inspection_count?: number;
  };
  propertyStatus: PropertyStatus;
  isSelected: boolean;
  onSelect: (propertyId: string) => void;
  onStartInspection: (propertyId: string) => void;
  isLoading?: boolean;
}

export const MobileInspectionCard: React.FC<MobileInspectionCardProps> = ({
  property,
  propertyStatus,
  isSelected,
  onSelect,
  onStartInspection,
  isLoading = false
}) => {
  const getButtonText = () => {
    if (propertyStatus.status === 'in-progress') {
      return 'Join Inspection';
    }
    return 'Start Inspection';
  };

  const handleCardTap = () => {
    onSelect(property.property_id);
  };

  const handleInspectionStart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking button
    onStartInspection(property.property_id);
  };

  return (
    <Card 
      className={`mobile-optimized-card cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
          : 'hover:shadow-md border-gray-200'
      }`}
      onClick={handleCardTap}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {property.property_name}
            </CardTitle>
            <div className="flex items-center mt-1 text-gray-600">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{property.property_address}</span>
            </div>
          </div>
          <Badge className={`ml-2 flex-shrink-0 ${propertyStatus.badgeColor}`}>
            {propertyStatus.textLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Inspection Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              {property.inspection_count || 0} total inspections
            </span>
          </div>
          {(property.completed_inspection_count || 0) > 0 && (
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
              <span className="text-green-600">
                {property.completed_inspection_count} completed
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleInspectionStart}
          disabled={isLoading}
          className={`w-full mobile-touch-target ${
            propertyStatus.status === 'in-progress'
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              {getButtonText()}
            </>
          )}
        </Button>

        {/* Quick Links */}
        {(property.property_vrbo_url || property.property_airbnb_url) && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {property.property_vrbo_url && (
              <a
                href={property.property_vrbo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                onClick={(e) => e.stopPropagation()}
              >
                View on Vrbo
              </a>
            )}
            {property.property_airbnb_url && (
              <a
                href={property.property_airbnb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                onClick={(e) => e.stopPropagation()}
              >
                View on Airbnb
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
