
import { useToast } from "@/hooks/use-toast";
import type { PropertyFormData } from "@/types/propertySubmission";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const usePropertyFormValidation = () => {
  const { toast } = useToast();

  const validateFormData = (formData: PropertyFormData): ValidationResult => {
    const errors: string[] = [];

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
      errors.push("Property name is required");
    } else if (formData.name.trim().length < 2) {
      errors.push("Property name must be at least 2 characters long");
    } else if (formData.name.trim().length > 200) {
      errors.push("Property name cannot exceed 200 characters");
    }

    // Address validation
    if (!formData.address || formData.address.trim().length === 0) {
      errors.push("Property address is required");
    } else if (formData.address.trim().length < 5) {
      errors.push("Address must be at least 5 characters long");
    } else if (formData.address.trim().length > 500) {
      errors.push("Address cannot exceed 500 characters");
    }

    // URL validation (optional but if provided must be valid)
    if (formData.vrbo_url && formData.vrbo_url.trim()) {
      if (!isValidUrl(formData.vrbo_url.trim())) {
        errors.push("Vrbo URL must be a valid URL");
      } else if (!formData.vrbo_url.toLowerCase().includes('vrbo.com')) {
        errors.push("Vrbo URL must be from vrbo.com domain");
      }
    }

    if (formData.airbnb_url && formData.airbnb_url.trim()) {
      if (!isValidUrl(formData.airbnb_url.trim())) {
        errors.push("Airbnb URL must be a valid URL");
      } else if (!formData.airbnb_url.toLowerCase().includes('airbnb.com')) {
        errors.push("Airbnb URL must be from airbnb.com domain");
      }
    }

    // At least one URL should be provided
    const hasVrbo = formData.vrbo_url && formData.vrbo_url.trim();
    const hasAirbnb = formData.airbnb_url && formData.airbnb_url.trim();
    
    if (!hasVrbo && !hasAirbnb) {
      errors.push("At least one listing URL (Vrbo or Airbnb) is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const validateSubmission = (
    user: any,
    isOnline: boolean,
    formData: PropertyFormData
  ): boolean => {
    console.log('🔍 Starting comprehensive validation...', {
      hasUser: !!user,
      isOnline,
      formData: {
        name: formData.name?.substring(0, 50) + (formData.name?.length > 50 ? '...' : ''),
        address: formData.address?.substring(0, 50) + (formData.address?.length > 50 ? '...' : ''),
        hasVrbo: !!formData.vrbo_url,
        hasAirbnb: !!formData.airbnb_url
      }
    });

    // Authentication check
    if (!user) {
      console.error('❌ Validation failed: No authenticated user');
      toast({
        title: "Authentication Required",
        description: "Please log in to add or edit properties.",
        variant: "destructive",
      });
      return false;
    }

    // Network check
    if (!isOnline) {
      console.error('❌ Validation failed: No network connection');
      toast({
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return false;
    }

    // Form data validation
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      console.error('❌ Validation failed: Form errors', validation.errors);
      toast({
        title: "Validation Error",
        description: validation.errors[0], // Show first error
        variant: "destructive",
      });
      return false;
    }

    console.log('✅ All validation checks passed');
    return true;
  };

  return { 
    validateSubmission,
    validateFormData 
  };
};
