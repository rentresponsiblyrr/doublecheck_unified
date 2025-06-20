
export interface SubmissionDebugInfo {
  submitError?: {
    operation: 'update' | 'insert';
    error: string;
    code?: string;
    details?: string;
    hint?: string;
    attempts?: number;
    duration: number;
    timestamp: string;
  };
  unexpectedSubmitError?: {
    error: string;
    stack?: string;
    attempts?: number;
    duration: number;
    timestamp: string;
  };
  submitSuccess?: {
    operation: 'update' | 'insert';
    propertyId?: string;
    attempts?: number;
    duration: number;
    timestamp: string;
  };
}

export interface PropertyFormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
}
