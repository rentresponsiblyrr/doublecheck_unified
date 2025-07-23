/**
 * Enterprise-Grade Input Validation System
 * Implements Stripe/GitHub/Auth0 level security standards
 *
 * SECURITY FEATURES:
 * - Zod schema validation with strict type checking
 * - DOMPurify sanitization for XSS prevention
 * - URL domain allowlisting for SSRF protection
 * - File type and magic byte validation
 * - Rate limiting integration points
 */

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { logger } from "@/utils/logger";

// Security configuration constants
const SECURITY_CONFIG = {
  ALLOWED_DOMAINS: ["airbnb.com", "vrbo.com", "booking.com", "homeaway.com"],
  MAX_URL_LENGTH: 2048,
  MAX_ADDRESS_LENGTH: 500,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm"],
} as const;

// File signature validation (magic bytes)
const FILE_SIGNATURES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "video/mp4": [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
  "video/webm": [0x1a, 0x45, 0xdf, 0xa3],
} as const;

/**
 * Security error class for validation failures
 */
export class SecurityValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly violation: string,
    public readonly severity: "low" | "medium" | "high" | "critical" = "high",
  ) {
    super(message);
    this.name = "SecurityValidationError";
  }
}

/**
 * ELITE: Property URL validation with domain allowlisting and SSRF protection
 */
export const PropertyUrlSchema = z
  .string()
  .min(1, "Property URL is required")
  .max(
    SECURITY_CONFIG.MAX_URL_LENGTH,
    `URL must be less than ${SECURITY_CONFIG.MAX_URL_LENGTH} characters`,
  )
  .url("Invalid URL format")
  .refine((url) => {
    try {
      const urlObj = new URL(url);

      // Protocol validation - only HTTPS allowed for security
      if (urlObj.protocol !== "https:") {
        throw new SecurityValidationError(
          "Only HTTPS URLs are allowed for security",
          "url",
          "INSECURE_PROTOCOL",
          "critical",
        );
      }

      // Domain allowlisting for SSRF protection
      const hostname = urlObj.hostname.toLowerCase();
      const isAllowedDomain = SECURITY_CONFIG.ALLOWED_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );

      if (!isAllowedDomain) {
        throw new SecurityValidationError(
          `Domain ${hostname} is not in allowlist. Allowed domains: ${SECURITY_CONFIG.ALLOWED_DOMAINS.join(", ")}`,
          "url",
          "DOMAIN_NOT_ALLOWED",
          "critical",
        );
      }

      // Path traversal protection
      if (urlObj.pathname.includes("../") || urlObj.pathname.includes("..\\")) {
        throw new SecurityValidationError(
          "Path traversal attempt detected in URL",
          "url",
          "PATH_TRAVERSAL",
          "critical",
        );
      }

      return true;
    } catch (error) {
      if (error instanceof SecurityValidationError) {
        throw error;
      }
      return false;
    }
  }, "Invalid or potentially malicious URL")
  .transform((url) => {
    // Sanitize URL to prevent XSS
    const sanitized = DOMPurify.sanitize(url);

    // Log security validation success
    logger.info(
      "Property URL validated successfully",
      {
        url: sanitized,
        component: "SecurityValidation",
        action: "validatePropertyUrl",
      },
      "SECURITY_VALIDATION_SUCCESS",
    );

    return sanitized;
  });

/**
 * ELITE: Address validation with XSS protection
 */
export const PropertyAddressSchema = z
  .string()
  .min(1, "Address is required")
  .max(
    SECURITY_CONFIG.MAX_ADDRESS_LENGTH,
    `Address must be less than ${SECURITY_CONFIG.MAX_ADDRESS_LENGTH} characters`,
  )
  .refine((address) => {
    // Check for HTML/script injection attempts
    const hasHtmlTags = /<[^>]*>/g.test(address);
    if (hasHtmlTags) {
      throw new SecurityValidationError(
        "HTML tags not allowed in address",
        "address",
        "HTML_INJECTION",
        "critical",
      );
    }

    // Check for JavaScript injection attempts
    const hasJavaScript = /javascript:|data:|vbscript:/i.test(address);
    if (hasJavaScript) {
      throw new SecurityValidationError(
        "JavaScript/data URI not allowed in address",
        "address",
        "SCRIPT_INJECTION",
        "critical",
      );
    }

    return true;
  }, "Address contains potentially malicious content")
  .transform((address) => {
    // Sanitize address to prevent XSS
    const sanitized = DOMPurify.sanitize(address, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    return sanitized.trim();
  });

/**
 * ELITE: File validation with magic byte verification
 */
export const FileUploadSchema = z
  .custom<File>()
  .refine((file) => {
    if (!file || !(file instanceof File)) {
      throw new SecurityValidationError(
        "Invalid file object",
        "file",
        "INVALID_FILE_OBJECT",
        "high",
      );
    }
    return true;
  }, "Invalid file")
  .refine(
    (file) => {
      if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
        throw new SecurityValidationError(
          `File size ${file.size} exceeds maximum allowed size of ${SECURITY_CONFIG.MAX_FILE_SIZE} bytes`,
          "file",
          "FILE_SIZE_EXCEEDED",
          "medium",
        );
      }
      return true;
    },
    `File too large (max ${SECURITY_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`,
  )
  .refine((file) => {
    const allowedTypes = [
      ...SECURITY_CONFIG.ALLOWED_IMAGE_TYPES,
      ...SECURITY_CONFIG.ALLOWED_VIDEO_TYPES,
    ];

    if (!allowedTypes.includes(file.type as any)) {
      throw new SecurityValidationError(
        `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        "file",
        "INVALID_FILE_TYPE",
        "high",
      );
    }
    return true;
  }, "Invalid file type");

/**
 * ELITE: Magic byte validation for file integrity
 */
export async function validateFileSignature(file: File): Promise<boolean> {
  try {
    const expectedSignature =
      FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
    if (!expectedSignature) {
      throw new SecurityValidationError(
        `No signature validation available for file type: ${file.type}`,
        "file",
        "UNSUPPORTED_FILE_TYPE",
        "high",
      );
    }

    // Read first bytes of file for signature validation
    const headerSize = Math.max(
      ...Object.values(FILE_SIGNATURES).map((sig) => sig.length),
    );
    const headerBuffer = await file.slice(0, headerSize).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);

    // Validate magic bytes
    const signatureMatches = expectedSignature.every(
      (byte, index) => headerBytes[index] === byte,
    );

    if (!signatureMatches) {
      throw new SecurityValidationError(
        `File signature does not match declared type ${file.type}`,
        "file",
        "SIGNATURE_MISMATCH",
        "critical",
      );
    }

    logger.info(
      "File signature validated successfully",
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        component: "SecurityValidation",
        action: "validateFileSignature",
      },
      "FILE_SIGNATURE_VALIDATION_SUCCESS",
    );

    return true;
  } catch (error) {
    logger.error(
      "File signature validation failed",
      error as Error,
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        component: "SecurityValidation",
        action: "validateFileSignature",
      },
      "FILE_SIGNATURE_VALIDATION_FAILED",
    );

    if (error instanceof SecurityValidationError) {
      throw error;
    }

    throw new SecurityValidationError(
      "File signature validation failed",
      "file",
      "SIGNATURE_VALIDATION_ERROR",
      "critical",
    );
  }
}

/**
 * ELITE: Search query validation with injection protection
 */
export const SearchQuerySchema = z
  .string()
  .max(200, "Search query too long")
  .refine((query) => {
    // SQL injection protection
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(;|--|\|\||&&)/,
      /('|('')|"|(\\")|(%27)|(%22))/,
    ];

    const hasSqlInjection = sqlInjectionPatterns.some((pattern) =>
      pattern.test(query),
    );
    if (hasSqlInjection) {
      throw new SecurityValidationError(
        "Potential SQL injection detected in search query",
        "searchQuery",
        "SQL_INJECTION",
        "critical",
      );
    }

    return true;
  }, "Search query contains potentially malicious content")
  .transform((query) => {
    // Sanitize search query
    const sanitized = DOMPurify.sanitize(query, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    return sanitized.trim();
  });

/**
 * ELITE: Inspection ID validation
 */
export const InspectionIdSchema = z
  .string()
  .uuid("Invalid inspection ID format")
  .refine((id) => {
    // Additional validation for UUID v4 format
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(id)) {
      throw new SecurityValidationError(
        "Inspection ID must be a valid UUID v4",
        "inspectionId",
        "INVALID_UUID_FORMAT",
        "medium",
      );
    }
    return true;
  }, "Invalid UUID format");

/**
 * ELITE: User input sanitization utility
 */
export function sanitizeUserInput(
  input: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
    maxLength?: number;
  },
): string {
  const opts = {
    allowedTags: options?.allowedTags || [],
    allowedAttributes: options?.allowedAttributes || [],
    maxLength: options?.maxLength || 1000,
    ...options,
  };

  // Length validation
  if (input.length > opts.maxLength) {
    throw new SecurityValidationError(
      `Input exceeds maximum length of ${opts.maxLength} characters`,
      "userInput",
      "INPUT_TOO_LONG",
      "medium",
    );
  }

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: opts.allowedTags,
    ALLOWED_ATTR: opts.allowedAttributes,
    KEEP_CONTENT: true,
  });

  return sanitized.trim();
}

/**
 * ELITE: Rate limit key generator for security operations
 */
export function generateRateLimitKey(
  operation: string,
  identifier: string,
  timeWindow: "minute" | "hour" | "day" = "minute",
): string {
  const timestamp = Math.floor(
    Date.now() /
      (timeWindow === "minute"
        ? 60000
        : timeWindow === "hour"
          ? 3600000
          : 86400000), // day
  );

  return `ratelimit:${operation}:${identifier}:${timestamp}`;
}

// Export validation schemas for use throughout the application
export const ValidationSchemas = {
  PropertyUrl: PropertyUrlSchema,
  PropertyAddress: PropertyAddressSchema,
  FileUpload: FileUploadSchema,
  SearchQuery: SearchQuerySchema,
  InspectionId: InspectionIdSchema,
} as const;

/**
 * ELITE: InputValidator class for backwards compatibility
 */
export class InputValidator {
  /**
   * Validate property URL using the PropertyUrlSchema
   */
  static validatePropertyUrl(url: string): string {
    return PropertyUrlSchema.parse(url);
  }

  /**
   * Validate search query using the SearchQuerySchema
   */
  static validateSearchQuery(query: string): string {
    return SearchQuerySchema.parse(query);
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(input: string): string {
    return sanitizeUserInput(input, { allowedTags: [], allowedAttributes: [] });
  }

  /**
   * Validate address using the PropertyAddressSchema
   */
  static validateAddress(address: string): string {
    return PropertyAddressSchema.parse(address);
  }

  /**
   * Validate file upload using the FileUploadSchema
   */
  static validateFile(file: File): File {
    return FileUploadSchema.parse(file);
  }

  /**
   * Validate inspection ID using the InspectionIdSchema
   */
  static validateInspectionId(id: string): string {
    return InspectionIdSchema.parse(id);
  }
}

// Export security utilities
export const SecurityUtils = {
  sanitizeUserInput,
  validateFileSignature,
  generateRateLimitKey,
} as const;
