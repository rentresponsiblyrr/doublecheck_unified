
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export const useRobustPropertyActions = () => {
  const [actionState, setActionState] = useState<PropertyActionState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

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
      // First, delete all related inspections and their data
      const { data: inspections, error: fetchError } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId);
      
      if (fetchError) throw fetchError;
      
      if (inspections && inspections.length > 0) {
        const inspectionIds = inspections.map(i => i.id);
        
        // Delete checklist items for all inspections
        const { error: checklistError } = await supabase
          .from('checklist_items')
          .delete()
          .in('inspection_id', inspectionIds);
        
        if (checklistError) throw checklistError;
        
        // Delete media for all inspections
        const { error: mediaError } = await supabase
          .from('media')
          .delete()
          .in('checklist_item_id', 
            await supabase
              .from('checklist_items')
              .select('id')
              .in('inspection_id', inspectionIds)
              .then(res => res.data?.map(item => item.id) || [])
          );
        
        // Delete inspections
        const { error: inspectionError } = await supabase
          .from('inspections')
          .delete()
          .eq('property_id', propertyId);
        
        if (inspectionError) throw inspectionError;
      }
      
      // Finally, delete the property
      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      if (propertyError) throw propertyError;
      
      toast({
        title: "Property Deleted",
        description: "The property and all associated data have been permanently removed.",
      });
      
      return true;
    }, 'Delete Property');
  }, [executeWithRetry, toast]);

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
      // Check if there's already an active inspection
      const { data: existingInspection, error: checkError } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId)
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
      
      // Create new inspection
      const { data: newInspection, error: createError } = await supabase
        .from('inspections')
        .insert({
          property_id: propertyId,
          start_time: new Date().toISOString(),
          completed: false
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      console.log('✅ Created new inspection:', newInspection.id);
      navigate(`/inspection/${newInspection.id}`);
      
      toast({
        title: "Inspection Started",
        description: "A new inspection has been created successfully.",
      });
      
      return newInspection.id;
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

  return {
    deleteProperty,
    editProperty,
    startInspection,
    actionState,
    clearError,
    retry
  };
};
