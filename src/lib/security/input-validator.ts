/**
 * Enterprise Input Validation System
 * Prevents XSS, SQL injection, and other input-based attacks
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Security configuration
const SECURITY_CONFIG = {
  maxStringLength: 10000,
  maxArrayLength: 1000,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  dangerousPatterns: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<form[^>]*>.*?<\/form>/gi,
  ],
  sqlPatterns: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /('|(\\')|(;)|(\|)|(\*)|(%27)|(%3B)|(%3D)/gi,
  ],
};

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  private static instance: InputValidator;

  private constructor() {}

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string', 'html', 'INVALID_TYPE');
    }

    // Check for dangerous patterns first
    for (const pattern of SECURITY_CONFIG.dangerousPatterns) {
      if (pattern.test(input)) {
        throw new ValidationError('Input contains dangerous content', 'html', 'DANGEROUS_CONTENT');
      }
    }

    // Use DOMPurify to sanitize
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM_FRAGMENT: false,
    });

    // Additional validation after sanitization
    if (sanitized.length > SECURITY_CONFIG.maxStringLength) {
      throw new ValidationError('Content too long after sanitization', 'html', 'TOO_LONG');
    }

    return sanitized;
  }

  /**
   * Validate and sanitize plain text input
   */
  sanitizeText(input: string, maxLength?: number): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string', 'text', 'INVALID_TYPE');
    }

    // Remove null bytes and control characters
    const sanitized = input
      .replace(/\0/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();

    // Check for SQL injection patterns
    for (const pattern of SECURITY_CONFIG.sqlPatterns) {
      if (pattern.test(sanitized)) {
        throw new ValidationError('Input contains potentially dangerous SQL patterns', 'text', 'SQL_INJECTION');
      }
    }

    // Check length
    const limit = maxLength || SECURITY_CONFIG.maxStringLength;
    if (sanitized.length > limit) {
      throw new ValidationError(`Text too long (max ${limit} characters)`, 'text', 'TOO_LONG');
    }

    return sanitized;
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): string {
    if (typeof email !== 'string') {
      throw new ValidationError('Email must be a string', 'email', 'INVALID_TYPE');
    }

    const sanitized = this.sanitizeText(email.toLowerCase().trim(), 254);

    const emailSchema = z.string().email().max(254);
    const result = emailSchema.safeParse(sanitized);

    if (!result.success) {
      throw new ValidationError('Invalid email format', 'email', 'INVALID_FORMAT');
    }

    // Additional security checks
    if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
      throw new ValidationError('Invalid email format', 'email', 'INVALID_FORMAT');
    }

    return result.data;
  }

  /**
   * Validate URL
   */
  validateUrl(url: string): string {
    if (typeof url !== 'string') {
      throw new ValidationError('URL must be a string', 'url', 'INVALID_TYPE');
    }

    const sanitized = this.sanitizeText(url.trim(), 2048);

    const urlSchema = z.string().url().max(2048);
    const result = urlSchema.safeParse(sanitized);

    if (!result.success) {
      throw new ValidationError('Invalid URL format', 'url', 'INVALID_FORMAT');
    }

    // Check for allowed protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    const urlObj = new URL(result.data);
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new ValidationError('URL protocol not allowed', 'url', 'INVALID_PROTOCOL');
    }

    return result.data;
  }

  /**
   * Validate UUID
   */
  validateUuid(id: string): string {
    if (typeof id !== 'string') {
      throw new ValidationError('UUID must be a string', 'uuid', 'INVALID_TYPE');
    }

    const sanitized = this.sanitizeText(id.trim(), 36);

    const uuidSchema = z.string().uuid();
    const result = uuidSchema.safeParse(sanitized);

    if (!result.success) {
      throw new ValidationError('Invalid UUID format', 'uuid', 'INVALID_FORMAT');
    }

    return result.data;
  }

  /**
   * Validate file upload
   */
  validateFile(file: File, allowedTypes?: string[], maxSize?: number): File {
    if (!(file instanceof File)) {
      throw new ValidationError('Invalid file object', 'file', 'INVALID_TYPE');
    }

    // Check file size
    const sizeLimit = maxSize || SECURITY_CONFIG.maxFileSize;
    if (file.size > sizeLimit) {
      throw new ValidationError(
        `File too large (max ${Math.round(sizeLimit / 1024 / 1024)}MB)`,
        'file',
        'TOO_LARGE'
      );
    }

    // Check file type
    const allowedMimeTypes = allowedTypes || [
      ...SECURITY_CONFIG.allowedImageTypes,
      ...SECURITY_CONFIG.allowedVideoTypes,
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      throw new ValidationError(
        'File type not allowed',
        'file',
        'INVALID_TYPE',
        { allowedTypes: allowedMimeTypes }
      );
    }

    // Validate file name
    const sanitizedName = this.sanitizeText(file.name, 255);
    if (sanitizedName !== file.name) {
      throw new ValidationError('Invalid file name', 'file', 'INVALID_NAME');
    }

    // Check for double extensions and dangerous extensions
    const dangerousExtensions = ['.exe', '.bat', '.com', '.scr', '.pif', '.js', '.jar', '.php'];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.includes(ext))) {
      throw new ValidationError('Dangerous file extension detected', 'file', 'DANGEROUS_EXTENSION');
    }

    return file;
  }

  /**
   * Validate image file and check for embedded scripts
   */
  async validateImage(file: File): Promise<File> {
    // First validate as regular file
    const validatedFile = this.validateFile(file, SECURITY_CONFIG.allowedImageTypes);

    // Read file header to verify it's actually an image
    const header = await this.readFileHeader(validatedFile, 20);
    
    if (!this.isValidImageHeader(header, validatedFile.type)) {
      throw new ValidationError('File is not a valid image', 'image', 'INVALID_IMAGE');
    }

    // Check for embedded scripts (basic check)
    const sample = await this.readFileSample(validatedFile, 1024);
    if (this.containsScript(sample)) {
      throw new ValidationError('Image contains embedded script', 'image', 'EMBEDDED_SCRIPT');
    }

    return validatedFile;
  }

  /**
   * Validate array input
   */
  validateArray<T>(
    array: unknown[],
    itemValidator: (item: unknown) => T,
    maxLength?: number
  ): T[] {
    if (!Array.isArray(array)) {
      throw new ValidationError('Input must be an array', 'array', 'INVALID_TYPE');
    }

    const limit = maxLength || SECURITY_CONFIG.maxArrayLength;
    if (array.length > limit) {
      throw new ValidationError(`Array too long (max ${limit} items)`, 'array', 'TOO_LONG');
    }

    const validated: T[] = [];
    for (let i = 0; i < array.length; i++) {
      try {
        validated.push(itemValidator(array[i]));
      } catch (error) {
        throw new ValidationError(
          `Invalid item at index ${i}: ${error.message}`,
          'array',
          'INVALID_ITEM',
          { index: i, originalError: error }
        );
      }
    }

    return validated;
  }

  /**
   * Validate JSON input
   */
  validateJson(input: string): unknown {
    if (typeof input !== 'string') {
      throw new ValidationError('JSON input must be a string', 'json', 'INVALID_TYPE');
    }

    // Check for dangerous patterns in JSON
    for (const pattern of SECURITY_CONFIG.dangerousPatterns) {
      if (pattern.test(input)) {
        throw new ValidationError('JSON contains dangerous content', 'json', 'DANGEROUS_CONTENT');
      }
    }

    try {
      const parsed = JSON.parse(input);
      
      // Prevent prototype pollution
      if (this.hasPrototypePollution(parsed)) {
        throw new ValidationError('JSON contains prototype pollution attempt', 'json', 'PROTOTYPE_POLLUTION');
      }

      return parsed;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Invalid JSON format', 'json', 'PARSE_ERROR');
    }
  }

  // Private helper methods

  private async readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve(new Uint8Array(arrayBuffer.slice(0, bytes)));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file.slice(0, bytes));
    });
  }

  private async readFileSample(file: File, bytes: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file.slice(0, bytes));
    });
  }

  private isValidImageHeader(header: Uint8Array, mimeType: string): boolean {
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // Partial check for WebP
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) return false;

    return expectedSignatures.some(signature =>
      signature.every((byte, index) => header[index] === byte)
    );
  }

  private containsScript(content: string): boolean {
    const scriptPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /expression\s*\(/i,
    ];

    return scriptPatterns.some(pattern => pattern.test(content));
  }

  private hasPrototypePollution(obj: unknown): boolean {
    if (obj === null || typeof obj !== 'object') return false;

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    function checkObject(current: unknown): boolean {
      if (current === null || typeof current !== 'object') return false;
      
      for (const key of Object.keys(current)) {
        if (dangerousKeys.includes(key)) return true;
        if (typeof current[key] === 'object' && checkObject(current[key])) return true;
      }
      
      return false;
    }

    return checkObject(obj);
  }
}

// Export singleton instance
export const inputValidator = InputValidator.getInstance();

// Convenience validation functions
export const validateText = (input: string, maxLength?: number) => 
  inputValidator.sanitizeText(input, maxLength);

export const validateHtml = (input: string) => 
  inputValidator.sanitizeHtml(input);

export const validateEmail = (email: string) => 
  inputValidator.validateEmail(email);

export const validateUrl = (url: string) => 
  inputValidator.validateUrl(url);

export const validateUuid = (id: string) => 
  inputValidator.validateUuid(id);

export const validateFile = (file: File, allowedTypes?: string[], maxSize?: number) => 
  inputValidator.validateFile(file, allowedTypes, maxSize);

export const validateImage = (file: File) => 
  inputValidator.validateImage(file);

export const validateArray = <T>(
  array: unknown[], 
  itemValidator: (item: unknown) => T, 
  maxLength?: number
) => inputValidator.validateArray(array, itemValidator, maxLength);

export const validateJson = (input: string) => 
  inputValidator.validateJson(input);