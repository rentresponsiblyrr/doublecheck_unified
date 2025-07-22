
import { useToast } from "@/hooks/use-toast";
import { logger } from './logger';

export const usePropertyErrorHandler = () => {
  const { toast } = useToast();

  const handleSubmissionError = (error: Error | unknown, isEditing: boolean) => {
    const errorDetails = error as { code?: string; message?: string; details?: string; hint?: string };
    
    logger.error('Property submission error', {
      component: 'PropertyErrorHandler',
      code: errorDetails.code,
      message: errorDetails.message,
      details: errorDetails.details,
      hint: errorDetails.hint,
      isEditing,
      action: 'property_submission'
    });

    let errorMessage = "An error occurred while saving the property.";
    let isTemporary = false;
    
    // Network and timeout errors
    if (errorDetails.code === 'PGRST301' || 
        errorDetails.code === 'PGRST504' ||
        errorDetails.message?.includes('timeout') ||
        errorDetails.message?.includes('network') ||
        errorDetails.message?.includes('connection')) {
      errorMessage = "Network connection error. Please check your internet connection and try again.";
      isTemporary = true;
    }
    // Authentication errors
    else if (errorDetails.code === '42501' || errorDetails.message?.includes('JWT')) {
      errorMessage = "Your session has expired. Please log in again.";
      isTemporary = true;
    }
    // Permission errors
    else if (errorDetails.message?.includes('violates row-level security')) {
      errorMessage = "You don't have permission to access this property. Please contact your administrator.";
    }
    // Unique constraint violations
    else if (errorDetails.code === '23505') {
      if (errorDetails.message?.includes('properties_name')) {
        errorMessage = "A property with this name already exists. Please choose a different name.";
      } else if (errorDetails.message?.includes('properties_vrbo_url')) {
        errorMessage = "This Vrbo URL is already registered. Please check if the property already exists.";
      } else if (errorDetails.message?.includes('properties_airbnb_url')) {
        errorMessage = "This Airbnb URL is already registered. Please check if the property already exists.";
      } else {
        errorMessage = "This property information conflicts with an existing property.";
      }
    }
    // Not found errors
    else if (errorDetails.code === 'PGRST116') {
      errorMessage = "The property could not be found. It may have been deleted by another user.";
    }
    // Foreign key violations
    else if (errorDetails.code === '23503') {
      errorMessage = "Invalid reference data. Please refresh the page and try again.";
      isTemporary = true;
    }
    // Database constraint violations
    else if (errorDetails.code === '23514') {
      errorMessage = "Invalid property data. Please check all fields and try again.";
    }
    // NULL constraint violations
    else if (errorDetails.code === '23502') {
      if (errorDetails.message?.includes('added_by')) {
        errorMessage = "Authentication error: Please try logging out and back in.";
        isTemporary = true;
      } else {
        errorMessage = "Required information is missing. Please fill in all required fields.";
      }
    }

    logger.info('Error handling complete', {
      component: 'PropertyErrorHandler',
      originalError: errorDetails.code,
      userMessage: errorMessage,
      isTemporary,
      shouldRetry: isTemporary,
      action: 'error_toast_display'
    });

    toast({
      title: `Error ${isEditing ? 'Updating' : 'Creating'} Property`,
      description: errorMessage,
      variant: "destructive",
    });

    return { errorMessage, isTemporary };
  };

  const handleUnexpectedError = () => {
    logger.error('Unexpected error occurred', {
      component: 'PropertyErrorHandler',
      error: 'Unhandled error type',
      action: 'error_handling'
    });
    
    toast({
      title: "Unexpected Error",
      description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      variant: "destructive",
    });
  };

  const handleSuccess = (propertyName: string, isEditing: boolean) => {
    logger.info('Property operation successful', {
      component: 'PropertyErrorHandler',
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
