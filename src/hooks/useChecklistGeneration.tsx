/**
 * Checklist Generation Business Logic Hook
 * Extracted from ChecklistGenerationStep.tsx for surgical refactoring
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface Property {
  id: string;
  property_name: string;
  street_address: string;
  type?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  evidence_type: string;
  description?: string;
  ai_generated?: boolean;
}

export interface UseChecklistGenerationProps {
  property: Property;
  generatedChecklist?: ChecklistItem[];
  onChecklistGenerated: (checklist: ChecklistItem[]) => void;
}

export interface UseChecklistGenerationReturn {
  // State
  isGenerating: boolean;
  generationProgress: number;
  generationStage: string;
  staticItems: ChecklistItem[];
  aiItems: ChecklistItem[];
  totalItems: number;
  
  // Actions
  generateChecklist: () => Promise<void>;
  handleRegenerateChecklist: () => void;
  
  // Utilities
  getCategoryIcon: (category: string) => React.ReactNode;
  getCategoryColor: (category: string) => string;
}

export const useChecklistGeneration = ({
  property,
  generatedChecklist,
  onChecklistGenerated
}: UseChecklistGenerationProps): UseChecklistGenerationReturn => {
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

  const categorizeExistingChecklist = useCallback(() => {
    if (!generatedChecklist) return;
    
    const static_items = generatedChecklist.filter(item => !item.ai_generated);
    const ai_items = generatedChecklist.filter(item => item.ai_generated);
    
    setStaticItems(static_items);
    setAiItems(ai_items);
  }, [generatedChecklist]);

  const generateAIItems = useCallback((property: Property): ChecklistItem[] => {
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
  }, []);

  const generateChecklist = useCallback(async () => {
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
  }, [property, onChecklistGenerated, toast, generateAIItems]);

  const handleRegenerateChecklist = useCallback(() => {
    setStaticItems([]);
    setAiItems([]);
    generateChecklist();
  }, [generateChecklist]);

  // Utility functions (imported from original component)
  const getCategoryIcon = useCallback((category: string) => {
    // Note: Icons will be imported in the component that uses this hook
    return null; // Component will handle icon rendering
  }, []);

  const getCategoryColor = useCallback((category: string) => {
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
  }, []);

  const totalItems = staticItems.length + aiItems.length;

  return {
    // State
    isGenerating,
    generationProgress,
    generationStage,
    staticItems,
    aiItems,
    totalItems,
    
    // Actions
    generateChecklist,
    handleRegenerateChecklist,
    
    // Utilities
    getCategoryIcon,
    getCategoryColor
  };
};