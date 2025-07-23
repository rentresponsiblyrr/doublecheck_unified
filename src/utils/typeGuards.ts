// Runtime type guards for critical data flows
import { z } from "zod";
import { log } from "@/lib/logging/enterprise-logger";

// Environment validation schema
export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  // VITE_OPENAI_API_KEY: z.string().min(1).optional(), // Removed for security
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_PUBLIC_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

// User authentication validation
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["inspector", "auditor", "admin"]).optional(),
  created_at: z.string().datetime().optional(),
  last_sign_in_at: z.string().datetime().optional(),
});

export type User = z.infer<typeof userSchema>;

// Inspection data validation
export const inspectionSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
  status: z.enum(["draft", "in_progress", "completed", "reviewed"]),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  completed: z.boolean().default(false),
});

export type Inspection = z.infer<typeof inspectionSchema>;

// Checklist item validation
export const checklistItemSchema = z.object({
  id: z.string().uuid(),
  inspection_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["safety", "amenity", "cleanliness", "maintenance"]),
  status: z.enum(["pending", "completed", "skipped"]),
  ai_status: z.enum(["pending", "pass", "fail", "needs_review"]).optional(),
  ai_confidence: z.number().min(0).max(1).optional(),
  ai_reasoning: z.string().optional(),
  photos: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// API response validation
export const apiResponseSchema = z.object({
  data: z.unknown(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
      details: z.unknown().optional(),
    })
    .optional(),
  pagination: z
    .object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      hasMore: z.boolean(),
    })
    .optional(),
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;

// Runtime type guard functions
export function isValidUser(data: unknown): data is User {
  try {
    userSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidInspection(data: unknown): data is Inspection {
  try {
    inspectionSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidChecklistItem(data: unknown): data is ChecklistItem {
  try {
    checklistItemSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidApiResponse(data: unknown): data is ApiResponse {
  try {
    apiResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

// Environment validation function
export function validateEnv(): AppEnv {
  try {
    const env = import.meta.env;
    log.debug(
      "Validating environment configuration",
      {
        component: "typeGuards",
        action: "validateEnv",
        hasSupabaseUrl: !!env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!env.VITE_SUPABASE_ANON_KEY,
        nodeEnv: env.NODE_ENV || env.MODE,
        mode: env.MODE,
      },
      "ENVIRONMENT_VALIDATION",
    );

    // Use Vite's MODE if NODE_ENV is not set
    const envToValidate = {
      ...env,
      NODE_ENV: env.NODE_ENV || env.MODE || "development",
    };

    return envSchema.parse(envToValidate);
  } catch (error) {
    log.error(
      "Environment validation failed",
      error as Error,
      {
        component: "typeGuards",
        action: "validateEnv",
        availableEnvVars: Object.keys(import.meta.env),
      },
      "ENVIRONMENT_VALIDATION_FAILED",
    );
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }
}

// Safe JSON parsing with type validation
export function safeJSONParse<T>(
  json: string,
  schema: z.ZodSchema<T>,
): T | null {
  try {
    const parsed = JSON.parse(json);
    return schema.parse(parsed);
  } catch {
    return null;
  }
}

// Error boundary helper
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

// Database operation validation
export function validateDatabaseResponse<T>(
  response: { data: unknown; error: unknown },
  schema: z.ZodSchema<T>,
): { data: T | null; error: Error | null } {
  if (response.error) {
    const error = response.error as { message: string };
    return {
      data: null,
      error: new Error(error.message || "Database operation failed"),
    };
  }

  try {
    const data = schema.parse(response.data);
    return { data, error: null };
  } catch (validationError) {
    return {
      data: null,
      error: new Error(
        `Data validation failed: ${getErrorMessage(validationError)}`,
      ),
    };
  }
}

// File validation for photo uploads
export const photoFileSchema = z.object({
  name: z.string().min(1),
  size: z
    .number()
    .min(1)
    .max(50 * 1024 * 1024), // 50MB max
  type: z
    .string()
    .refine(
      (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
      "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    ),
  lastModified: z.number(),
});

export type PhotoFile = z.infer<typeof photoFileSchema>;

export function isValidPhotoFile(file: unknown): file is PhotoFile {
  try {
    photoFileSchema.parse(file);
    return true;
  } catch {
    return false;
  }
}

// Network request validation
export function validateNetworkResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }
}

// Local storage validation
export function safeLocalStorageGet<T>(
  key: string,
  schema: z.ZodSchema<T>,
): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    return schema.parse(parsed);
  } catch {
    // Clear invalid data from localStorage
    localStorage.removeItem(key);
    return null;
  }
}

export function safeLocalStorageSet<T>(
  key: string,
  value: T,
  schema: z.ZodSchema<T>,
): boolean {
  try {
    const validated = schema.parse(value);
    localStorage.setItem(key, JSON.stringify(validated));
    return true;
  } catch {
    return false;
  }
}
