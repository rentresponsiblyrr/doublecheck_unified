export interface OptimizationSuggestion {
  id: string;
  category:
    | "photos"
    | "pricing"
    | "amenities"
    | "description"
    | "safety"
    | "overall";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  estimatedROI: number;
  implementationTime: string;
  difficultyLevel: "easy" | "medium" | "hard";
}

export interface ListingScore {
  overall: number;
  photos: number;
  pricing: number;
  amenities: number;
  safety: number;
}

export interface ListingOptimizationData {
  propertyId: string;
  suggestions: OptimizationSuggestion[];
  score: ListingScore;
  isLoading: boolean;
  className?: string;
}
