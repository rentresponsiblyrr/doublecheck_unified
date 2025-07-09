// Hook exports for better organization
export { useAuth } from './useAuth';
export { useInspectionData } from './useInspectionData';
export { usePropertyActions } from './usePropertyActions';
export { useNetworkStatus } from './useNetworkStatus';
export { useOfflineStorage } from './useOfflineStorage';

// AI Analysis hooks
export { 
  useAIAnalysis, 
  usePhotoAnalysis, 
  usePhotoComparison, 
  useChecklistGeneration,
  useInspectionValidation 
} from './useAIAnalysis';

// Property Scraper hooks
export { 
  usePropertyScraper, 
  useVRBOScraper, 
  usePhotoScraper 
} from './usePropertyScraper';

// Mobile-specific hooks
export { useMobileAuth } from './useMobileAuth';
export { useMobileDataManager } from './useMobileDataManager';
export { useMobileOptimizedInspection } from './useMobileOptimizedInspection';

// Form hooks
export { usePropertyForm } from './usePropertyForm';
export { usePropertyFormValidation } from './usePropertyFormValidation';