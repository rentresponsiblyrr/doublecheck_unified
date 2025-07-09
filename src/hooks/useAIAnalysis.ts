// React Hook for AI Analysis in STR Certified

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { STRCertifiedAIService, createAIService } from '@/lib/ai/openai-service';
import type {
  AIAnalysisResult,
  PhotoComparisonResult,
  DynamicChecklistItem,
  PropertyData,
  AIAnalysisState,
  AIError,
  AIAnalysisOptions
} from '@/lib/ai/types';

interface UseAIAnalysisConfig {
  apiKey?: string;
  maxRetries?: number;
  retryDelay?: number;
  enableAutoRetry?: boolean;
}

interface UseAIAnalysisReturn {
  // States
  analysisState: AIAnalysisState;
  
  // Photo Analysis
  analyzePhoto: (file: File, context: string, options?: AIAnalysisOptions) => Promise<AIAnalysisResult>;
  photoAnalysis: {
    isLoading: boolean;
    error: AIError | null;
    data: AIAnalysisResult | null;
    retry: () => void;
  };
  
  // Photo Comparison
  comparePhotos: (inspectorPhoto: File, listingPhotos: string[], context: string) => Promise<PhotoComparisonResult>;
  photoComparison: {
    isLoading: boolean;
    error: AIError | null;
    data: PhotoComparisonResult | null;
    retry: () => void;
  };
  
  // Checklist Generation
  generateChecklist: (propertyData: PropertyData) => Promise<DynamicChecklistItem[]>;
  checklistGeneration: {
    isLoading: boolean;
    error: AIError | null;
    data: DynamicChecklistItem[] | null;
    retry: () => void;
  };
  
  // Validation
  validateInspection: (checklistItems: any[], photos: File[]) => Promise<any>;
  inspectionValidation: {
    isLoading: boolean;
    error: AIError | null;
    data: any;
    retry: () => void;
  };
  
  // Utility
  resetAnalysis: () => void;
  isAnalyzing: boolean;
}

export const useAIAnalysis = (config: UseAIAnalysisConfig = {}): UseAIAnalysisReturn => {
  const {
    apiKey = process.env.VITE_OPENAI_API_KEY || '',
    maxRetries = 3,
    retryDelay = 1000,
    enableAutoRetry = true
  } = config;

  // State management
  const [analysisState, setAnalysisState] = useState<AIAnalysisState>({
    status: 'idle'
  });

  // Service instance ref
  const aiServiceRef = useRef<STRCertifiedAIService | null>(null);

  // Initialize AI service
  const getAIService = useCallback(() => {
    if (!aiServiceRef.current && apiKey) {
      aiServiceRef.current = createAIService({ apiKey });
    }
    if (!aiServiceRef.current) {
      throw new Error('OpenAI API key is required for AI analysis');
    }
    return aiServiceRef.current;
  }, [apiKey]);

  // Photo Analysis Mutation
  const photoAnalysisMutation = useMutation({
    mutationFn: async ({ 
      file, 
      context, 
      options 
    }: { 
      file: File; 
      context: string; 
      options?: AIAnalysisOptions;
    }) => {
      const service = getAIService();
      setAnalysisState({ status: 'analyzing', progress: 0 });
      
      try {
        const result = await service.analyzeInspectionPhoto(file, context, options);
        setAnalysisState({ status: 'completed', result, progress: 100 });
        return result;
      } catch (error) {
        const aiError = error as AIError;
        setAnalysisState({ status: 'error', error: aiError });
        throw aiError;
      }
    },
    retry: (failureCount, error) => {
      const aiError = error as AIError;
      return enableAutoRetry && aiError.retryable && failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 10000),
  });

  // Photo Comparison Mutation
  const photoComparisonMutation = useMutation({
    mutationFn: async ({
      inspectorPhoto,
      listingPhotos,
      context
    }: {
      inspectorPhoto: File;
      listingPhotos: string[];
      context: string;
    }) => {
      const service = getAIService();
      setAnalysisState({ status: 'analyzing', progress: 0 });
      
      try {
        const result = await service.comparePhotoToListing(inspectorPhoto, listingPhotos, context);
        setAnalysisState({ status: 'completed', progress: 100 });
        return result;
      } catch (error) {
        const aiError = error as AIError;
        setAnalysisState({ status: 'error', error: aiError });
        throw aiError;
      }
    },
    retry: (failureCount, error) => {
      const aiError = error as AIError;
      return enableAutoRetry && aiError.retryable && failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 10000),
  });

  // Checklist Generation Mutation
  const checklistGenerationMutation = useMutation({
    mutationFn: async (propertyData: PropertyData) => {
      const service = getAIService();
      setAnalysisState({ status: 'analyzing', progress: 0 });
      
      try {
        const result = await service.generateDynamicChecklist(propertyData);
        setAnalysisState({ status: 'completed', progress: 100 });
        return result;
      } catch (error) {
        const aiError = error as AIError;
        setAnalysisState({ status: 'error', error: aiError });
        throw aiError;
      }
    },
    retry: (failureCount, error) => {
      const aiError = error as AIError;
      return enableAutoRetry && aiError.retryable && failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 10000),
  });

  // Inspection Validation Mutation
  const inspectionValidationMutation = useMutation({
    mutationFn: async ({
      checklistItems,
      photos
    }: {
      checklistItems: any[];
      photos: File[];
    }) => {
      const service = getAIService();
      setAnalysisState({ status: 'analyzing', progress: 0 });
      
      try {
        const result = await service.validateInspectionCompleteness(checklistItems, photos);
        setAnalysisState({ status: 'completed', progress: 100 });
        return result;
      } catch (error) {
        const aiError = error as AIError;
        setAnalysisState({ status: 'error', error: aiError });
        throw aiError;
      }
    },
    retry: (failureCount, error) => {
      const aiError = error as AIError;
      return enableAutoRetry && aiError.retryable && failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 10000),
  });

  // Helper functions
  const analyzePhoto = useCallback(
    async (file: File, context: string, options?: AIAnalysisOptions) => {
      return photoAnalysisMutation.mutateAsync({ file, context, options });
    },
    [photoAnalysisMutation]
  );

  const comparePhotos = useCallback(
    async (inspectorPhoto: File, listingPhotos: string[], context: string) => {
      return photoComparisonMutation.mutateAsync({ inspectorPhoto, listingPhotos, context });
    },
    [photoComparisonMutation]
  );

  const generateChecklist = useCallback(
    async (propertyData: PropertyData) => {
      return checklistGenerationMutation.mutateAsync(propertyData);
    },
    [checklistGenerationMutation]
  );

  const validateInspection = useCallback(
    async (checklistItems: any[], photos: File[]) => {
      return inspectionValidationMutation.mutateAsync({ checklistItems, photos });
    },
    [inspectionValidationMutation]
  );

  const resetAnalysis = useCallback(() => {
    setAnalysisState({ status: 'idle' });
    photoAnalysisMutation.reset();
    photoComparisonMutation.reset();
    checklistGenerationMutation.reset();
    inspectionValidationMutation.reset();
  }, [
    photoAnalysisMutation,
    photoComparisonMutation,
    checklistGenerationMutation,
    inspectionValidationMutation
  ]);

  // Computed values
  const isAnalyzing = 
    photoAnalysisMutation.isPending ||
    photoComparisonMutation.isPending ||
    checklistGenerationMutation.isPending ||
    inspectionValidationMutation.isPending;

  return {
    analysisState,
    
    analyzePhoto,
    photoAnalysis: {
      isLoading: photoAnalysisMutation.isPending,
      error: photoAnalysisMutation.error as AIError | null,
      data: photoAnalysisMutation.data || null,
      retry: () => photoAnalysisMutation.reset(),
    },
    
    comparePhotos,
    photoComparison: {
      isLoading: photoComparisonMutation.isPending,
      error: photoComparisonMutation.error as AIError | null,
      data: photoComparisonMutation.data || null,
      retry: () => photoComparisonMutation.reset(),
    },
    
    generateChecklist,
    checklistGeneration: {
      isLoading: checklistGenerationMutation.isPending,
      error: checklistGenerationMutation.error as AIError | null,
      data: checklistGenerationMutation.data || null,
      retry: () => checklistGenerationMutation.reset(),
    },
    
    validateInspection,
    inspectionValidation: {
      isLoading: inspectionValidationMutation.isPending,
      error: inspectionValidationMutation.error as AIError | null,
      data: inspectionValidationMutation.data || null,
      retry: () => inspectionValidationMutation.reset(),
    },
    
    resetAnalysis,
    isAnalyzing,
  };
};

// Specialized hooks for specific use cases

export const usePhotoAnalysis = (config?: UseAIAnalysisConfig) => {
  const { analyzePhoto, photoAnalysis, resetAnalysis } = useAIAnalysis(config);
  
  return {
    analyzePhoto,
    ...photoAnalysis,
    reset: resetAnalysis,
  };
};

export const usePhotoComparison = (config?: UseAIAnalysisConfig) => {
  const { comparePhotos, photoComparison, resetAnalysis } = useAIAnalysis(config);
  
  return {
    comparePhotos,
    ...photoComparison,
    reset: resetAnalysis,
  };
};

export const useChecklistGeneration = (config?: UseAIAnalysisConfig) => {
  const { generateChecklist, checklistGeneration, resetAnalysis } = useAIAnalysis(config);
  
  return {
    generateChecklist,
    ...checklistGeneration,
    reset: resetAnalysis,
  };
};

export const useInspectionValidation = (config?: UseAIAnalysisConfig) => {
  const { validateInspection, inspectionValidation, resetAnalysis } = useAIAnalysis(config);
  
  return {
    validateInspection,
    ...inspectionValidation,
    reset: resetAnalysis,
  };
};