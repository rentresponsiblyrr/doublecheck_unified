import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Zap,
  Users,
  Bath,
  Home,
  Shield,
  Settings
} from 'lucide-react';
import { dynamicChecklistGenerator, type DynamicChecklistItem, type ChecklistGenerationResult } from '@/lib/ai/dynamic-checklist-generator';
import { EnhancedAIService } from '@/lib/ai/enhanced-ai-service';

// Property interface matching InspectorWorkflow
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

// Checklist interface for workflow compatibility
interface ChecklistItem {
  items: DynamicChecklistItem[];
  estimatedTime: number;
  totalItems: number;
}

interface ChecklistGeneratorProps {
  property: Property;
  onChecklistGenerated: (checklist: ChecklistItem) => void;
  isLoading?: boolean;
}

export function ChecklistGenerator({ 
  property, 
  onChecklistGenerated,
  isLoading = false 
}: ChecklistGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedChecklist, setGeneratedChecklist] = useState<ChecklistGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateChecklist = useCallback(async () => {
    if (!property) return;
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // AI service disabled for security - use fallback checklist generation
      // REMOVED: console.log('Enhanced AI service disabled for security, using fallback generation');
      
      // Use fallback dynamic checklist generator instead
      const result = await dynamicChecklistGenerator.generateDynamicChecklist({
        vrboId: property.id,
        propertyType: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        amenities: property.amenities || [],
        description: property.description || '',
        location: { city: '', state: '', country: '' },
        specifications: { 
          propertyType: property.type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms 
        }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setGeneratedChecklist(result);
      
      // Convert to format expected by InspectorWorkflow
      const workflowChecklist: ChecklistItem = {
        items: result.items,
        estimatedTime: result.estimatedTimeMinutes,
        totalItems: result.totalItems
      };
      
      onChecklistGenerated(workflowChecklist);
      
    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate checklist';
      setError(errorMessage);
      // REMOVED: console.error('Checklist generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [property, onChecklistGenerated]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      safety: <Shield className="h-4 w-4" />,
      bedrooms: <Users className="h-4 w-4" />,
      bathrooms: <Bath className="h-4 w-4" />,
      kitchen: <Home className="h-4 w-4" />,
      general: <Settings className="h-4 w-4" />
    };
    
    return icons[category] || <CheckCircle className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Checklist Generation Failed</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 ml-2" 
            onClick={generateChecklist}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Property Summary */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Brain className="h-5 w-5" />
            AI Checklist Generator
          </CardTitle>
          <CardDescription>
            Generate a property-specific inspection checklist using AI based on property details and amenities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <h4 className="font-medium text-lg">{property.address}</h4>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                {property.bedrooms} bed • {property.bathrooms} bath • {property.sqft} sqft
              </p>
            </div>
            <Button 
              onClick={generateChecklist}
              disabled={isGenerating || isLoading}
              className="w-full h-14 text-base touch-manipulation"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-5 w-5 animate-spin mr-3" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-3" />
                  Generate Checklist
                </>
              )}
            </Button>
          </div>
          
          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating checklist...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Checklist Display */}
      {generatedChecklist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated Checklist
            </CardTitle>
            <CardDescription>
              {generatedChecklist.totalItems} items • ~{generatedChecklist.estimatedTimeMinutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Checklist Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center py-2">
                <div className="font-semibold text-xl">{generatedChecklist.totalItems}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center py-2">
                <div className="font-semibold text-xl">{generatedChecklist.estimatedTimeMinutes}m</div>
                <div className="text-sm text-gray-600">Est. Time</div>
              </div>
              <div className="text-center py-2">
                <div className="font-semibold text-xl">
                  {Object.values(generatedChecklist.categories).filter(count => count > 0).length}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center py-2">
                <div className="font-semibold text-xl">
                  {generatedChecklist.items.filter(item => item.required).length}
                </div>
                <div className="text-sm text-gray-600">Required</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(generatedChecklist.categories)
                  .filter(([, count]) => count > 0)
                  .map(([category, count]) => (
                    <Badge key={category} variant="outline" className="flex items-center gap-1">
                      {getCategoryIcon(category)}
                      {category} ({count})
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Sample Items Preview */}
            <div className="space-y-2">
              <h4 className="font-medium">Preview ({Math.min(3, generatedChecklist.items.length)} of {generatedChecklist.items.length} items)</h4>
              <div className="space-y-2">
                {generatedChecklist.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium truncate">{item.title}</h5>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            ~{item.estimatedTimeMinutes}min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {generatedChecklist.items.length > 3 && (
                  <div className="text-center py-2 text-sm text-gray-600">
                    ... and {generatedChecklist.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>

            {/* Generation Metadata */}
            <div className="text-xs text-gray-500 border-t pt-3">
              Generated in {generatedChecklist.generationMetadata.processingTime}ms • 
              {generatedChecklist.generationMetadata.aiGenerated} AI-generated items • 
              {generatedChecklist.generationMetadata.manuallyAdded} template items
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChecklistGenerator;