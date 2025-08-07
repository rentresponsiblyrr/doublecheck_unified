/**
 * Data Validation Service - Production-Grade Input Validation
 * Prevents data corruption and ensures data integrity across the platform
 */

import { z } from 'zod';
import { logger } from '@/utils/logger';

// UUID validation pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// URL validation patterns
const VRBO_URL_REGEX = /^https?:\/\/(www\.)?vrbo\.com\/\d{7,10}/;
const AIRBNB_URL_REGEX = /^https?:\/\/(www\.)?airbnb\.com\/(rooms|plus)\/\d+/;

// ============================================
// PROPERTY VALIDATION SCHEMAS
// ============================================

export const PropertySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255).trim(),
  address: z.string().min(5).max(500).trim(),
  vrbo_url: z.string().regex(VRBO_URL_REGEX, 'Invalid VRBO URL').optional().nullable(),
  airbnb_url: z.string().regex(AIRBNB_URL_REGEX, 'Invalid Airbnb URL').optional().nullable(),
  added_by: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
}).refine(
  (data) => data.vrbo_url || data.airbnb_url,
  { message: 'At least one listing URL (VRBO or Airbnb) is required' }
);

export const PropertyCreateSchema = PropertySchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const PropertyUpdateSchema = PropertySchema.partial().required({ id: true });

// ============================================
// INSPECTION VALIDATION SCHEMAS
// ============================================

export const InspectionSchema = z.object({
  id: z.string().uuid().optional(),
  property_id: z.string().uuid(),
  inspector_id: z.string().uuid().nullable(),
  start_time: z.string().datetime().nullable(),
  end_time: z.string().datetime().nullable(),
  completed: z.boolean().default(false),
  certification_status: z.enum(['pending', 'approved', 'rejected', 'needs_revision']).nullable(),
  status: z.enum(['available', 'in_progress', 'completed', 'cancelled']).default('available'),
  auditor_feedback: z.string().max(5000).nullable(),
  reviewed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.end_time && data.start_time) {
      return new Date(data.end_time) > new Date(data.start_time);
    }
    return true;
  },
  { message: 'End time must be after start time' }
);

export const InspectionCreateSchema = InspectionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  reviewed_at: true
});

export const InspectionUpdateSchema = InspectionSchema.partial().required({ id: true });

// ============================================
// CHECKLIST ITEM VALIDATION SCHEMAS
// ============================================

export const ChecklistItemSchema = z.object({
  id: z.string().uuid().optional(),
  inspection_id: z.string().uuid(),
  label: z.string().min(1).max(500).trim(),
  category: z.string().max(100).nullable(),
  status: z.enum(['completed', 'failed', 'not_applicable', 'pending']).nullable(),
  notes: z.string().max(2000).nullable(),
  ai_status: z.enum(['pass', 'fail', 'conflict', 'pending']).nullable(),
  created_at: z.string().datetime().optional(),
  static_item_id: z.string().uuid().nullable(),
  evidence_type: z.string().max(100),
  source_photo_url: z.string().url().nullable(),
  notes_history: z.array(z.any()).default([]),
  assigned_inspector_id: z.string().uuid().nullable(),
  last_modified_by: z.string().uuid().nullable(),
  last_modified_at: z.string().datetime().optional(),
  version: z.number().int().min(0).default(0),
  auditor_override: z.boolean().default(false),
  auditor_notes: z.string().max(2000).nullable()
});

export const ChecklistItemUpdateSchema = z.object({
  status: z.enum(['completed', 'failed', 'not_applicable', 'pending']).optional(),
  notes: z.string().max(2000).optional(),
  ai_status: z.enum(['pass', 'fail', 'conflict', 'pending']).optional(),
  auditor_override: z.boolean().optional(),
  auditor_notes: z.string().max(2000).optional(),
  last_modified_by: z.string().uuid(),
  last_modified_at: z.string().datetime()
});

// ============================================
// MEDIA VALIDATION SCHEMAS
// ============================================

export const MediaSchema = z.object({
  id: z.string().uuid().optional(),
  checklist_item_id: z.string().uuid(),
  type: z.enum(['photo', 'video', 'document']),
  url: z.string().url(),
  file_path: z.string().max(500).nullable(),
  user_id: z.string().uuid().nullable(),
  created_at: z.string().datetime().optional(),
  metadata: z.object({
    size: z.number().positive().optional(),
    mime_type: z.string().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional()
  }).optional()
});

export const PhotoUploadSchema = z.object({
  file: z.instanceof(File),
  checklist_item_id: z.string().uuid(),
  inspection_id: z.string().uuid()
}).refine(
  (data) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(data.file.type);
  },
  { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' }
).refine(
  (data) => data.file.size <= 10 * 1024 * 1024, // 10MB limit
  { message: 'File size must be less than 10MB' }
);

// ============================================
// USER VALIDATION SCHEMAS
// ============================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['admin', 'inspector', 'reviewer']),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  last_login_at: z.string().datetime().optional().nullable()
});

// ============================================
// VALIDATION SERVICE CLASS
// ============================================

export class DataValidationService {
  private static instance: DataValidationService;

  private constructor() {}

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Validate property data
   */
  validateProperty(data: unknown, mode: 'create' | 'update' = 'create') {
    try {
      const schema = mode === 'create' ? PropertyCreateSchema : PropertyUpdateSchema;
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Property validation failed', { errors: error.errors });
        return { 
          success: false, 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Validate inspection data
   */
  validateInspection(data: unknown, mode: 'create' | 'update' = 'create') {
    try {
      const schema = mode === 'create' ? InspectionCreateSchema : InspectionUpdateSchema;
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Inspection validation failed', { errors: error.errors });
        return { 
          success: false, 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Validate checklist item update
   */
  validateChecklistItemUpdate(data: unknown) {
    try {
      const validated = ChecklistItemUpdateSchema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Checklist item validation failed', { errors: error.errors });
        return { 
          success: false, 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Validate photo upload
   */
  validatePhotoUpload(data: unknown) {
    try {
      const validated = PhotoUploadSchema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Photo upload validation failed', { errors: error.errors });
        return { 
          success: false, 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Validate UUID
   */
  isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id);
  }

  /**
   * Validate VRBO URL
   */
  isValidVRBOUrl(url: string): boolean {
    return VRBO_URL_REGEX.test(url);
  }

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize form data
   */
  validateFormData<T extends z.ZodSchema>(
    schema: T,
    data: unknown
  ): { success: boolean; data?: z.infer<T>; errors?: Array<{ field: string; message: string }> } {
    try {
      // Sanitize string fields
      const sanitized = this.sanitizeObjectStrings(data);
      const validated = schema.parse(sanitized);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Recursively sanitize all string fields in an object
   */
  private sanitizeObjectStrings(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectStrings(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObjectStrings(value);
      }
      return sanitized;
    }
    return obj;
  }

  /**
   * Validate batch operations
   */
  validateBatch<T>(
    items: unknown[],
    validator: (item: unknown) => { success: boolean; data?: T; errors?: any }
  ): { 
    valid: T[]; 
    invalid: Array<{ index: number; errors: any }> 
  } {
    const valid: T[] = [];
    const invalid: Array<{ index: number; errors: any }> = [];

    items.forEach((item, index) => {
      const result = validator(item);
      if (result.success && result.data) {
        valid.push(result.data);
      } else {
        invalid.push({ index, errors: result.errors });
      }
    });

    return { valid, invalid };
  }
}

// Export singleton instance
export const dataValidation = DataValidationService.getInstance();

// Export schemas for use in components
export type PropertyData = z.infer<typeof PropertySchema>;
export type InspectionData = z.infer<typeof InspectionSchema>;
export type ChecklistItemData = z.infer<typeof ChecklistItemSchema>;
export type MediaData = z.infer<typeof MediaSchema>;
export type UserData = z.infer<typeof UserSchema>;