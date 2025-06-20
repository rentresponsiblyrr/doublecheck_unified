
import { useState } from "react";

interface FormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
}

export const usePropertyForm = (initialData: FormData = {
  name: "",
  address: "",
  vrbo_url: "",
  airbnb_url: ""
}) => {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Property name is required";
    } else if (formData.name.length < 3) {
      errors.name = "Property name must be at least 3 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Property name must be less than 100 characters";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.length < 10) {
      errors.address = "Please provide a complete address";
    } else if (formData.address.length > 200) {
      errors.address = "Address must be less than 200 characters";
    }

    if (formData.vrbo_url && !isValidUrl(formData.vrbo_url)) {
      errors.vrbo_url = "Please enter a valid Vrbo URL";
    }

    if (formData.airbnb_url && !isValidUrl(formData.airbnb_url)) {
      errors.airbnb_url = "Please enter a valid Airbnb URL";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setFormErrors({});
  };

  return {
    formData,
    formErrors,
    validateForm,
    handleInputChange,
    resetForm,
    setFormData
  };
};
