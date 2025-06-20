
import { useToast } from "@/hooks/use-toast";

export const usePropertyErrorHandler = () => {
  const { toast } = useToast();

  const handleSubmissionError = (error: any, isEditing: boolean) => {
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
    } else if (error.message.includes('null value in column "added_by"')) {
      errorMessage = "Authentication error: Please try logging out and back in.";
    }

    toast({
      title: `Error ${isEditing ? 'Updating' : 'Creating'} Property`,
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleUnexpectedError = () => {
    toast({
      title: "Unexpected Error",
      description: `An unexpected error occurred. Please try again or contact support if the problem persists.`,
      variant: "destructive",
    });
  };

  const handleSuccess = (propertyName: string, isEditing: boolean) => {
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
