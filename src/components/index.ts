// Component exports for better organization
export { AuthProvider } from './AuthProvider';
export { ProtectedRoute } from './ProtectedRoute';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorBoundary } from './ErrorBoundary';

// AI Components
export { 
  AIAnalysisDisplay, 
  PhotoComparisonDisplay, 
  AIAnalysisStateDisplay 
} from './ai/AIAnalysisDisplay';

// Scraper Components
export { PropertyDataDisplay } from './scrapers/PropertyDataDisplay';

// UI Components
export * from './ui';

// Re-export commonly used components
export { PropertyCard } from './PropertyCard';
export { InspectionHeader } from './InspectionHeader';
export { ChecklistItem } from './ChecklistItem';