
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { MobileInspectionOptimizer } from "@/services/mobileInspectionOptimizer";

// Enhanced error classification for better user feedback
const getErrorDetails = (error: any) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network-related errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      userMessage: 'Network connection issue. Please check your internet and try again.',
      category: 'network'
    };
  }
  
  // Database constraint errors
  if (errorMessage.includes('constraint') || errorMessage.includes('23514')) {
    return {
      userMessage: 'Database error. Please contact support if this persists.',
      category: 'database'
    };
  }
  
  // Permission/authentication errors
  if (errorMessage.includes('permission') || errorMessage.includes('authentication')) {
    return {
      userMessage: 'Permission denied. Please refresh the page and try again.',
      category: 'auth'
    };
  }
  
  // Property-related errors
  if (errorMessage.includes('property') || errorMessage.includes('Invalid property')) {
    return {
      userMessage: 'Invalid property. Please refresh the page and try again.',
      category: 'property'
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return {
      userMessage: 'Request timed out. Please try again.',
      category: 'timeout'
    };
  }
  
  // Generic fallback with more helpful message
  return {
    userMessage: 'Unable to create inspection. Please try again or contact support.',
    category: 'unknown'
  };
};

export const useMobileInspectionOptimizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startOrJoinInspection = useCallback(async (propertyId: string) => {
    if (!propertyId || isLoading) {
      console.warn('⚠️ Invalid property ID or operation already in progress');
      return null;
    }

    setIsLoading(true);
    setError(null);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout for the operation (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error('Timeout: Inspection creation is taking too long. Please try again.'));
      }, 30000); // 30 second timeout
    });

    try {
      console.log('🚀 Starting optimized mobile inspection flow for:', propertyId);
      
      // Race between the actual operation and timeout
      const result = await Promise.race([
        MobileInspectionOptimizer.getOrCreateInspectionOptimized(propertyId),
        timeoutPromise
      ]);
      
      // Clear timeout if operation succeeds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Inspector is now assigned during creation via secure function
      // No separate assignment needed
      
      const actionText = result.isNew ? 'created' : 'joined';
      const toastTitle = result.isNew ? 'Inspection Created' : 'Joining Inspection';
      const toastDescription = `${actionText} inspection for ${result.propertyName} with ${result.checklistItemsCount} items`;

      console.log(`✅ Successfully ${actionText} optimized inspection:`, result.inspectionId);
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });

      // Navigate with optimized route
      navigate(`/inspection/${result.inspectionId}`, { replace: true });
      
      return result.inspectionId;

    } catch (error) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const errorDetails = getErrorDetails(error);
      console.error('💥 Optimized mobile inspection flow error:', error);
      
      setError(errorDetails.userMessage);
      toast({
        title: "Inspection Failed",
        description: errorDetails.userMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, navigate, toast]);

  const clearError = useCallback(() => setError(null), []);

  // Retry mechanism - calls the same function with the last used property ID
  const retryInspection = useCallback(async (propertyId: string) => {
    console.log('🔄 Retrying inspection creation for property:', propertyId);
    return await startOrJoinInspection(propertyId);
  }, [startOrJoinInspection]);

  return {
    startOrJoinInspection,
    retryInspection,
    isLoading,
    error,
    clearError
  };
};
