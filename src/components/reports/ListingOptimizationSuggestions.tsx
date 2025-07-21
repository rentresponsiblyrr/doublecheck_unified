import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  Star, 
  TrendingUp, 
  Camera, 
  Home, 
  Shield, 
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Download,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface OptimizationSuggestion {
  id: string;
  category: 'photos' | 'amenities' | 'safety' | 'description' | 'pricing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  estimatedROI: number;
  implementationTime: string;
  difficultyLevel: 'easy' | 'moderate' | 'advanced';
}

interface ListingScore {
  overall: number;
  photos: number;
  amenities: number;
  safety: number;
  description: number;
  marketPosition: number;
}

interface ListingOptimizationSuggestionsProps {
  inspectionId: string;
  inspection: any;
  propertyName: string;
  className?: string;
}

const ListingOptimizationSuggestions: React.FC<ListingOptimizationSuggestionsProps> = ({
  inspectionId,
  inspection,
  propertyName,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [listingScore, setListingScore] = useState<ListingScore>({
    overall: 0,
    photos: 0,
    amenities: 0,
    safety: 0,
    description: 0,
    marketPosition: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateOptimizationSuggestions();
  }, [inspectionId, inspection]);

  const generateOptimizationSuggestions = async () => {
    try {
      setIsLoading(true);
      logger.info('Generating optimization suggestions', { inspectionId }, 'LISTING_OPTIMIZATION');

      // Fetch inspection data and checklist items
      const { data: checklistItems, error } = await supabase
        .from('logs')
        .select(`
          *,
          static_safety_items!inner (
            id,
            title,
            category,
            required
          )
        `)
        .eq('property_id', inspection.property_id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Analyze inspection results to generate suggestions
      const analysisResults = analyzeInspectionResults(checklistItems || []);
      setSuggestions(analysisResults.suggestions);
      setListingScore(analysisResults.score);

    } catch (error) {
      logger.error('Failed to generate optimization suggestions', error, 'LISTING_OPTIMIZATION');
      toast({
        title: 'Error Generating Suggestions',
        description: 'Failed to generate listing optimization suggestions. Using default recommendations.',
        variant: 'destructive',
      });
      
      // Set default suggestions if generation fails
      setDefaultSuggestions();
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeInspectionResults = (checklistItems: any[]) => {
    // Analyze safety items
    const safetyItems = checklistItems.filter(item => 
      item.static_safety_items?.category?.toLowerCase().includes('safety')
    );
    const safetyScore = safetyItems.length > 0 ? 
      (safetyItems.filter(item => item.pass === true).length / safetyItems.length) * 100 : 75;

    // Analyze amenity items
    const amenityItems = checklistItems.filter(item => 
      item.static_safety_items?.category?.toLowerCase().includes('amenity')
    );
    const amenityScore = amenityItems.length > 0 ? 
      (amenityItems.filter(item => item.pass === true).length / amenityItems.length) * 100 : 70;

    // Calculate photo score based on evidence availability
    const itemsWithEvidence = checklistItems.filter(item => item.media && item.media.length > 0);
    const photoScore = checklistItems.length > 0 ? 
      (itemsWithEvidence.length / checklistItems.length) * 100 : 60;

    // Overall score calculation
    const overallScore = Math.round((safetyScore + amenityScore + photoScore) / 3);

    const score: ListingScore = {
      overall: overallScore,
      photos: Math.round(photoScore),
      amenities: Math.round(amenityScore),
      safety: Math.round(safetyScore),
      description: 75, // Default score for description
      marketPosition: 70 // Default score for market position
    };

    const suggestions: OptimizationSuggestion[] = [];

    // Generate photo suggestions
    if (photoScore < 80) {
      suggestions.push({
        id: 'photo-improvement',
        category: 'photos',
        priority: 'high',
        title: 'Enhance Photo Quality and Coverage',
        description: 'Your listing would benefit from higher quality photos and better coverage of key areas.',
        impact: 'High-quality photos can increase booking rates by up to 40%',
        actionItems: [
          'Add professional photos of all rooms and amenities',
          'Ensure photos are well-lit and properly staged',
          'Include exterior shots and neighborhood highlights',
          'Add photos of unique features and selling points'
        ],
        estimatedROI: 35,
        implementationTime: '1-2 weeks',
        difficultyLevel: 'moderate'
      });
    }

    // Generate safety suggestions
    if (safetyScore < 90) {
      suggestions.push({
        id: 'safety-improvements',
        category: 'safety',
        priority: 'high',
        title: 'Address Safety and Compliance Issues',
        description: 'Improving safety features will boost guest confidence and listing credibility.',
        impact: 'Safety certifications can increase guest trust and reduce liability',
        actionItems: [
          'Install or check smoke and carbon monoxide detectors',
          'Ensure fire extinguisher is easily accessible',
          'Verify first aid kit is stocked and visible',
          'Check all safety equipment functionality'
        ],
        estimatedROI: 25,
        implementationTime: '3-5 days',
        difficultyLevel: 'easy'
      });
    }

    // Generate amenity suggestions
    if (amenityScore < 85) {
      suggestions.push({
        id: 'amenity-enhancement',
        category: 'amenities',
        priority: 'medium',
        title: 'Expand and Highlight Amenities',
        description: 'Additional amenities and better presentation can justify higher pricing.',
        impact: 'Extra amenities can increase nightly rates by 10-20%',
        actionItems: [
          'Add or highlight WiFi, kitchen essentials, and entertainment options',
          'Ensure all listed amenities are functional and well-maintained',
          'Consider adding local guidebooks or recommendations',
          'Highlight unique features that set your property apart'
        ],
        estimatedROI: 20,
        implementationTime: '1 week',
        difficultyLevel: 'easy'
      });
    }

    // Add description optimization suggestion
    suggestions.push({
      id: 'description-optimization',
      category: 'description',
      priority: 'medium',
      title: 'Optimize Listing Description and Keywords',
      description: 'A compelling description with the right keywords improves search visibility.',
      impact: 'Optimized descriptions can improve search ranking and conversion rates',
      actionItems: [
        'Include local attractions and unique selling points',
        'Use relevant keywords for better search visibility',
        'Highlight the inspection certification and safety standards',
        'Add information about the professional inspection process'
      ],
      estimatedROI: 15,
      implementationTime: '2-3 hours',
      difficultyLevel: 'easy'
    });

    // Add pricing optimization suggestion
    suggestions.push({
      id: 'pricing-strategy',
      category: 'pricing',
      priority: 'low',
      title: 'Leverage Inspection Certification for Premium Pricing',
      description: 'Use your STR Certified status to justify premium pricing and attract quality guests.',
      impact: 'Certified properties can command 10-15% higher rates',
      actionItems: [
        'Add STR Certified badge to your listing',
        'Mention professional inspection in description',
        'Highlight safety and quality standards in your listing',
        'Use certification as a key differentiator from competitors'
      ],
      estimatedROI: 12,
      implementationTime: '1 hour',
      difficultyLevel: 'easy'
    });

    return { suggestions, score };
  };

  const setDefaultSuggestions = () => {
    setSuggestions([
      {
        id: 'default-photos',
        category: 'photos',
        priority: 'high',
        title: 'Enhance Photo Quality',
        description: 'Professional photos significantly impact booking rates.',
        impact: 'Can increase bookings by up to 40%',
        actionItems: ['Add high-quality photos', 'Ensure good lighting', 'Show all amenities'],
        estimatedROI: 30,
        implementationTime: '1-2 weeks',
        difficultyLevel: 'moderate'
      }
    ]);
    
    setListingScore({
      overall: 75,
      photos: 70,
      amenities: 75,
      safety: 80,
      description: 75,
      marketPosition: 70
    });
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Generate optimization report
      const reportContent = generateOptimizationReport();
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      
      // Download the report
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${propertyName.replace(/[^a-zA-Z0-9]/g, '_')}_Optimization_Report_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Report Generated',
        description: 'Optimization report has been downloaded successfully.',
        duration: 3000,
      });
    } catch (error) {
      logger.error('Failed to generate optimization report', error, 'LISTING_OPTIMIZATION');
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate optimization report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateOptimizationReport = () => {
    const report = `
LISTING OPTIMIZATION REPORT
Property: ${propertyName}
Inspection ID: ${inspectionId}
Generated: ${new Date().toLocaleDateString()}

OVERALL SCORE: ${listingScore.overall}/100

BREAKDOWN:
- Photos: ${listingScore.photos}/100
- Amenities: ${listingScore.amenities}/100
- Safety: ${listingScore.safety}/100
- Description: ${listingScore.description}/100
- Market Position: ${listingScore.marketPosition}/100

OPTIMIZATION SUGGESTIONS:

${suggestions.map((suggestion, index) => `
${index + 1}. ${suggestion.title} (${suggestion.priority.toUpperCase()} PRIORITY)
   Category: ${suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)}
   Impact: ${suggestion.impact}
   Estimated ROI: ${suggestion.estimatedROI}%
   Implementation Time: ${suggestion.implementationTime}
   Difficulty: ${suggestion.difficultyLevel.charAt(0).toUpperCase() + suggestion.difficultyLevel.slice(1)}
   
   Description: ${suggestion.description}
   
   Action Items:
   ${suggestion.actionItems.map(item => `   - ${item}`).join('\n')}
`).join('\n')}

This report was generated by STR Certified's AI-powered optimization engine.
For more detailed recommendations, please contact our support team.
    `.trim();
    
    return report;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'photos':
        return <Camera className="w-4 h-4" />;
      case 'amenities':
        return <Home className="w-4 h-4" />;
      case 'safety':
        return <Shield className="w-4 h-4" />;
      case 'description':
        return <Users className="w-4 h-4" />;
      case 'pricing':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Listing Optimization Suggestions
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Listing Optimization Suggestions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="roadmap">Action Roadmap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {listingScore.overall}/100
              </div>
              <p className="text-sm text-gray-600">Overall Optimization Score</p>
              <Progress value={listingScore.overall} className="mt-4" />
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Photos</span>
                  <span className="text-sm text-gray-600">{listingScore.photos}/100</span>
                </div>
                <Progress value={listingScore.photos} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Safety</span>
                  <span className="text-sm text-gray-600">{listingScore.safety}/100</span>
                </div>
                <Progress value={listingScore.safety} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amenities</span>
                  <span className="text-sm text-gray-600">{listingScore.amenities}/100</span>
                </div>
                <Progress value={listingScore.amenities} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Description</span>
                  <span className="text-sm text-gray-600">{listingScore.description}/100</span>
                </div>
                <Progress value={listingScore.description} className="h-2" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <ScrollArea className="h-96 w-full">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Your listing is already well-optimized!</p>
                  <p className="text-sm mt-2">Continue monitoring for new opportunities.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(suggestion.category)}
                            <h4 className="font-medium">{suggestion.title}</h4>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.estimatedROI}% ROI
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                        
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                            <TrendingUp className="w-3 h-3" />
                            Expected Impact
                          </div>
                          <p className="text-sm text-blue-600">{suggestion.impact}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Action Items:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {suggestion.actionItems.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-gray-500">
                          <span>Time: {suggestion.implementationTime}</span>
                          <span>Difficulty: {suggestion.difficultyLevel}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Recommended Implementation Order</h4>
              
              {suggestions
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((suggestion, index) => (
                  <div key={suggestion.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{suggestion.title}</h5>
                        <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.impact}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>⏱️ {suggestion.implementationTime}</span>
                        <span>📈 {suggestion.estimatedROI}% ROI</span>
                        <span>🎯 {suggestion.difficultyLevel}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Suggestions generated based on inspection results and industry best practices.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingOptimizationSuggestions;
export { ListingOptimizationSuggestions };