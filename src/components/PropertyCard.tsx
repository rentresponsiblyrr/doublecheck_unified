
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";
import { PropertyActions } from "@/components/PropertyActions";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

interface PropertyStatus {
  status: string;
  color: string;
  text: string;
}

interface PropertyCardProps {
  property: Property;
  status: PropertyStatus;
  isSelected: boolean;
  onSelect: (propertyId: string) => void;
  onPropertyDeleted: () => void;
}

export const PropertyCard = ({ property, status, isSelected, onSelect, onPropertyDeleted }: PropertyCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select the property if user clicked on a link or actions menu
    if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    onSelect(property.id);
  };

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getListingInfo = () => {
    if (property.vrbo_url) {
      return { url: property.vrbo_url, platform: 'Vrbo' };
    }
    if (property.airbnb_url) {
      return { url: property.airbnb_url, platform: 'Airbnb' };
    }
    return null;
  };

  const listingInfo = getListingInfo();

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{property.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {property.address}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${status.color} text-white`}>
              {status.text}
            </Badge>
            <PropertyActions 
              property={property} 
              onPropertyDeleted={onPropertyDeleted}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {listingInfo && (
          <button
            onClick={(e) => handleLinkClick(e, listingInfo.url)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors p-2 -m-2 rounded hover:bg-blue-50"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View {listingInfo.platform} Listing</span>
          </button>
        )}
      </CardContent>
    </Card>
  );
};
