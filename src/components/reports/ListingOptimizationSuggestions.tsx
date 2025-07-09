// Listing Optimization Suggestions Component - Display actionable listing improvements
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Home, 
  Camera, 
  FileText, 
  TrendingUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import { amenityComparisonEngine } from '@/services/amenityComparisonEngine';
import { missingAmenityDetector } from '@/services/missingAmenityDetector';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { InspectionForReview } from '@/services/auditorService';
import type { ScrapedPropertyData } from '@/lib/scrapers/types';

interface ListingOptimizationSuggestionsProps {
  inspectionId: string;
  inspection: InspectionForReview;
  propertyName: string;
}

export const ListingOptimizationSuggestions: React.FC<ListingOptimizationSuggestionsProps> = ({
  inspectionId,
  inspection,
  propertyName
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOptimizationData();
  }, [inspectionId]);

  const loadOptimizationData = async () => {
    try {
      setIsLoading(true);
      
      // Mock scraped data (in real implementation, this would come from the property scraper)
      const mockScrapedData: ScrapedPropertyData = {
        title: inspection.properties.name,
        description: `Beautiful ${inspection.properties.name} located at ${inspection.properties.address}. Perfect for vacation stays.`,
        amenities: [
          { name: 'WiFi', verified: true, category: 'connectivity', priority: 'essential' },
          { name: 'Kitchen', verified: true, category: 'kitchen', priority: 'essential' },
          { name: 'Parking', verified: true, category: 'parking', priority: 'important' }
        ],
        photos: [],
        rooms: [],
        specifications: { propertyType: 'house', bedrooms: 3, bathrooms: 2, maxGuests: 6 },
        location: { city: 'Unknown', state: 'Unknown', country: 'US' },
        lastUpdated: new Date(),
        sourceUrl: inspection.properties.vrbo_url || '',
        host: undefined,
        reviews: undefined,
        pricing: undefined
      };

      // Load optimization data
      const [optimizationReport, optimizationMetrics] = await Promise.all([
        amenityComparisonEngine.generateOptimizationReport(inspection, mockScrapedData),
        amenityComparisonEngine.calculateOptimizationMetrics(inspection, mockScrapedData)
      ]);

      setOptimizationData(optimizationReport);
      setMetrics(optimizationMetrics);

      logger.info('Listing optimization data loaded', { 
        inspectionId, 
        opportunities: optimizationReport.summary.totalOpportunities 
      }, 'LISTING_OPTIMIZATION');

    } catch (error) {
      logger.error('Failed to load optimization data', error, 'LISTING_OPTIMIZATION');
      toast({
        title: 'Failed to Load Optimization Data',
        description: 'Could not analyze listing optimization opportunities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: 'Suggestion copied to clipboard',
      duration: 2000,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return 'bg-red-100 text-red-800';
      case 'suggested':
        return 'bg-yellow-100 text-yellow-800';
      case 'consider':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'suggested':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'consider':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Listing Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6 mr-2" />
            <span>Analyzing listing optimization opportunities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!optimizationData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Listing Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Unable to analyze listing optimization opportunities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Listing Optimization Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Optimization Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.overallOptimization}%</div>
              <div className="text-sm text-blue-700">Overall Score</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.listingCompleteness}%</div>
              <div className="text-sm text-green-700">Completeness</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics.amenityAccuracy}%</div>
              <div className="text-sm text-purple-700">Accuracy</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{optimizationData.summary.totalOpportunities}</div>
              <div className="text-sm text-orange-700">Opportunities</div>
            </div>
          </div>
        )}

        {/* Impact Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Impact Summary</h4>
          <p className="text-sm text-gray-600">{optimizationData.summary.estimatedImpact}</p>
          
          {optimizationData.summary.keyFindings.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Key Findings:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                {optimizationData.summary.keyFindings.map((finding: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Critical Missing Amenities */}
        {optimizationData.discoveredOpportunities.criticalMissing.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium">Critical Missing Amenities</h4>
            </div>
            
            {optimizationData.discoveredOpportunities.criticalMissing.map((missing: any, index: number) => (
              <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{missing.amenity}</span>
                  <Badge className={getPriorityColor(missing.priority)}>
                    {missing.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{missing.evidence}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(missing.suggestion)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Suggestion
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Amenity Checklist Recommendations */}
        {optimizationData.recommendations.amenityCheckboxes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-medium">Amenity Checklist Recommendations</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optimizationData.recommendations.amenityCheckboxes.slice(0, 6).map((checkbox: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {checkbox.action === 'add' ? (
                      <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{checkbox.amenity}</div>
                    <div className="text-xs text-gray-600 mt-1">{checkbox.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Enhancement Suggestions */}
        {optimizationData.recommendations.descriptionUpdates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h4 className="font-medium">Description Enhancement Suggestions</h4>
            </div>
            
            {optimizationData.recommendations.descriptionUpdates.slice(0, 3).map((update: any, index: number) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-sm mb-2">{update.suggestedAddition}</div>
                <div className="text-xs text-gray-600 mb-2">{update.rationale}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(update.suggestedAddition)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Text
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Photo Suggestions */}
        {optimizationData.recommendations.photoSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              <h4 className="font-medium">Photo Recommendations</h4>
            </div>
            
            {optimizationData.recommendations.photoSuggestions.slice(0, 3).map((photo: any, index: number) => (
              <div key={index} className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-sm mb-2">{photo.amenity}</div>
                <div className="text-xs text-gray-600 mb-2">{photo.suggestion}</div>
                {photo.availablePhotos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {photo.availablePhotos.slice(0, 3).map((photoUrl: string, photoIndex: number) => (
                      <img
                        key={photoIndex}
                        src={photoUrl}
                        alt={`${photo.amenity} photo`}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Opportunities Found */}
        {optimizationData.summary.totalOpportunities === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">Listing Appears Well-Optimized</p>
            <p className="text-sm">No major optimization opportunities identified</p>
          </div>
        )}

        {/* Action Summary */}
        {optimizationData.summary.totalOpportunities > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Next Steps</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Review and implement the {optimizationData.summary.highPriorityActions} high-priority recommendations</p>
              <p>• Update your listing description with suggested amenity mentions</p>
              <p>• Consider featuring highlighted amenities more prominently in photos</p>
              <p>• Re-check amenity boxes for features found during inspection</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingOptimizationSuggestions;