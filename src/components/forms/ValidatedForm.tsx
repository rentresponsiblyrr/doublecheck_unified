/**
 * VALIDATED FORM COMPONENT - PRODUCTION-READY FORM WITH VALIDATION
 * 
 * Comprehensive form component with built-in validation, error handling,
 * accessibility compliance, and Netflix/Meta production standards.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { forwardRef, ReactNode } from 'react';
import { ValidationRule, FormValidationConfig } from '@/lib/forms/FormValidationService';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ValidatedFormProps {
  formId: string;
  title?: string;
  rules: ValidationRule[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<any>;
  children: ReactNode;
  config?: FormValidationConfig;
  showValidationSummary?: boolean;
  showProgressIndicator?: boolean;
  submitButtonText?: string;
  resetButtonText?: string;
  disabled?: boolean;
  className?: string;
  onValidationChange?: (isValid: boolean, errors: Record<string, string[]>) => void;
  renderCustomActions?: (props: {
    handleSubmit: () => Promise<void>;
    resetForm: () => void;
    isSubmitting: boolean;
    isValid: boolean;
  }) => ReactNode;
}

export const ValidatedForm = forwardRef<HTMLFormElement, ValidatedFormProps>(({
  formId,
  title,
  rules,
  initialData = {},
  onSubmit,
  children,
  config = {},
  showValidationSummary = true,
  showProgressIndicator = true,
  submitButtonText = 'Submit',
  resetButtonText = 'Reset',
  disabled = false,
  className = '',
  onValidationChange,
  renderCustomActions,
}, ref) => {
  const {
    formData,
    validationResult,
    isSubmitting,
    isValid,
    handleSubmit,
    resetForm,
  } = useFormValidation({
    formId,
    rules,
    initialData,
    onSubmit,
    onValidationChange: (result) => {
      onValidationChange?.(result.isValid, result.errors);
    },
    ...config,
  });

  const errorCount = validationResult ? Object.keys(validationResult.errors).length : 0;
  const warningCount = validationResult ? Object.keys(validationResult.warnings).length : 0;
  const overallScore = validationResult?.overallScore || 100;

  return (
    <Card id={`${formId}-container`} className={`w-full ${className}`}>
      {title && (
        <CardHeader id={`${formId}-header`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {title}
            </CardTitle>
            
            {showProgressIndicator && validationResult && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isValid ? "default" : errorCount > 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {isValid ? 'Valid' : `${errorCount} Error${errorCount > 1 ? 's' : ''}`}
                </Badge>
                
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>{overallScore}%</span>
                  <Progress 
                    value={overallScore} 
                    className="w-12 h-2"
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent id={`${formId}-content`} className="space-y-6">
        {/* Validation Summary */}
        {showValidationSummary && validationResult && (errorCount > 0 || warningCount > 0) && (
          <ValidationSummary
            errors={validationResult.errors}
            warnings={validationResult.warnings}
            formId={formId}
          />
        )}

        {/* Form */}
        <form
          ref={ref}
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
          aria-label={title || 'Form'}
        >
          {/* Form Fields (provided via children) */}
          <FormProvider value={{
            formId,
            formData,
            validationResult,
            isSubmitting,
            disabled: disabled || isSubmitting,
          }}>
            {children}
          </FormProvider>

          {/* Form Actions */}
          <div id={`${formId}-actions`} className="flex items-center justify-end gap-3 pt-4 border-t">
            {renderCustomActions ? (
              renderCustomActions({
                handleSubmit,
                resetForm,
                isSubmitting,
                isValid,
              })
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={disabled || isSubmitting}
                  className="min-w-[80px]"
                >
                  {resetButtonText}
                </Button>
                
                <Button
                  type="submit"
                  disabled={disabled || isSubmitting || (!config.validateOnSubmit && !isValid)}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    submitButtonText
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

ValidatedForm.displayName = 'ValidatedForm';

// Form Context for accessing form state in child components
const FormContext = React.createContext<{
  formId: string;
  formData: Record<string, any>;
  validationResult: any;
  isSubmitting: boolean;
  disabled: boolean;
} | null>(null);

const FormProvider: React.FC<{
  value: any;
  children: ReactNode;
}> = ({ value, children }) => (
  <FormContext.Provider value={value}>
    {children}
  </FormContext.Provider>
);

// Hook for accessing form context
export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a ValidatedForm');
  }
  return context;
};

// Validation Summary Component
const ValidationSummary: React.FC<{
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  formId: string;
}> = ({ errors, warnings, formId }) => {
  const errorEntries = Object.entries(errors);
  const warningEntries = Object.entries(warnings);

  if (errorEntries.length === 0 && warningEntries.length === 0) {
    return null;
  }

  return (
    <div 
      id={`${formId}-validation-summary`}
      className="space-y-3"
      role="alert"
      aria-live="polite"
    >
      {/* Errors */}
      {errorEntries.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="text-sm font-medium text-red-800">
              {errorEntries.length} Error{errorEntries.length > 1 ? 's' : ''} Found
            </h4>
          </div>
          
          <ul className="text-sm text-red-700 space-y-1">
            {errorEntries.map(([field, fieldErrors]) =>
              fieldErrors.map((error, index) => (
                <li key={`${field}-${index}`} className="flex items-start gap-2">
                  <span className="font-medium capitalize">
                    {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <span>{error}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warningEntries.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="text-sm font-medium text-orange-800">
              {warningEntries.length} Warning{warningEntries.length > 1 ? 's' : ''}
            </h4>
          </div>
          
          <ul className="text-sm text-orange-700 space-y-1">
            {warningEntries.map(([field, fieldWarnings]) =>
              fieldWarnings.map((warning, index) => (
                <li key={`${field}-${index}`} className="flex items-start gap-2">
                  <span className="font-medium capitalize">
                    {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <span>{warning}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidatedForm;