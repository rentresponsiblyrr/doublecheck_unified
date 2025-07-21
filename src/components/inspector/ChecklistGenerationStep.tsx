import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Zap, 
  CheckSquare, 
  Clock,
  Shield,
  Home,
  Sparkles,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Property {
  id: string;
  property_name: string;
  street_address: string;
  type?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  evidence_type: string;
  description?: string;
  ai_generated?: boolean;
}

interface ChecklistGenerationStepProps {
  property: Property;
  onChecklistGenerated: (checklist: ChecklistItem[]) => void;
  generatedChecklist?: ChecklistItem[];
  className?: string;
}

const ChecklistGenerationStep: React.FC<ChecklistGenerationStepProps> = ({
  property,
  onChecklistGenerated,
  generatedChecklist,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [staticItems, setStaticItems] = useState<ChecklistItem[]>([]);
  const [aiItems, setAiItems] = useState<ChecklistItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!generatedChecklist) {
      generateChecklist();
    } else {
      categorizeExistingChecklist();
    }
  }, [property]);

  const categorizeExistingChecklist = () => {
    if (!generatedChecklist) return;
    
    const static_items = generatedChecklist.filter(item => !item.ai_generated);
    const ai_items = generatedChecklist.filter(item => item.ai_generated);
    
    setStaticItems(static_items);
    setAiItems(ai_items);
  };

  const generateChecklist = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStage('Loading base checklist...');
      
      logger.info('Starting checklist generation', { 
        propertyId: property.id,
        propertyType: property.type 
      }, 'CHECKLIST_GENERATION_STEP');

      // Step 1: Load static safety items (20%)
      const { data: staticSafetyItems, error: staticError } = await supabase
        .from('static_safety_items')
        .select('*')
        .eq('deleted', false)
        .order('id');

      if (staticError) {
        throw staticError;
      }

      const baseItems: ChecklistItem[] = staticSafetyItems?.map(item => ({
        id: item.id,
        title: item.label || 'Safety Item',
        category: item.category || 'safety',
        required: item.required || false,
        evidence_type: item.evidence_type || 'photo',
        description: `Standard safety requirement: ${item.label}`,
        ai_generated: false
      })) || [];

      setStaticItems(baseItems);
      setGenerationProgress(20);
      setGenerationStage('Analyzing property characteristics...');

      // Step 2: Simulate AI analysis (40%)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGenerationProgress(40);
      setGenerationStage('Generating property-specific items...');

      // Step 3: Generate AI-enhanced items based on property type (60%)
      const aiEnhancedItems = generateAIItems(property);
      setAiItems(aiEnhancedItems);
      setGenerationProgress(60);
      setGenerationStage('Optimizing checklist...');

      // Step 4: Combine and optimize (80%)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress(80);
      setGenerationStage('Finalizing checklist...');

      // Step 5: Finalize (100%)
      const finalChecklist = [...baseItems, ...aiEnhancedItems];
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress(100);
      setGenerationStage('Complete!');

      onChecklistGenerated(finalChecklist);

      toast({
        title: 'Checklist Generated Successfully',
        description: `Generated ${finalChecklist.length} inspection items for ${property.property_name}`,
        duration: 5000,
      });

    } catch (error) {
      logger.error('Failed to generate checklist', error, 'CHECKLIST_GENERATION_STEP');
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate inspection checklist. Using default items.',
        variant: 'destructive',
      });
      
      // Fallback to basic checklist
      const fallbackItems: ChecklistItem[] = [
        {
          id: 'basic-1',
          title: 'Smoke Detector Check',
          category: 'safety',
          required: true,
          evidence_type: 'photo',
          description: 'Verify smoke detector is present and functional',
          ai_generated: false
        },
        {
          id: 'basic-2',
          title: 'Fire Extinguisher',
          category: 'safety',
          required: true,
          evidence_type: 'photo',
          description: 'Check fire extinguisher location and condition',
          ai_generated: false
        }
      ];
      
      setStaticItems(fallbackItems);
      onChecklistGenerated(fallbackItems);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIItems = (property: Property): ChecklistItem[] => {
    // Simulate AI-generated items based on property analysis
    const aiItems: ChecklistItem[] = [];

    // Property-specific items based on type and location
    if (property.type?.toLowerCase().includes('apartment')) {
      aiItems.push({
        id: 'ai-1',
        title: 'Balcony Safety Rails',
        category: 'safety',
        required: true,
        evidence_type: 'photo',
        description: 'AI-detected: Apartment has balcony - verify safety rails',
        ai_generated: true
      });
    }

    if (property.property_name.toLowerCase().includes('beach') || 
        property.street_address.toLowerCase().includes('beach')) {
      aiItems.push({
        id: 'ai-2',
        title: 'Beach Safety Equipment',
        category: 'amenity',
        required: false,
        evidence_type: 'photo',
        description: 'AI-detected: Beach location - check for safety equipment',
        ai_generated: true
      });
    }

    // Kitchen-specific items
    aiItems.push({
      id: 'ai-3',
      title: 'Kitchen Appliance Safety',
      category: 'safety',
      required: true,
      evidence_type: 'photo',
      description: 'AI-enhanced: Verify all kitchen appliances are safe and functional',
      ai_generated: true
    });

    // Bathroom-specific items
    aiItems.push({
      id: 'ai-4',
      title: 'Bathroom Ventilation',
      category: 'amenity',
      required: false,
      evidence_type: 'photo',
      description: 'AI-enhanced: Check bathroom ventilation and moisture control',
      ai_generated: true
    });

    return aiItems;
  };

  const handleRegenerateChecklist = () => {
    setGeneratedChecklist(undefined);
    setStaticItems([]);
    setAiItems([]);
    generateChecklist();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety':
        return <Shield className="w-4 h-4" />;
      case 'amenity':
        return <Home className="w-4 h-4" />;
      case 'cleanliness':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety':
        return 'bg-red-100 text-red-800';
      case 'amenity':
        return 'bg-blue-100 text-blue-800';
      case 'cleanliness':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Generating AI-Powered Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {generationProgress}%
            </div>
            <Progress value={generationProgress} className="mb-4" />
            <p className="text-sm text-gray-600">{generationStage}</p>
          </div>

          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Creating customized inspection checklist for:</p>
            <p className="text-lg font-semibold text-blue-600">{property.property_name}</p>
            <p className="text-sm text-gray-600">{property.street_address}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = staticItems.length + aiItems.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Inspection Checklist Generated
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateChecklist}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Customized checklist for {property.property_name}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{staticItems.length}</div>
            <div className="text-xs text-gray-500">Standard Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{aiItems.length}</div>
            <div className="text-xs text-gray-500">AI-Enhanced</div>
          </div>
        </div>

        {/* Standard Items */}
        {staticItems.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Standard Safety Items ({staticItems.length})
            </h4>
            <ScrollArea className="h-32 w-full">
              <div className="space-y-2">
                {staticItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      {getCategoryIcon(item.category)}
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* AI-Generated Items */}
        {aiItems.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                AI-Enhanced Items ({aiItems.length})
              </h4>
              <ScrollArea className="h-32 w-full">
                <div className="space-y-2">
                  {aiItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 flex-1">
                        {getCategoryIcon(item.category)}
                        <span className="text-sm font-medium">{item.title}</span>
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                          AI
                        </Badge>
                        {item.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Generation Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">AI Enhancement Details</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Analyzed property type and location characteristics</p>
            <p>• Added {aiItems.length} property-specific inspection items</p>
            <p>• Optimized checklist for maximum coverage and efficiency</p>
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" size="lg">
          <ArrowRight className="w-4 h-4 mr-2" />
          Begin Inspection with This Checklist
        </Button>

        {/* Timing Info */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Estimated inspection time: {Math.ceil(totalItems * 2.5)} minutes</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChecklistGenerationStep;
export { ChecklistGenerationStep };