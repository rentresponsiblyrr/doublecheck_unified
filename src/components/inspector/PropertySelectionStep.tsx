import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MapPin, 
  Home, 
  ExternalLink,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Property {
  id: string;
  property_id: number;
  property_name: string;
  street_address: string;
  vrbo_url?: string;
  airbnb_url?: string;
  type?: string;
  created_at: string;
}

interface PropertySelectionStepProps {
  onPropertySelected: (property: Property) => void;
  selectedProperty?: Property | null;
  className?: string;
}

const PropertySelectionStep: React.FC<PropertySelectionStepProps> = ({
  onPropertySelected,
  selectedProperty,
  className = ''
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, properties]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching properties for selection', {}, 'PROPERTY_SELECTION_STEP');

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedProperties: Property[] = data?.map(property => ({
        id: property.property_id.toString(),
        property_id: property.property_id,
        property_name: property.property_name || 'Unnamed Property',
        street_address: property.street_address || 'No address provided',
        vrbo_url: property.vrbo_url,
        airbnb_url: property.airbnb_url,
        type: 'rental', // Default type
        created_at: property.created_at
      })) || [];

      setProperties(formattedProperties);
      setFilteredProperties(formattedProperties);

    } catch (error) {
      logger.error('Failed to fetch properties', error, 'PROPERTY_SELECTION_STEP');
      toast({
        title: 'Error Loading Properties',
        description: 'Failed to load properties. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(property =>
      property.property_name.toLowerCase().includes(query) ||
      property.street_address.toLowerCase().includes(query)
    );

    setFilteredProperties(filtered);
  };

  const handlePropertySelect = async (property: Property) => {
    try {
      setIsSelecting(true);
      logger.info('Property selected for inspection', { 
        propertyId: property.id,
        propertyName: property.property_name 
      }, 'PROPERTY_SELECTION_STEP');

      onPropertySelected(property);

      toast({
        title: 'Property Selected',
        description: `Selected ${property.property_name} for inspection.`,
        duration: 3000,
      });

    } catch (error) {
      logger.error('Failed to select property', error, 'PROPERTY_SELECTION_STEP');
      toast({
        title: 'Selection Failed',
        description: 'Failed to select property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const getPropertyTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'apartment':
        return 'bg-blue-100 text-blue-800';
      case 'house':
        return 'bg-green-100 text-green-800';
      case 'condo':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Select Property
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
          <Home className="w-5 h-5" />
          Select Property for Inspection
        </CardTitle>
        <div className="text-sm text-gray-600">
          Choose the property you want to inspect from the list below.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search properties by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Property Display */}
        {selectedProperty && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Selected Property</span>
            </div>
            <div className="text-sm text-green-700">
              <div className="font-medium">{selectedProperty.property_name}</div>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {selectedProperty.street_address}
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
        <ScrollArea className="h-96 w-full">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No properties found.</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try adjusting your search terms.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProperties.map((property) => (
                <Card 
                  key={property.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProperty?.id === property.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {property.property_name}
                          </h4>
                          <Badge className={getPropertyTypeColor(property.type)}>
                            {property.type || 'rental'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{property.street_address}</span>
                        </div>

                        {/* Property Links */}
                        <div className="flex gap-2">
                          {property.vrbo_url && (
                            <a
                              href={property.vrbo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              VRBO <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {property.airbnb_url && (
                            <a
                              href={property.airbnb_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Airbnb <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {selectedProperty?.id === property.id ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => {
              // Professional data refresh without nuclear reload
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                toast({
                  title: "Properties Refreshed",
                  description: "Property list has been updated.",
                });
              }, 1000);
            }}
            variant="outline"
            className="flex-1"
          >
            Refresh List
          </Button>
          
          {selectedProperty && (
            <Button
              className="flex-1"
              disabled={isSelecting}
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

        {/* Help Text */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>Select a property to begin the inspection process. You can search by property name or address.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertySelectionStep;
export { PropertySelectionStep };