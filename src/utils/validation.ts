/**
 * Input Validation and Sanitization Utilities for STR Certified
 * Provides comprehensive validation rules and sanitization functions
 */

import { z } from 'zod';
import { sanitizeText, sanitizeSearchQuery, sanitizeURL } from './sanitization';

/**
 * Common validation schemas
 */

// Basic string validation
export const stringSchema = z.string().min(1, 'This field is required');
export const optionalStringSchema = z.string().optional();

// Email validation
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long');

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// URL validation
export const urlSchema = z.string()
  .refine((url) => {
    try {
      const validUrl = sanitizeURL(url);
      return validUrl.length > 0;
    } catch {
      return false;
    }
  }, 'Please enter a valid URL');

// Property ID validation
export const propertyIdSchema = z.string()
  .min(1, 'Property ID is required')
  .max(50, 'Property ID is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Property ID can only contain letters, numbers, hyphens, and underscores');

// Inspection status validation
export const inspectionStatusSchema = z.enum([
  'draft',
  'in_progress',
  'completed',
  'auditing',
  'approved',
  'rejected'
], {
  errorMap: () => ({ message: 'Invalid inspection status' })
});

// User role validation
export const userRoleSchema = z.enum([
  'inspector',
  'auditor',
  'admin',
  'super_admin'
], {
  errorMap: () => ({ message: 'Invalid user role' })
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional()
}).refine((data) => {
  if (data.maxSize && data.file.size > data.maxSize) {
    return false;
  }
  if (data.allowedTypes && !data.allowedTypes.includes(data.file.type)) {
    return false;
  }
  return true;
}, 'Invalid file upload');

/**
 * Form validation schemas
 */

// User registration
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: stringSchema,
  firstName: stringSchema.max(50, 'First name is too long'),
  lastName: stringSchema.max(50, 'Last name is too long'),
  role: userRoleSchema.optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User login
export const userLoginSchema = z.object({
  email: emailSchema,
  password: stringSchema.min(1, 'Password is required')
});

// Property creation/update
export const propertySchema = z.object({
  name: stringSchema.max(200, 'Property name is too long'),
  address: stringSchema.max(500, 'Address is too long'),
  propertyType: z.enum([
    'house',
    'apartment',
    'condo',
    'cabin',
    'villa',
    'other'
  ]),
  vrboUrl: urlSchema.optional(),
  airbnbUrl: urlSchema.optional(),
  description: optionalStringSchema,
  amenities: z.array(stringSchema).max(50, 'Too many amenities'),
  maxGuests: z.number().min(1, 'Must accommodate at least 1 guest').max(50, 'Maximum 50 guests'),
  bedrooms: z.number().min(0, 'Cannot have negative bedrooms').max(20, 'Maximum 20 bedrooms'),
  bathrooms: z.number().min(0, 'Cannot have negative bathrooms').max(20, 'Maximum 20 bathrooms')
});

// Inspection creation
export const inspectionCreationSchema = z.object({
  propertyId: propertyIdSchema,
  inspectorId: stringSchema,
  scheduledDate: z.string().datetime('Invalid date format'),
  notes: optionalStringSchema.max(1000, 'Notes are too long'),
  priorityAreas: z.array(stringSchema).max(20, 'Too many priority areas').optional()
});

// Checklist item
export const checklistItemSchema = z.object({
  id: stringSchema,
  title: stringSchema.max(200, 'Title is too long'),
  description: optionalStringSchema.max(1000, 'Description is too long'),
  category: stringSchema.max(100, 'Category is too long'),
  required: z.boolean(),
  gptPrompt: optionalStringSchema.max(2000, 'GPT prompt is too long'),
  weight: z.number().min(0).max(10).optional()
});

// AI feedback
export const aiFeedbackSchema = z.object({
  checklistItemId: stringSchema,
  aiPrediction: stringSchema.max(50, 'AI prediction is too long'),
  auditorCorrection: stringSchema.max(50, 'Auditor correction is too long'),
  feedbackCategory: z.enum(['accuracy', 'relevance', 'completeness']),
  confidenceScore: z.number().min(0).max(1),
  comments: optionalStringSchema.max(1000, 'Comments are too long')
});

// Search query
export const searchQuerySchema = z.object({
  query: stringSchema
    .max(500, 'Search query is too long')
    .transform((val) => sanitizeSearchQuery(val)),
  category: optionalStringSchema,
  filters: z.record(z.any()).optional()
});

/**
 * Validation helper functions
 */

export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError['issues'] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    throw error;
  }
};

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.issues.map(issue => issue.message)
  };
};

export const validateURL = (url: string): boolean => {
  return urlSchema.safeParse(url).success;
};

export const validateFileUpload = (
  file: File,
  maxSize?: number,
  allowedTypes?: string[]
): { valid: boolean; error?: string } => {
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check for potentially dangerous file extensions
  const filename = file.name.toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar'];
  const hasDangerousExtension = dangerousExtensions.some(ext => filename.endsWith(ext));
  
  if (hasDangerousExtension) {
    return {
      valid: false,
      error: 'File type not allowed for security reasons'
    };
  }

  return { valid: true };
};

/**
 * Input sanitization functions
 */

export const sanitizeFormInput = (input: string): string => {
  return sanitizeText(input).trim();
};

export const sanitizeNumericInput = (input: string): number | null => {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

export const sanitizeIntegerInput = (input: string): number | null => {
  const cleaned = input.replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
};

export const sanitizePhoneNumber = (input: string): string => {
  return input.replace(/[^0-9+()-\s]/g, '').trim();
};

export const sanitizeAddress = (input: string): string => {
  return sanitizeText(input)
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Validation error formatting
 */

export const formatValidationErrors = (errors: z.ZodError['issues']): Record<string, string> => {
  const formatted: Record<string, string> = {};
  
  for (const error of errors) {
    const path = error.path.join('.');
    formatted[path] = error.message;
  }
  
  return formatted;
};

export const getFirstValidationError = (errors: z.ZodError['issues']): string => {
  return errors[0]?.message || 'Validation error';
};

/**
 * Real-time validation hooks for React components
 */

export const useFormValidation = <T>(schema: z.ZodSchema<T>) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  const validate = React.useCallback((data: unknown) => {
    const result = validateAndSanitize(schema, data);
    
    if (result.success) {
      setErrors({});
      return { valid: true, data: result.data };
    } else {
      const formattedErrors = formatValidationErrors(result.errors);
      setErrors(formattedErrors);
      return { valid: false, errors: formattedErrors };
    }
  }, [schema]);
  
  const validateField = React.useCallback((fieldName: string, value: any) => {
    try {
      const fieldSchema = (schema as any).shape[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.issues[0]?.message || 'Invalid value'
        }));
      }
      return false;
    }
    return true;
  }, [schema]);
  
  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);
  
  return {
    errors,
    validate,
    validateField,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
};

// React import for the hook
const React = require('react');