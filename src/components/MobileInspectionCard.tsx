
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, CheckCircle2, Edit } from "lucide-react";
import { useFastAuth } from "@/hooks/useFastAuth";

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
  onEdit?: (propertyId: string) => void;
  isLoading?: boolean;
}

export const MobileInspectionCard: React.FC<MobileInspectionCardProps> = ({
  property,
  propertyStatus,
  isSelected,
  onSelect,
  onStartInspection,
  onEdit,
  isLoading = false
}) => {
  const { userRole, user } = useFastAuth();
  
  // Debug logging to help troubleshoot
  // REMOVED: MobileInspectionCard logging to prevent infinite render loops
  // // REMOVED: console.log('🔍 MobileInspectionCard Debug:', {
  //   userRole,
  //   hasUser: !!user,
  //   userEmail: user?.email,
  //   hasOnEdit: !!onEdit,
  //   isAdmin: userRole === 'admin'
  // });
  
  const isAdmin = userRole === 'admin';

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking edit
    // REMOVED: console.log('🔧 Edit button clicked for property:', property.property_id);
    if (onEdit) {
      onEdit(property.property_id);
    }
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
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <Badge className={`${propertyStatus.badgeColor}`}>
              {propertyStatus.textLabel}
            </Badge>
            {/* Force show edit button for debugging - remove this condition check temporarily */}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100"
                title={`Edit ${property.property_name} (Admin: ${isAdmin})`}
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Debug info for troubleshooting */}
        {user?.email?.includes('@rentresponsibly.org') && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Debug: Role={userRole}, Admin={isAdmin ? 'Yes' : 'No'}, HasEdit={onEdit ? 'Yes' : 'No'}
          </div>
        )}
        
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
