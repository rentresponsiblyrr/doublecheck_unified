import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface RuntimeValidationWrapperProps {
  children: React.ReactNode;
  componentName: string;
  validationChecks: (() => Promise<boolean>)[];
  fallbackComponent?: React.ReactNode;
  autoRetry?: boolean;
  retryInterval?: number;
}

interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  errors: string[];
  lastValidated: Date;
  retryCount: number;
}

export const RuntimeValidationWrapper: React.FC<RuntimeValidationWrapperProps> = ({
  children,
  componentName,
  validationChecks,
  fallbackComponent,
  autoRetry = true,
  retryInterval = 10000
}) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    isValidating: false,
    errors: [],
    lastValidated: new Date(),
    retryCount: 0
  });

  const runValidation = async () => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const results = await Promise.allSettled(validationChecks.map(check => check()));
      const errors: string[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push(`Validation check ${index + 1} failed: ${result.reason}`);
        } else if (result.value === false) {
          errors.push(`Validation check ${index + 1} returned false`);
        }
      });

      const isValid = errors.length === 0;

      setValidationState(prev => ({
        isValid,
        isValidating: false,
        errors,
        lastValidated: new Date(),
        retryCount: isValid ? 0 : prev.retryCount + 1
      }));

      return isValid;
    } catch (error) {
      setValidationState(prev => ({
        isValid: false,
        isValidating: false,
        errors: [`Runtime validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        lastValidated: new Date(),
        retryCount: prev.retryCount + 1
      }));
      return false;
    }
  };

  useEffect(() => {
    // Initial validation
    runValidation();

    // Set up auto-retry if enabled
    if (autoRetry) {
      const interval = setInterval(() => {
        if (!validationState.isValid && validationState.retryCount < 5) {
          runValidation();
        }
      }, retryInterval);

      return () => clearInterval(interval);
    }
  }, [autoRetry, retryInterval, validationState.isValid, validationState.retryCount]);

  // If validation is passing, render the component
  if (validationState.isValid && !validationState.isValidating) {
    return <>{children}</>;
  }

  // If validation is in progress, show loading state
  if (validationState.isValidating) {
    return (
      <div className="flex items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Validating {componentName}
          </h3>
          <p className="text-blue-600 text-sm">
            Running runtime validation checks...
          </p>
        </div>
      </div>
    );
  }

  // If validation failed, show fallback or error state
  if (fallbackComponent) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">
                {componentName} Validation Failed
              </h3>
              <p className="text-yellow-700 text-sm mt-1">
                Using fallback component due to validation errors.
              </p>
              {validationState.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-yellow-700">
                    Validation Errors ({validationState.errors.length})
                  </summary>
                  <ul className="mt-1 text-xs text-yellow-600 list-disc list-inside">
                    {validationState.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
        {fallbackComponent}
      </div>
    );
  }

  // Default error state
  return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {componentName} Validation Failed
        </h3>
        <p className="text-red-600 mb-4">
          This component failed runtime validation and cannot be displayed safely.
        </p>
        
        <div className="space-y-2 text-sm text-red-700 mb-4">
          <div><strong>Last Validated:</strong> {validationState.lastValidated.toLocaleString()}</div>
          <div><strong>Retry Count:</strong> {validationState.retryCount}</div>
          <div><strong>Auto Retry:</strong> {autoRetry ? 'Enabled' : 'Disabled'}</div>
        </div>

        {validationState.errors.length > 0 && (
          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4 text-left">
            <h4 className="font-semibold text-red-800 mb-2">Validation Errors:</h4>
            <ul className="list-disc list-inside text-xs text-red-700">
              {validationState.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={runValidation}
            disabled={validationState.isValidating}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${validationState.isValidating ? 'animate-spin' : ''}`} />
            {validationState.isValidating ? 'Validating...' : 'Retry Validation'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};