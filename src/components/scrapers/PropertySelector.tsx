import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Search, 
  MapPin, 
  ExternalLink, 
  Plus, 
  Home, 
  Users, 
  Bath, 
  Square,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

// Types
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

interface PropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  property_status?: string;
  property_created_at?: string;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
  latest_inspection_id?: string | null;
  latest_inspection_completed?: boolean | null;
}

interface PropertySelectorProps {
  onPropertySelected: (property: Property) => void;
  selectedProperty: Property | null;
  isLoading?: boolean;
}

export function PropertySelector({ 
  onPropertySelected, 
  selectedProperty, 
  isLoading = false 
}: PropertySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPropertyUrl, setNewPropertyUrl] = useState('');
  const { user } = useAuth();

  // Fetch properties from database
  const { 
    data: properties = [], 
    isLoading: propertiesLoading, 
    error: propertiesError, 
    refetch 
  } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ PropertySelector: No user ID available, returning empty properties');
        return [];
      }

      console.log('🏠 PropertySelector: Fetching properties for user:', user.id);
      
      const { data, error } = await supabase.rpc('get_properties_with_inspections', {
        _user_id: user.id
      });
      
      if (error) {
        console.error('❌ PropertySelector: Error fetching properties:', error);
        throw error;
      }

      console.log('✅ PropertySelector: Successfully fetched properties:', data?.length || 0);
      return data as PropertyData[];
    },
    enabled: !!user?.id, // Only run query when user is available
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Convert PropertyData to Property format for workflow compatibility
  const convertToWorkflowProperty = useCallback((propertyData: PropertyData): Property => {
    return {
      id: propertyData.property_id,
      address: propertyData.property_address || propertyData.property_name,
      type: 'Short-term Rental', // Default type for STR properties
      bedrooms: 2, // Default values - would come from scraping in real implementation
      bathrooms: 1,
      sqft: 1000,
      listingUrl: propertyData.property_vrbo_url || propertyData.property_airbnb_url || undefined,
      images: [] // Would be populated from scraped data
    };
  }, []);

  // Filter properties based on search query
  const filteredProperties = properties.filter((property) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      property.property_name?.toLowerCase().includes(query) ||
      property.property_address?.toLowerCase().includes(query) ||
      property.property_vrbo_url?.toLowerCase().includes(query) ||
      property.property_airbnb_url?.toLowerCase().includes(query)
    );
  });

  const handlePropertySelect = (propertyData: PropertyData) => {
    const workflowProperty = convertToWorkflowProperty(propertyData);
    onPropertySelected(workflowProperty);
  };

  const handleAddProperty = async () => {
    if (!newPropertyUrl.trim()) return;
    
    try {
      console.log('🏠 Creating property from URL:', newPropertyUrl);
      
      // This would integrate with property scraping service
      // For now, create a basic property structure
      const newProperty: Property = {
        id: `temp_${Date.now()}`,
        address: newPropertyUrl,
        type: 'single_family',
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1000,
        listingUrl: newPropertyUrl,
        images: []
      };
      
      console.log('✅ Property created, calling onPropertySelected');
      await Promise.resolve(onPropertySelected(newProperty));
      
      setShowAddForm(false);
      setNewPropertyUrl('');
      
      console.log('✅ Property selection completed');
    } catch (error) {
      console.error('❌ PropertySelector: Error adding property:', error);
      // Don't throw the error, just log it
    }
  };

  const getPropertyStatus = (property: PropertyData) => {
    if (property.active_inspection_count && property.active_inspection_count > 0) {
      return { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    }
    if (property.completed_inspection_count && property.completed_inspection_count > 0) {
      return { status: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'new', label: 'New', color: 'bg-gray-100 text-gray-800' };
  };

  if (propertiesError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Properties</AlertTitle>
        <AlertDescription className="mt-2">
          {propertiesError.message || 'Failed to load properties from database.'}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 ml-2" 
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Controls - Mobile Optimized */}
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="property-search" className="sr-only">Search properties</label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="property-search"
            name="propertySearch"
            placeholder="Search properties by name, address, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base touch-manipulation"
          />
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          className="w-full h-12 text-base touch-manipulation"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Add Property Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg">Add New Property</CardTitle>
            <CardDescription>
              Enter a property listing URL to scrape details automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="new-property-url" className="block text-sm font-medium text-gray-700">
                Property Listing URL
              </label>
              <Input
                id="new-property-url"
                name="newPropertyUrl"
                placeholder="https://www.vrbo.com/... or https://www.airbnb.com/..."
                value={newPropertyUrl}
                onChange={(e) => setNewPropertyUrl(e.target.value)}
                className="h-12 text-base touch-manipulation"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddProperty} 
                  disabled={!newPropertyUrl.trim()}
                  className="flex-1 h-12 text-base touch-manipulation"
                >
                  Add Property
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="h-12 px-4 touch-manipulation"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Available Properties ({filteredProperties.length})
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            className="h-10 px-3 touch-manipulation"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {propertiesLoading || isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Properties Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? 
                  "No properties match your search criteria." : 
                  "No properties available. Add a property to get started."
                }
              </p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="h-12 px-6 text-base touch-manipulation"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProperties.map((property) => {
              const status = getPropertyStatus(property);
              const isSelected = selectedProperty?.id === property.property_id;
              
              return (
                <Card 
                  key={property.property_id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {property.property_name || 'Unnamed Property'}
                          </h3>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        {property.property_address && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm truncate">{property.property_address}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="h-3 w-3" />
                            <span>2 beds</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Bath className="h-3 w-3" />
                            <span>1 bath</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Square className="h-3 w-3" />
                            <span>1000 sqft</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {property.property_vrbo_url && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              VRBO
                            </Badge>
                          )}
                          {property.property_airbnb_url && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Airbnb
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-600 ml-4">
                        {property.inspection_count ? (
                          <div>
                            <div>{property.inspection_count} inspection{property.inspection_count !== 1 ? 's' : ''}</div>
                            {property.completed_inspection_count && (
                              <div className="text-green-600">
                                {property.completed_inspection_count} completed
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400">No inspections</div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Selected for inspection</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Property Summary */}
      {selectedProperty && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="text-lg text-green-800 dark:text-green-200">
              Selected Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedProperty.address}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProperty.bedrooms} bed • {selectedProperty.bathrooms} bath • {selectedProperty.sqft} sqft
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Ready for Inspection
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}