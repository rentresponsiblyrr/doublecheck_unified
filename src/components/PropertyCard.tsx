
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
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
}

export const PropertyCard = ({ property, status, isSelected, onSelect }: PropertyCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onSelect(property.id)}
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
          <Badge className={`${status.color} text-white`}>
            {status.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {property.vrbo_url && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <ExternalLink className="w-4 h-4" />
            <span>View Vrbo Listing</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
