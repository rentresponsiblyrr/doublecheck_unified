import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { propertyService, type PropertyData } from "@/services/propertyService";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
}

interface FormErrors {
  [key: string]: string;
}

interface UseStreamlinedPropertyFormReturn {
  formData: FormData;
  formErrors: FormErrors;
  isLoading: boolean;
  isSuccess: boolean;
  setFormData: (data: FormData) => void;
  updateField: (field: keyof FormData, value: string) => void;
  validateForm: () => boolean;
  submitProperty: () => Promise<void>;
  clearErrors: () => void;
  resetForm: () => void;
}

const initialFormData: FormData = {
  name: "",
  address: "",
  vrbo_url: "",
  airbnb_url: "",
};

export const useStreamlinedPropertyForm =
  (): UseStreamlinedPropertyFormReturn => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    const updateField = (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

    const validateForm = (): boolean => {
      const errors: FormErrors = {};

      // Validate required fields
      if (!formData.name.trim()) {
        errors.name = "Property name is required";
      }

      if (!formData.address.trim()) {
        errors.address = "Property address is required";
      }

      // Validate that at least one URL is provided
      const hasVrbo = formData.vrbo_url.trim();
      const hasAirbnb = formData.airbnb_url.trim();

      if (!hasVrbo && !hasAirbnb) {
        errors.urls = "At least one property URL (VRBO or Airbnb) is required";
      }

      // Validate VRBO URL format if provided
      if (hasVrbo) {
        const vrboPatterns = [
          /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
          /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
          /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/,
        ];
        const isValidVRBO = vrboPatterns.some((pattern) =>
          pattern.test(formData.vrbo_url),
        );

        if (!isValidVRBO) {
          errors.vrbo_url =
            "Please enter a valid VRBO URL (e.g., https://www.vrbo.com/123456)";
        }
      }

      // Validate Airbnb URL format if provided
      if (hasAirbnb) {
        const airbnbPatterns = [
          /^https?:\/\/(www\.)?airbnb\.com\/rooms\/\d+/,
          /^https?:\/\/(www\.)?airbnb\.com\/listings\/\d+/,
        ];
        const isValidAirbnb = airbnbPatterns.some((pattern) =>
          pattern.test(formData.airbnb_url),
        );

        if (!isValidAirbnb) {
          errors.airbnb_url =
            "Please enter a valid Airbnb URL (e.g., https://www.airbnb.com/rooms/123456)";
        }
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const submitProperty = async () => {
      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setIsSuccess(false);

      try {
        const propertyData: PropertyData = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          vrbo_url: formData.vrbo_url.trim() || undefined,
          airbnb_url: formData.airbnb_url.trim() || undefined,
        };

        const result = await propertyService.addProperty(propertyData);

        if (result.success) {
          setIsSuccess(true);

          // Show success message
          toast({
            title: "Property Added Successfully!",
            description: result.data?.enhanced
              ? "Property saved with enhanced data from listing"
              : "Property saved successfully",
          });

          // Reset form
          resetForm();

          // Navigate back or to property list
          setTimeout(() => {
            navigate("/properties");
          }, 1500);
        } else {
          throw new Error(result.error || "Failed to add property");
        }
      } catch (error) {
        toast({
          title: "Error Adding Property",
          description:
            error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });

        setFormErrors({
          submit: error instanceof Error ? error.message : "Submission failed",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const clearErrors = () => {
      setFormErrors({});
    };

    const resetForm = () => {
      setFormData(initialFormData);
      setFormErrors({});
      setIsSuccess(false);
    };

    return {
      formData,
      formErrors,
      isLoading,
      isSuccess,
      setFormData,
      updateField,
      validateForm,
      submitProperty,
      clearErrors,
      resetForm,
    };
  };
