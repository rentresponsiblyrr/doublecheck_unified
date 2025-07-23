/**
 * FORM VALIDATION HOOK - REACT INTEGRATION
 *
 * React hook for seamless form validation integration with real-time validation,
 * error recovery, accessibility support, and production-ready form handling.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  formValidationService,
  ValidationRule,
  ValidationResult,
  FormValidationConfig,
  FieldValidationState,
} from "@/lib/forms/FormValidationService";
import { useErrorReporting } from "@/providers/ErrorBoundaryProvider";
import { logger } from "@/utils/logger";

interface UseFormValidationOptions extends FormValidationConfig {
  formId: string;
  rules: ValidationRule[];
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => Promise<any>;
  onValidationChange?: (result: ValidationResult) => void;
  onFieldChange?: (fieldName: string, state: FieldValidationState) => void;
}

interface FormValidationHookResult {
  // Form state
  formData: Record<string, any>;
  validationResult: ValidationResult | null;
  isSubmitting: boolean;
  isValid: boolean;

  // Field methods
  setValue: (field: string, value: any) => void;
  getValue: (field: string) => any;
  setValues: (data: Record<string, any>) => void;

  // Validation methods
  validateField: (field: string) => Promise<FieldValidationState>;
  validateForm: () => Promise<ValidationResult>;
  clearValidation: (field?: string) => void;
  resetForm: () => void;

  // Form submission
  handleSubmit: (e?: React.FormEvent) => Promise<void>;

  // Field state helpers
  getFieldState: (field: string) => FieldValidationState | null;
  getFieldError: (field: string) => string | null;
  hasFieldError: (field: string) => boolean;
  isFieldTouched: (field: string) => boolean;
  isFieldDirty: (field: string) => boolean;

  // Accessibility helpers
  getFieldProps: (field: string) => {
    value: any;
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => void;
    onBlur: (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => void;
    "aria-invalid": boolean;
    "aria-describedby": string;
    "aria-required": boolean;
    id: string;
  };
  getErrorProps: (field: string) => {
    id: string;
    role: string;
    "aria-live": string;
  };
}

export const useFormValidation = (
  options: UseFormValidationOptions,
): FormValidationHookResult => {
  const {
    formId,
    rules,
    initialData = {},
    onSubmit,
    onValidationChange,
    onFieldChange,
    ...config
  } = options;

  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInitialized = useRef(false);
  const { reportFormError, reportNetworkError } = useErrorReporting();

  // Initialize form validation service
  useEffect(() => {
    if (!isInitialized.current) {
      try {
        formValidationService.registerForm(formId, rules, config);
        isInitialized.current = true;

        logger.debug("Form validation hook initialized", { formId });
      } catch (error) {
        reportFormError(error as Error, formData, "initialization");
        logger.error("Failed to initialize form validation", { formId, error });
      }
    }

    return () => {
      if (isInitialized.current) {
        formValidationService.unregisterForm(formId);
        isInitialized.current = false;
      }
    };
  }, [formId, rules, config, reportFormError, formData]);

  // Initial validation if configured
  useEffect(() => {
    if (
      isInitialized.current &&
      config.validateOnMount &&
      Object.keys(formData).length > 0
    ) {
      validateForm();
    }
  }, [isInitialized.current, config.validateOnMount]);

  // Set individual field value
  const setValue = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Trigger validation on change if configured
        if (config.validateOnChange !== false) {
          setTimeout(() => {
            formValidationService
              .validateField(formId, field, value, newData, {
                trigger: "change",
              })
              .then((fieldState) => {
                const currentResult =
                  formValidationService.getFormState(formId);
                if (currentResult) {
                  setValidationResult({ ...currentResult });
                  onFieldChange?.(field, fieldState);
                  onValidationChange?.(currentResult);
                }
              })
              .catch((error) => {
                reportFormError(error as Error, newData, field);
              });
          }, 0);
        }

        return newData;
      });
    },
    [
      formId,
      config.validateOnChange,
      onFieldChange,
      onValidationChange,
      reportFormError,
    ],
  );

  // Get individual field value
  const getValue = useCallback(
    (field: string) => {
      return formData[field];
    },
    [formData],
  );

  // Set multiple field values
  const setValues = useCallback((data: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // Validate individual field
  const validateField = useCallback(
    async (field: string): Promise<FieldValidationState> => {
      try {
        const fieldState = await formValidationService.validateField(
          formId,
          field,
          formData[field],
          formData,
          { force: true },
        );

        const currentResult = formValidationService.getFormState(formId);
        if (currentResult) {
          setValidationResult({ ...currentResult });
          onFieldChange?.(field, fieldState);
          onValidationChange?.(currentResult);
        }

        return fieldState;
      } catch (error) {
        reportFormError(error as Error, formData, field);
        throw error;
      }
    },
    [formId, formData, onFieldChange, onValidationChange, reportFormError],
  );

  // Validate entire form
  const validateForm = useCallback(async (): Promise<ValidationResult> => {
    try {
      const result = await formValidationService.validateForm(formId, formData);
      setValidationResult(result);
      onValidationChange?.(result);
      return result;
    } catch (error) {
      reportFormError(error as Error, formData, "form");
      throw error;
    }
  }, [formId, formData, onValidationChange, reportFormError]);

  // Clear validation for field or entire form
  const clearValidation = useCallback(
    (field?: string) => {
      if (field) {
        // Clear specific field validation
        const currentResult = formValidationService.getFormState(formId);
        if (currentResult) {
          const newResult = { ...currentResult };
          delete newResult.errors[field];
          delete newResult.warnings[field];

          if (newResult.fieldStates[field]) {
            newResult.fieldStates[field] = {
              ...newResult.fieldStates[field],
              isValid: true,
              errors: [],
              warnings: [],
            };
          }

          setValidationResult(newResult);
          onValidationChange?.(newResult);
        }
      } else {
        // Clear all validation
        formValidationService.resetForm(formId);
        setValidationResult(formValidationService.getFormState(formId));
      }
    },
    [formId, onValidationChange],
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialData);
    formValidationService.resetForm(formId);
    setValidationResult(formValidationService.getFormState(formId));
    setIsSubmitting(false);

    logger.debug("Form reset", { formId });
  }, [formId, initialData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (isSubmitting || !onSubmit) return;

      setIsSubmitting(true);

      try {
        const submissionResult = await formValidationService.submitForm(
          formId,
          formData,
          onSubmit,
          {
            validateBeforeSubmit: config.validateOnSubmit !== false,
            retryOnFailure: true,
            sanitizeData: true,
          },
        );

        if (submissionResult.validationResult) {
          setValidationResult(submissionResult.validationResult);
          onValidationChange?.(submissionResult.validationResult);
        }

        if (!submissionResult.success) {
          if (submissionResult.error) {
            // Determine error type and report appropriately
            const error = submissionResult.error;
            if (
              error.message.includes("network") ||
              error.message.includes("fetch")
            ) {
              reportNetworkError(error);
            } else {
              reportFormError(error, formData, "submission");
            }

            throw error;
          }
        }

        logger.info("Form submitted successfully", { formId });
      } catch (error) {
        logger.error("Form submission failed", { formId, error });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formId,
      formData,
      onSubmit,
      isSubmitting,
      config.validateOnSubmit,
      onValidationChange,
      reportFormError,
      reportNetworkError,
    ],
  );

  // Helper methods for field states
  const getFieldState = useCallback(
    (field: string): FieldValidationState | null => {
      return validationResult?.fieldStates[field] || null;
    },
    [validationResult],
  );

  const getFieldError = useCallback(
    (field: string): string | null => {
      const errors = validationResult?.errors[field];
      return errors && errors.length > 0 ? errors[0] : null;
    },
    [validationResult],
  );

  const hasFieldError = useCallback(
    (field: string): boolean => {
      return !!validationResult?.errors[field]?.length;
    },
    [validationResult],
  );

  const isFieldTouched = useCallback(
    (field: string): boolean => {
      return getFieldState(field)?.isTouched || false;
    },
    [getFieldState],
  );

  const isFieldDirty = useCallback(
    (field: string): boolean => {
      return getFieldState(field)?.isDirty || false;
    },
    [getFieldState],
  );

  // Accessibility helpers
  const getFieldProps = useCallback(
    (field: string) => ({
      value: formData[field] || "",
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        setValue(field, e.target.value);
      },
      onBlur: (
        e: React.FocusEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        if (config.validateOnBlur !== false) {
          validateField(field).catch((error) => {
            logger.warn("Validation on blur failed", { field, error });
          });
        }
      },
      "aria-invalid": hasFieldError(field),
      "aria-describedby": hasFieldError(field)
        ? `${formId}-${field}-error`
        : undefined,
      "aria-required": rules.some(
        (rule) => rule.field === field && !rule.schema.isOptional(),
      ),
      id: `${formId}-${field}`,
    }),
    [
      formId,
      formData,
      setValue,
      validateField,
      hasFieldError,
      rules,
      config.validateOnBlur,
    ],
  );

  const getErrorProps = useCallback(
    (field: string) => ({
      id: `${formId}-${field}-error`,
      role: "alert",
      "aria-live": "polite" as const,
    }),
    [formId],
  );

  return {
    // State
    formData,
    validationResult,
    isSubmitting,
    isValid: validationResult?.isValid ?? true,

    // Methods
    setValue,
    getValue,
    setValues,
    validateField,
    validateForm,
    clearValidation,
    resetForm,
    handleSubmit,

    // Helpers
    getFieldState,
    getFieldError,
    hasFieldError,
    isFieldTouched,
    isFieldDirty,

    // Accessibility
    getFieldProps,
    getErrorProps,
  };
};

export default useFormValidation;
