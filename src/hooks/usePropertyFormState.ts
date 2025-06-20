
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

interface DebugInfo {
  [key: string]: any;
}

export const usePropertyFormState = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  // Enhanced authentication validation
  useEffect(() => {
    if (!user) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      return;
    }

    console.log('👤 Auth Status:', {
      user: {
        id: user.id,
        email: user.email,
        role: userRole
      },
      timestamp: new Date().toISOString()
    });

    setDebugInfo(prev => ({
      ...prev,
      authStatus: {
        authenticated: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userRole,
        timestamp: new Date().toISOString()
      }
    }));
  }, [user, userRole]);

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
        
        setDebugInfo(prev => ({
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
      setDebugInfo(prev => ({
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
      
      setDebugInfo(prev => ({
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

  const submitProperty = async (formData: any, isOnline: boolean) => {
    console.log('🚀 Starting form submission process...');
    
    // Pre-submission validation
    if (!user) {
      console.error('❌ No authenticated user found');
      toast({
        title: "Authentication Required",
        description: "Please log in to add or edit properties.",
        variant: "destructive",
      });
      return false;
    }

    if (!isOnline) {
      console.error('❌ No network connection');
      toast({
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    
    const submitStartTime = Date.now();
    const submitData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      vrbo_url: formData.vrbo_url.trim() || null,
      airbnb_url: formData.airbnb_url.trim() || null,
    };

    console.log(`${isEditing ? '📝 Updating' : '➕ Creating'} property with data:`, {
      ...submitData,
      userId: user.id,
      userEmail: user.email,
      userRole,
      isEditing,
      editId,
      timestamp: new Date().toISOString()
    });

    try {
      let result;
      
      if (isEditing) {
        console.log('🔄 Executing UPDATE operation...');
        result = await supabase
          .from('properties')
          .update({
            ...submitData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .select()
          .single();
      } else {
        console.log('🆕 Executing INSERT operation...');
        result = await supabase
          .from('properties')
          .insert({
            ...submitData,
            added_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      const { data, error } = result;
      const submitDuration = Date.now() - submitStartTime;

      if (error) {
        console.error(`❌ Database error during ${isEditing ? 'update' : 'insert'}:`, {
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          },
          operation: isEditing ? 'update' : 'insert',
          userId: user.id,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        });

        setDebugInfo(prev => ({
          ...prev,
          submitError: {
            operation: isEditing ? 'update' : 'insert',
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            duration: submitDuration,
            timestamp: new Date().toISOString()
          }
        }));

        // Enhanced error handling with specific messages
        let errorMessage = "An error occurred while saving the property.";
        
        if (error.code === '23505') {
          errorMessage = "A property with this information already exists.";
        } else if (error.code === '42501') {
          errorMessage = "You don't have permission to perform this action.";
        } else if (error.code === 'PGRST116') {
          errorMessage = "The property could not be found.";
        } else if (error.message.includes('JWT')) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = "You don't have permission to access this property.";
        }

        toast({
          title: `Error ${isEditing ? 'Updating' : 'Creating'} Property`,
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      console.log(`✅ Property ${isEditing ? 'updated' : 'created'} successfully:`, {
        data,
        duration: submitDuration,
        timestamp: new Date().toISOString()
      });

      setDebugInfo(prev => ({
        ...prev,
        submitSuccess: {
          operation: isEditing ? 'update' : 'insert',
          propertyId: data?.id,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: `Property ${isEditing ? 'Updated' : 'Added'}`,
        description: `The property "${submitData.name}" has been ${isEditing ? 'updated' : 'added'} successfully.`,
      });

      // Small delay to ensure UI feedback is seen
      setTimeout(() => {
        navigate('/properties');
      }, 500);

      return true;
    } catch (error) {
      const submitDuration = Date.now() - submitStartTime;
      console.error(`💥 Unexpected error during ${isEditing ? 'update' : 'create'}:`, {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        duration: submitDuration,
        timestamp: new Date().toISOString()
      });

      setDebugInfo(prev => ({
        ...prev,
        unexpectedSubmitError: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred. Please try again or contact support if the problem persists.`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEditing,
    isLoading,
    isLoadingProperty,
    debugInfo,
    loadProperty,
    submitProperty,
    setDebugInfo
  };
};
