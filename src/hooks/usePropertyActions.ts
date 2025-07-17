
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deletePropertyData } from "@/utils/propertyDeletion";
import { useSmartCache } from "@/hooks/useSmartCache";
import { IdConverter } from "@/utils/idConverter";

interface PropertyActionError {
  type: 'network' | 'validation' | 'auth' | 'system';
  message: string;
  action: string;
  retryable: boolean;
}

interface PropertyActionState {
  isLoading: boolean;
  error: PropertyActionError | null;
  retryCount: number;
}

export const usePropertyActions = () => {
  const [actionState, setActionState] = useState<PropertyActionState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invalidatePropertyData } = useSmartCache();

  const classifyError = (error: any, action: string): PropertyActionError => {
    const errorMessage = error?.message || 'Unknown error occurred';
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet.',
        action,
        retryable: true
      };
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return {
        type: 'auth',
        message: 'You don\'t have permission to perform this action.',
        action,
        retryable: false
      };
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        type: 'validation',
        message: 'The data provided is invalid. Please check and try again.',
        action,
        retryable: false
      };
    }
    
    return {
      type: 'system',
      message: errorMessage,
      action,
      retryable: true
    };
  };

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    actionName: string,
    maxRetries = 3
  ): Promise<T | null> => {
    setActionState(prev => ({ ...prev, isLoading: true, error: null }));
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        setActionState({
          isLoading: false,
          error: null,
          retryCount: 0
        });
        
        return result;
      } catch (error) {
        console.error(`❌ ${actionName} attempt ${attempt + 1} failed:`, error);
        
        const classifiedError = classifyError(error, actionName);
        
        if (attempt === maxRetries || !classifiedError.retryable) {
          setActionState({
            isLoading: false,
            error: classifiedError,
            retryCount: attempt + 1
          });
          
          toast({
            title: `${actionName} Failed`,
            description: classifiedError.message,
            variant: "destructive",
          });
          
          return null;
        }
        
        setActionState(prev => ({ ...prev, retryCount: attempt + 1 }));
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return null;
  }, [toast]);

  const deleteProperty = useCallback(async (propertyId: string) => {
    console.log('🗑️ Starting comprehensive property deletion:', propertyId);
    
    return executeWithRetry(async () => {
      // Use the existing utility which has the full deletion logic
      await deletePropertyData(propertyId);
      
      toast({
        title: "Property Deleted",
        description: "The property and all associated data have been permanently removed.",
      });
      
      // Invalidate cache to refresh the UI
      invalidatePropertyData();
      
      return true;
    }, 'Delete Property');
  }, [executeWithRetry, toast, invalidatePropertyData]);

  const editProperty = useCallback((propertyId: string) => {
    try {
      console.log('🔧 Navigating to edit property:', propertyId);
      navigate(`/add-property?edit=${propertyId}`);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      toast({
        title: "Navigation Failed",
        description: "Could not navigate to edit page. Please try again.",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const startInspection = useCallback(async (propertyId: string) => {
    console.log('🚀 Starting inspection for property:', propertyId);
    
    return executeWithRetry(async () => {
      // Convert propertyId to integer for database query
      const propertyIdInt = IdConverter.property.toDatabase(propertyId);

      // Check if there's already an active inspection
      const { data: existingInspection, error: checkError } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyIdInt)
        .eq('completed', false)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingInspection) {
        console.log('📋 Joining existing inspection:', existingInspection.id);
        navigate(`/inspection/${existingInspection.id}`);
        return existingInspection.id;
      }
      
      // Create new inspection using the secure creation service
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to create inspections');
      }

      let inspectionId: string;
      
      try {
        // Try secure RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_inspection_secure', {
          p_property_id: propertyIdInt,
          p_inspector_id: user.id
        });
        
        if (rpcError) {
          throw new Error(`RPC failed: ${rpcError.message}`);
        }
        
        if (!rpcData) {
          throw new Error('RPC function returned no data');
        }
        
        inspectionId = rpcData;
        
      } catch (rpcError) {
        console.log('🔧 RPC function not available, using direct insert:', rpcError);
        
        // Fallback to direct insert with proper RLS context
        const { data: newInspection, error: createError } = await supabase
          .from('inspections')
          .insert({
            property_id: propertyIdInt,
            inspector_id: user.id, // Always include inspector_id for RLS
            start_time: new Date().toISOString(),
            completed: false,
            status: 'draft'
          })
          .select('id')
          .single();
        
        if (createError) {
          throw new Error(`Direct insert failed: ${createError.message}`);
        }
        
        if (!newInspection?.id) {
          throw new Error('Direct insert returned no inspection ID');
        }
        
        inspectionId = newInspection.id;
      }
      
      console.log('✅ Created new inspection:', inspectionId);
      navigate(`/inspection/${inspectionId}`);
      
      toast({
        title: "Inspection Started",
        description: "A new inspection has been created successfully.",
      });
      
      return inspectionId;
    }, 'Start Inspection');
  }, [executeWithRetry, navigate, toast]);

  const clearError = useCallback(() => {
    setActionState(prev => ({ ...prev, error: null }));
  }, []);

  const retry = useCallback(() => {
    if (actionState.error?.retryable) {
      setActionState(prev => ({ ...prev, error: null, retryCount: 0 }));
    }
  }, [actionState.error]);

  // Enhanced interface with backward compatibility
  return {
    // Enhanced interface
    deleteProperty,
    editProperty,
    startInspection,
    actionState,
    clearError,
    retry,
    
    // Backward compatibility aliases for legacy components
    handleDelete: deleteProperty,
    handleEdit: editProperty,
    handleStartInspection: startInspection
  };
};
