// Photo Guidance Hook for STR Certified

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { ChecklistItem } from '@/types/photo';

export interface PhotoGuidanceStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  requiredQualityScore: number;
  tips: string[];
  examplePhotoUrl?: string;
  focusAreas?: Array<{
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface PhotoGuidanceState {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: number;
  isComplete: boolean;
  currentGuidance: string;
  history: Array<{
    stepId: string;
    timestamp: Date;
    qualityScore: number;
    photoUrl?: string;
  }>;
}

export interface UsePhotoGuidanceOptions {
  checklistItem: ChecklistItem;
  referencePhoto?: string;
  enableOfflineMode?: boolean;
  autoAdvance?: boolean;
}

export interface UsePhotoGuidanceReturn {
  currentStep: number;
  guidance: PhotoGuidanceState;
  steps: PhotoGuidanceStep[];
  isComplete: boolean;
  isLoading: boolean;
  error: Error | null;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  markStepComplete: (qualityScore: number, photoUrl?: string) => void;
  resetGuidance: () => void;
  getProgress: () => number;
  getCurrentRequirements: () => string[];
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

// Default guidance steps for different room types
const DEFAULT_GUIDANCE_STEPS: Record<string, PhotoGuidanceStep[]> = {
  bedroom: [
    {
      id: 'overview',
      title: 'Room Overview',
      description: 'Capture the entire room from the doorway',
      icon: '🚪',
      requiredQualityScore: 70,
      tips: [
        'Stand in the doorway',
        'Include all major furniture',
        'Ensure good lighting',
        'Keep device level'
      ],
      focusAreas: [
        { label: 'Bed', x: 30, y: 40, width: 40, height: 30 },
        { label: 'Window', x: 70, y: 20, width: 25, height: 40 }
      ]
    },
    {
      id: 'bed_detail',
      title: 'Bed & Linens',
      description: 'Focus on bed condition and cleanliness',
      icon: '🛏️',
      requiredQualityScore: 80,
      tips: [
        'Get close to show linen quality',
        'Check for stains or damage',
        'Include pillows and covers',
        'Capture from a 45-degree angle'
      ]
    },
    {
      id: 'storage',
      title: 'Storage Areas',
      description: 'Capture closets, dressers, and nightstands',
      icon: '🗄️',
      requiredQualityScore: 75,
      tips: [
        'Open closet doors',
        'Show drawer interiors if needed',
        'Check for damage or wear',
        'Ensure adequate lighting inside'
      ]
    },
    {
      id: 'amenities',
      title: 'Room Amenities',
      description: 'Document TV, AC, outlets, and switches',
      icon: '📺',
      requiredQualityScore: 75,
      tips: [
        'Test all electronics',
        'Show remote controls',
        'Check outlet functionality',
        'Document any issues'
      ]
    }
  ],
  bathroom: [
    {
      id: 'overview',
      title: 'Bathroom Overview',
      description: 'Capture the entire bathroom',
      icon: '🚿',
      requiredQualityScore: 70,
      tips: [
        'Stand in doorway',
        'Include all fixtures',
        'Check for water damage',
        'Ensure good ventilation'
      ]
    },
    {
      id: 'fixtures',
      title: 'Fixtures & Plumbing',
      description: 'Focus on sink, toilet, and shower/tub',
      icon: '🚰',
      requiredQualityScore: 85,
      tips: [
        'Check for leaks or damage',
        'Test water pressure',
        'Look for mold or mildew',
        'Document any issues'
      ]
    },
    {
      id: 'amenities',
      title: 'Bathroom Amenities',
      description: 'Towels, toiletries, and storage',
      icon: '🧴',
      requiredQualityScore: 75,
      tips: [
        'Check towel quality',
        'Verify toiletries provided',
        'Open cabinets and drawers',
        'Note any missing items'
      ]
    }
  ],
  kitchen: [
    {
      id: 'overview',
      title: 'Kitchen Overview',
      description: 'Capture the entire kitchen space',
      icon: '🍳',
      requiredQualityScore: 70,
      tips: [
        'Show all major appliances',
        'Include countertops',
        'Capture from multiple angles',
        'Ensure good lighting'
      ]
    },
    {
      id: 'appliances',
      title: 'Appliances',
      description: 'Document all kitchen appliances',
      icon: '🔌',
      requiredQualityScore: 80,
      tips: [
        'Open refrigerator and oven',
        'Test all appliances',
        'Check for cleanliness',
        'Note any malfunctions'
      ]
    },
    {
      id: 'cookware',
      title: 'Cookware & Utensils',
      description: 'Show available cooking items',
      icon: '🍴',
      requiredQualityScore: 75,
      tips: [
        'Open all cabinets',
        'Document cookware condition',
        'Check for complete sets',
        'Note any missing items'
      ]
    }
  ],
  'living-room': [
    {
      id: 'overview',
      title: 'Living Room Overview',
      description: 'Capture the entire living space',
      icon: '🛋️',
      requiredQualityScore: 70,
      tips: [
        'Show seating arrangements',
        'Include entertainment center',
        'Capture natural lighting',
        'Take from room corners'
      ]
    },
    {
      id: 'seating',
      title: 'Seating & Comfort',
      description: 'Focus on sofas and chairs',
      icon: '🪑',
      requiredQualityScore: 75,
      tips: [
        'Check for stains or damage',
        'Test furniture stability',
        'Show cushion condition',
        'Document any wear'
      ]
    },
    {
      id: 'entertainment',
      title: 'Entertainment Setup',
      description: 'TV, sound system, and controls',
      icon: '📺',
      requiredQualityScore: 75,
      tips: [
        'Test all electronics',
        'Check remote controls',
        'Verify cable/streaming access',
        'Document model numbers'
      ]
    }
  ]
};

export const usePhotoGuidance = (options: UsePhotoGuidanceOptions): UsePhotoGuidanceReturn => {
  const {
    checklistItem,
    referencePhoto,
    enableOfflineMode = true,
    autoAdvance = false
  } = options;

  // Determine room type from checklist item
  const roomType = checklistItem.roomName?.toLowerCase().replace(/\s+/g, '-') || 'bedroom';
  const guidanceSteps = DEFAULT_GUIDANCE_STEPS[roomType] || DEFAULT_GUIDANCE_STEPS.bedroom;

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [guidanceState, setGuidanceState] = useState<PhotoGuidanceState>({
    currentStep: 0,
    totalSteps: guidanceSteps.length,
    stepsCompleted: 0,
    isComplete: false,
    currentGuidance: guidanceSteps[0]?.description || '',
    history: []
  });

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    if (enableOfflineMode) {
      loadProgress();
    }
  }, [checklistItem.id]);

  // Auto-save progress
  useEffect(() => {
    if (enableOfflineMode && guidanceState.history.length > 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 1000);
    }
  }, [guidanceState]);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (currentStep < guidanceSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setGuidanceState(prev => ({
        ...prev,
        currentStep: newStep,
        currentGuidance: guidanceSteps[newStep].description
      }));
    }
  }, [currentStep, guidanceSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      setGuidanceState(prev => ({
        ...prev,
        currentStep: newStep,
        currentGuidance: guidanceSteps[newStep].description
      }));
    }
  }, [currentStep, guidanceSteps]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < guidanceSteps.length) {
      setCurrentStep(step);
      setGuidanceState(prev => ({
        ...prev,
        currentStep: step,
        currentGuidance: guidanceSteps[step].description
      }));
    }
  }, [guidanceSteps]);

  const markStepComplete = useCallback((qualityScore: number, photoUrl?: string) => {
    const stepId = guidanceSteps[currentStep].id;
    
    setGuidanceState(prev => {
      // Check if step already completed
      const alreadyCompleted = prev.history.some(h => h.stepId === stepId);
      
      const newHistory = [...prev.history];
      if (!alreadyCompleted) {
        newHistory.push({
          stepId,
          timestamp: new Date(),
          qualityScore,
          photoUrl
        });
      }

      const stepsCompleted = new Set(newHistory.map(h => h.stepId)).size;
      const isComplete = stepsCompleted === guidanceSteps.length;

      return {
        ...prev,
        history: newHistory,
        stepsCompleted,
        isComplete
      };
    });

    // Auto-advance if enabled and quality meets requirements
    if (autoAdvance && qualityScore >= guidanceSteps[currentStep].requiredQualityScore) {
      setTimeout(() => nextStep(), 500);
    }
  }, [currentStep, guidanceSteps, autoAdvance, nextStep]);

  const resetGuidance = useCallback(() => {
    setCurrentStep(0);
    setGuidanceState({
      currentStep: 0,
      totalSteps: guidanceSteps.length,
      stepsCompleted: 0,
      isComplete: false,
      currentGuidance: guidanceSteps[0]?.description || '',
      history: []
    });
    
    // Clear saved progress
    if (enableOfflineMode) {
      localStorage.removeItem(`photo_guidance_${checklistItem.id}`);
    }
  }, [guidanceSteps, checklistItem.id, enableOfflineMode]);

  const getProgress = useCallback(() => {
    return (guidanceState.stepsCompleted / guidanceState.totalSteps) * 100;
  }, [guidanceState]);

  const getCurrentRequirements = useCallback(() => {
    const currentGuidanceStep = guidanceSteps[currentStep];
    return [
      `Minimum quality score: ${currentGuidanceStep.requiredQualityScore}%`,
      ...currentGuidanceStep.tips
    ];
  }, [currentStep, guidanceSteps]);

  const saveProgress = useCallback(async () => {
    if (!enableOfflineMode) return;
    
    const progressData = {
      checklistItemId: checklistItem.id,
      currentStep,
      guidanceState,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(
      `photo_guidance_${checklistItem.id}`,
      JSON.stringify(progressData)
    );
  }, [checklistItem.id, currentStep, guidanceState, enableOfflineMode]);

  const loadProgress = useCallback(async () => {
    if (!enableOfflineMode) return;
    
    try {
      const saved = localStorage.getItem(`photo_guidance_${checklistItem.id}`);
      if (saved) {
        const progressData = JSON.parse(saved);
        
        // Restore state
        setCurrentStep(progressData.currentStep);
        setGuidanceState(progressData.guidanceState);
      }
    } catch (error) {
      // REMOVED: console.error('Failed to load progress:', error);
    }
  }, [checklistItem.id, enableOfflineMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentStep,
    guidance: guidanceState,
    steps: guidanceSteps,
    isComplete: guidanceState.isComplete,
    isLoading: false,
    error: null,
    nextStep,
    previousStep,
    goToStep,
    markStepComplete,
    resetGuidance,
    getProgress,
    getCurrentRequirements,
    saveProgress,
    loadProgress
  };
};

// Utility hook for offline guidance caching
export const useOfflineGuidance = () => {
  const [cachedGuidance, setCachedGuidance] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCachedGuidance = () => {
      try {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('photo_guidance_')
        );
        
        const cached: Record<string, any> = {};
        keys.forEach(key => {
          try {
            cached[key] = JSON.parse(localStorage.getItem(key) || '{}');
          } catch (e) {
            // Skip invalid entries
          }
        });
        
        setCachedGuidance(cached);
      } catch (error) {
        // REMOVED: console.error('Failed to load cached guidance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedGuidance();
  }, []);

  const clearCache = useCallback(() => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('photo_guidance_'))
      .forEach(key => localStorage.removeItem(key));
    setCachedGuidance({});
  }, []);

  const getCachedProgress = useCallback((checklistItemId: string) => {
    return cachedGuidance[`photo_guidance_${checklistItemId}`];
  }, [cachedGuidance]);

  return {
    cachedGuidance,
    isLoading,
    clearCache,
    getCachedProgress
  };
};