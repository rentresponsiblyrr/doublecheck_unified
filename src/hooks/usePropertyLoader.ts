
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LoadDebugInfo {
  loadError?: {
    error: string;
    code?: string;
    details?: string;
    hint?: string;
    propertyId: string;
    timestamp: string;
  };
  unexpectedLoadError?: {
    error: string;
    stack?: string;
    timestamp: string;
  };
  loadedProperty?: {
    id: string;
    name: string;
    hasVrboUrl: boolean;
    hasAirbnbUrl: boolean;
    timestamp: string;
  };
}

export const usePropertyLoader = (user: any) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [loadDebugInfo, setLoadDebugInfo] = useState<LoadDebugInfo>({});

  const loadProperty = async () => {
    if (!isEditing || !editId || !user) return null;

    setIsLoadingProperty(true);
    console.log('📝 Loading property for editing:', editId);
    
    try {
      console.log('🔍 Fetching property data...');
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', editId)
        .single();

      if (error) {
        console.error('❌ Error loading property:', {
          error,
          propertyId: editId,
          userId: user.id
        });
        
        setLoadDebugInfo(prev => ({
          ...prev,
          loadError: {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            propertyId: editId,
            timestamp: new Date().toISOString()
          }
        }));

        toast({
          title: "Error Loading Property",
          description: `Failed to load property: ${error.message}`,
          variant: "destructive",
        });
        navigate('/properties');
        return null;
      }

      console.log('✅ Property loaded successfully:', data);
      setLoadDebugInfo(prev => ({
        ...prev,
        loadedProperty: {
          id: data.id,
          name: data.name,
          hasVrboUrl: !!data.vrbo_url,
          hasAirbnbUrl: !!data.airbnb_url,
          timestamp: new Date().toISOString()
        }
      }));

      return {
        name: data.name || "",
        address: data.address || "",
        vrbo_url: data.vrbo_url || "",
        airbnb_url: data.airbnb_url || ""
      };
    } catch (error) {
      console.error('💥 Unexpected error loading property:', error);
      
      setLoadDebugInfo(prev => ({
        ...prev,
        unexpectedLoadError: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: "Error",
        description: "An unexpected error occurred while loading the property.",
        variant: "destructive",
      });
      navigate('/properties');
      return null;
    } finally {
      setIsLoadingProperty(false);
    }
  };

  return {
    isEditing,
    isLoadingProperty,
    loadProperty,
    loadDebugInfo
  };
};
