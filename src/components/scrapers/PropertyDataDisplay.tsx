// Property Data Display Component for STR Certified Scrapers

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  MapPin,
  Users,
  Star,
  Wifi,
  Car,
  Utensils,
  Waves,
  Flame,
  Snowflake,
  Shield,
  Camera,
  Grid3X3,
  Image,
  Filter,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';
import type {
  VRBOPropertyData,
  PropertyAmenity,
  PropertyRoom,
  PhotoData,
  PhotoDeduplicationResult,
  AmenityCategory,
  ScrapingState
} from '@/lib/scrapers/types';
import { cn } from '@/lib/utils';

interface PropertyDataDisplayProps {
  propertyData: VRBOPropertyData;
  photos?: PhotoData[];
  deduplicatedPhotos?: PhotoDeduplicationResult;
  scrapingState?: ScrapingState;
  className?: string;
  onRefreshData?: () => void;
  showPhotos?: boolean;
  showDetailedBreakdown?: boolean;
}

export const PropertyDataDisplay: React.FC<PropertyDataDisplayProps> = ({
  propertyData,
  photos = [],
  deduplicatedPhotos,
  scrapingState,
  className,
  onRefreshData,
  showPhotos = true,
  showDetailedBreakdown = true
}) => {
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('all');

  const getAmenityIcon = (category: AmenityCategory) => {
    const iconMap = {
      kitchen: Utensils,
      bathroom: Waves,
      bedroom: Home,
      entertainment: Grid3X3,
      outdoor: MapPin,
      safety: Shield,
      accessibility: Users,
      connectivity: Wifi,
      climate: Snowflake,
      parking: Car,
      laundry: RefreshCw,
      general: Home
    };
    
    return iconMap[category] || Home;
  };

  const getCompletionPercentage = () => {
    const requiredFields = ['title', 'description', 'amenities', 'photos', 'rooms'];
    const completedFields = requiredFields.filter(field => {
      const value = propertyData[field as keyof VRBOPropertyData];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return !!value;
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const filteredPhotos = selectedPhotoCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === selectedPhotoCategory);

  const photoCategories = Array.from(new Set(photos.map(photo => photo.category)));

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header with Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-blue-600" />
                <span>Property Data</span>
              </CardTitle>
              <CardDescription>
                Scraped from VRBO • Last updated {propertyData.lastUpdated.toLocaleString()}
              </CardDescription>
            </div>
            {onRefreshData && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshData}
                disabled={scrapingState?.status === 'scraping'}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={cn(
                  "h-4 w-4", 
                  scrapingState?.status === 'scraping' && "animate-spin"
                )} />
                <span>Refresh</span>
              </Button>
            )}
          </div>
          
          {/* Data Completeness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Data Completeness</span>
              <span className="font-medium">{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Scraping Progress */}
      {scrapingState?.status === 'scraping' && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>Scraping in Progress</AlertTitle>
          <AlertDescription>
            {scrapingState.currentStep} ({scrapingState.progress}%)
            <Progress value={scrapingState.progress} className="mt-2 h-1" />
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          {showPhotos && <TabsTrigger value="photos">Photos</TabsTrigger>}
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{propertyData.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{propertyData.location.city}, {propertyData.location.state}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Up to {propertyData.specifications.maxGuests} guests</span>
                </div>
                {propertyData.reviews && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{propertyData.reviews.averageRating} ({propertyData.reviews.totalReviews} reviews)</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {propertyData.description}
              </p>
              
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {propertyData.specifications.bedrooms}
                  </div>
                  <div className="text-sm text-muted-foreground">Bedrooms</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {propertyData.specifications.bathrooms}
                  </div>
                  <div className="text-sm text-muted-foreground">Bathrooms</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {propertyData.amenities.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Amenities</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {photos.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Photos</div>
                </div>
              </div>

              {propertyData.pricing && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Pricing</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${propertyData.pricing.basePrice}/{propertyData.pricing.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">per night</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Amenities</CardTitle>
              <CardDescription>
                {propertyData.amenities.length} amenities found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AmenitiesGrid amenities={propertyData.amenities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="grid gap-4">
            {propertyData.rooms.map((room, index) => (
              <RoomCard key={index} room={room} />
            ))}
          </div>
        </TabsContent>

        {/* Photos Tab */}
        {showPhotos && (
          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Property Photos</CardTitle>
                    <CardDescription>
                      {photos.length} photos found
                      {deduplicatedPhotos && (
                        <span className="ml-2">
                          • {deduplicatedPhotos.duplicatesRemoved} duplicates removed
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <select
                      value={selectedPhotoCategory}
                      onChange={(e) => setSelectedPhotoCategory(e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="all">All Photos</option>
                      {photoCategories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PhotoGallery photos={filteredPhotos} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {showDetailedBreakdown && (
            <div className="grid gap-4">
              <PropertySpecifications specifications={propertyData.specifications} />
              <PropertyLocation location={propertyData.location} />
              {propertyData.host && <HostInformation host={propertyData.host} />}
              <VRBOSpecificDetails data={propertyData} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-components

const AmenitiesGrid: React.FC<{ amenities: PropertyAmenity[] }> = ({ amenities }) => {
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, PropertyAmenity[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => {
        const IconComponent = getAmenityIcon(category as AmenityCategory);
        
        return (
          <div key={category} className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2 capitalize">
              <IconComponent className="h-4 w-4" />
              <span>{category.replace('_', ' ')}</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryAmenities.map((amenity, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center space-x-2 p-3 rounded-lg border',
                    amenity.verified 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  {amenity.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm font-medium">{amenity.name}</span>
                  {amenity.icon && <span className="text-lg">{amenity.icon}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RoomCard: React.FC<{ room: PropertyRoom }> = ({ room }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize flex items-center space-x-2">
          <Home className="h-5 w-5" />
          <span>{room.type.replace('_', ' ')}</span>
          <Badge variant="secondary">{room.count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {room.description && (
          <p className="text-muted-foreground">{room.description}</p>
        )}
        
        {room.amenities.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium">Features:</h5>
            <div className="flex flex-wrap gap-2">
              {room.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline">{amenity}</Badge>
              ))}
            </div>
          </div>
        )}

        {room.photos.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Photos ({room.photos.length})</span>
            </h5>
            <div className="grid grid-cols-4 gap-2">
              {room.photos.slice(0, 4).map((photo, index) => (
                <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={photo} 
                    alt={`${room.type} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDE2TTE2IDlIOEw2IDExVjE5SDIwVjExTDE4IDlaIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PhotoGallery: React.FC<{ photos: PhotoData[] }> = ({ photos }) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No photos to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div key={index} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
          <img
            src={photo.url}
            alt={photo.alt || `Property photo ${index + 1}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDE2TTE2IDlIOEw2IDExVjE5SDIwVjExTDE4IDlaIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
          <div className="absolute bottom-2 left-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {photo.category.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

const PropertySpecifications: React.FC<{ specifications: any }> = ({ specifications }) => (
  <Card>
    <CardHeader>
      <CardTitle>Property Specifications</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(specifications).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="text-sm text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="font-medium">{String(value)}</div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const PropertyLocation: React.FC<{ location: any }> = ({ location }) => (
  <Card>
    <CardHeader>
      <CardTitle>Location</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>{location.city}, {location.state}, {location.country}</span>
        </div>
        {location.neighborhood && (
          <div className="text-sm text-muted-foreground">
            Neighborhood: {location.neighborhood}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const HostInformation: React.FC<{ host: any }> = ({ host }) => (
  <Card>
    <CardHeader>
      <CardTitle>Host Information</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="font-medium">{host.name}</div>
        {host.responseRate && (
          <div className="text-sm">Response rate: {host.responseRate}%</div>
        )}
        {host.responseTime && (
          <div className="text-sm">Response time: {host.responseTime}</div>
        )}
      </div>
    </CardContent>
  </Card>
);

const VRBOSpecificDetails: React.FC<{ data: VRBOPropertyData }> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>VRBO Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Property ID</div>
          <div className="font-medium">{data.vrboId}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Instant Book</div>
          <div className="font-medium">{data.instantBook ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      {data.houseRules && data.houseRules.length > 0 && (
        <div>
          <div className="text-sm text-muted-foreground mb-2">House Rules</div>
          <ul className="text-sm space-y-1">
            {data.houseRules.map((rule, index) => (
              <li key={index} className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-current rounded-full" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);

// Helper function to get amenity icon
const getAmenityIcon = (category: AmenityCategory) => {
  const iconMap = {
    kitchen: Utensils,
    bathroom: Waves,
    bedroom: Home,
    entertainment: Grid3X3,
    outdoor: MapPin,
    safety: Shield,
    accessibility: Users,
    connectivity: Wifi,
    climate: Snowflake,
    parking: Car,
    laundry: RefreshCw,
    general: Home
  };
  
  return iconMap[category] || Home;
};