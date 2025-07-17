
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import type { PropertyFormData } from "@/types/propertySubmission";

interface ExtendedPropertyFormData extends PropertyFormData {
  scraped_vrbo_data?: any;
}

export const useSimplePropertySubmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useMobileAuth();

  const validateForm = (formData: PropertyFormData): boolean => {
    // Check authentication
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add or edit properties.",
        variant: "destructive",
      });
      return false;
    }

    // Validate form data
    if (!formData.name || formData.name.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Property name must be at least 2 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.address || formData.address.trim().length < 5) {
      toast({
        title: "Validation Error",
        description: "Please provide a complete address.",
        variant: "destructive",
      });
      return false;
    }

    // Check that at least one URL is provided
    const hasVrbo = formData.vrbo_url && formData.vrbo_url.trim();
    const hasAirbnb = formData.airbnb_url && formData.airbnb_url.trim();
    
    if (!hasVrbo && !hasAirbnb) {
      toast({
        title: "Validation Error",
        description: "At least one listing URL (Vrbo or Airbnb) is required.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const submitProperty = async (formData: ExtendedPropertyFormData) => {
    console.log('🚀 Starting simple property submission...', { isEditing, formData });
    
    if (!validateForm(formData)) {
      return false;
    }

    setIsLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        vrbo_url: formData.vrbo_url.trim() || null,
        airbnb_url: formData.airbnb_url.trim() || null,
        scraped_data: formData.scraped_vrbo_data || null,
      };

      console.log('📝 Submitting data:', submitData);

      let result;
      if (isEditing) {
        result = await supabase
          .from('properties_fixed')
          .update({
            ...submitData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('properties_fixed')
          .insert({
            ...submitData,
            added_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        console.error('❌ Database error:', error);
        
        let errorMessage = "An error occurred while saving the property.";
        
        if (error.code === '23505') {
          if (error.message?.includes('properties_name')) {
            errorMessage = "A property with this name already exists.";
          } else if (error.message?.includes('vrbo_url')) {
            errorMessage = "This Vrbo URL is already registered.";
          } else if (error.message?.includes('airbnb_url')) {
            errorMessage = "This Airbnb URL is already registered.";
          }
        } else if (error.code === '42501' || error.message?.includes('JWT')) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.message?.includes('violates row-level security')) {
          errorMessage = "You don't have permission to perform this action.";
        }

        toast({
          title: `Error ${isEditing ? 'Updating' : 'Creating'} Property`,
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Property saved successfully:', data);

      toast({
        title: `Property ${isEditing ? 'Updated' : 'Added'}`,
        description: `The property "${formData.name.trim()}" has been ${isEditing ? 'updated' : 'added'} successfully.`,
      });

      setTimeout(() => {
        navigate('/properties');
      }, 500);

      return true;
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    submitProperty,
    isEditing
  };
};
