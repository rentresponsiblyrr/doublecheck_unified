/**
 * @fileoverview Supabase Error Type Definitions
 * Professional TypeScript interfaces for Supabase error handling
 *
 * Eliminates amateur 'any' error casting patterns with proper typing
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

/**
 * Standard Supabase error interface
 */
export interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

/**
 * PostgreSQL specific error details
 */
export interface PostgreSQLError extends SupabaseError {
  code: string;
  details: string;
  hint?: string;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

/**
 * Authentication error details
 */
export interface AuthError extends SupabaseError {
  status?: number;
  error_description?: string;
  error_code?: string;
}

/**
 * RLS (Row Level Security) error details
 */
export interface RLSError extends SupabaseError {
  code: "42501" | "PGRST116";
  details: string;
  hint: string;
}

/**
 * Network/Connection error details
 */
export interface NetworkError extends SupabaseError {
  code: "NETWORK_ERROR" | "TIMEOUT" | "ABORT";
  details: string;
  status?: number;
}

/**
 * Type guard to check if error is a SupabaseError
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return error instanceof Error && (error as SupabaseError).code !== undefined;
}

/**
 * Type guard to check if error is a PostgreSQL error
 */
export function isPostgreSQLError(error: unknown): error is PostgreSQLError {
  return (
    isSupabaseError(error) &&
    typeof (error as PostgreSQLError).code === "string" &&
    typeof (error as PostgreSQLError).details === "string"
  );
}

/**
 * Type guard to check if error is an RLS error
 */
export function isRLSError(error: unknown): error is RLSError {
  return (
    isSupabaseError(error) &&
    ((error as RLSError).code === "42501" ||
      (error as RLSError).code === "PGRST116")
  );
}

/**
 * Type guard to check if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  const networkCodes = [
    "NETWORK_ERROR",
    "TIMEOUT",
    "ABORT",
    "ERR_INTERNET_DISCONNECTED",
    "ERR_NETWORK",
  ];
  return (
    error instanceof Error &&
    networkCodes.some((code) => error.message.includes(code))
  );
}

/**
 * Utility to safely extract error information
 */
export function extractErrorInfo(error: unknown): {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
} {
  if (isSupabaseError(error)) {
    return {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
}

/**
 * Professional error formatting for logs
 */
export function formatSupabaseError(error: unknown): string {
  const info = extractErrorInfo(error);

  let formatted = info.message;

  if (info.code) {
    formatted += ` (Code: ${info.code})`;
  }

  if (info.details) {
    formatted += ` - Details: ${info.details}`;
  }

  if (info.hint) {
    formatted += ` - Hint: ${info.hint}`;
  }

  return formatted;
}
