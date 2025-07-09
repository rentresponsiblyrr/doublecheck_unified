
import { useToast } from "@/hooks/use-toast";

export const usePropertyErrorHandler = () => {
  const { toast } = useToast();

  const handleSubmissionError = (error: Error | unknown, isEditing: boolean) => {
    console.log('🔍 Analyzing submission error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });

    let errorMessage = "An error occurred while saving the property.";
    let isTemporary = false;
    
    // Network and timeout errors
    if (error.code === 'PGRST301' || 
        error.code === 'PGRST504' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('connection')) {
      errorMessage = "Network connection error. Please check your internet connection and try again.";
      isTemporary = true;
    }
    // Authentication errors
    else if (error.code === '42501' || error.message?.includes('JWT')) {
      errorMessage = "Your session has expired. Please log in again.";
      isTemporary = true;
    }
    // Permission errors
    else if (error.message?.includes('violates row-level security')) {
      errorMessage = "You don't have permission to access this property. Please contact your administrator.";
    }
    // Unique constraint violations
    else if (error.code === '23505') {
      if (error.message?.includes('properties_name')) {
        errorMessage = "A property with this name already exists. Please choose a different name.";
      } else if (error.message?.includes('properties_vrbo_url')) {
        errorMessage = "This Vrbo URL is already registered. Please check if the property already exists.";
      } else if (error.message?.includes('properties_airbnb_url')) {
        errorMessage = "This Airbnb URL is already registered. Please check if the property already exists.";
      } else {
        errorMessage = "This property information conflicts with an existing property.";
      }
    }
    // Not found errors
    else if (error.code === 'PGRST116') {
      errorMessage = "The property could not be found. It may have been deleted by another user.";
    }
    // Foreign key violations
    else if (error.code === '23503') {
      errorMessage = "Invalid reference data. Please refresh the page and try again.";
      isTemporary = true;
    }
    // Database constraint violations
    else if (error.code === '23514') {
      errorMessage = "Invalid property data. Please check all fields and try again.";
    }
    // NULL constraint violations
    else if (error.code === '23502') {
      if (error.message?.includes('added_by')) {
        errorMessage = "Authentication error: Please try logging out and back in.";
        isTemporary = true;
      } else {
        errorMessage = "Required information is missing. Please fill in all required fields.";
      }
    }

    console.log('📋 Error analysis result:', {
      originalError: error.code,
      userMessage: errorMessage,
      isTemporary,
      shouldRetry: isTemporary
    });

    toast({
      title: `Error ${isEditing ? 'Updating' : 'Creating'} Property`,
      description: errorMessage,
      variant: "destructive",
    });

    return { errorMessage, isTemporary };
  };

  const handleUnexpectedError = () => {
    console.error('💥 Handling unexpected error');
    
    toast({
      title: "Unexpected Error",
      description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      variant: "destructive",
    });
  };

  const handleSuccess = (propertyName: string, isEditing: boolean) => {
    console.log('🎉 Handling successful submission:', {
      propertyName,
      operation: isEditing ? 'update' : 'create'
    });

    toast({
      title: `Property ${isEditing ? 'Updated' : 'Added'}`,
      description: `The property "${propertyName}" has been ${isEditing ? 'updated' : 'added'} successfully.`,
    });
  };

  return { 
    handleSubmissionError, 
    handleUnexpectedError, 
    handleSuccess 
  };
};
