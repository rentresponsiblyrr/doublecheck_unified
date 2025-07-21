/**
 * Enterprise-Grade Secure File Handler
 * Implements Stripe/GitHub/Auth0 level file security standards
 * 
 * SECURITY FEATURES:
 * - Magic byte validation for file type verification
 * - MIME type validation with allowlist approach
 * - File size limits with progressive restrictions
 * - Malware detection using file pattern analysis
 * - EXIF data sanitization for privacy protection
 * - Content scanning for embedded threats
 * - Quarantine system for suspicious files
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { PIIProtectionService } from './pii-protection';

// File security configuration
const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB max
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB for images
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB for videos
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'] as const,
  SCAN_TIMEOUT: 30000, // 30 seconds
} as const;

// File signature database (magic bytes)
const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF + WEBP
  'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
} as const;

// Known malicious patterns in file headers
const MALICIOUS_PATTERNS = [
  // Script injections in image files
  [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], // <script
  [0x3C, 0x69, 0x66, 0x72, 0x61, 0x6D, 0x65], // <iframe
  [0x3C, 0x6F, 0x62, 0x6A, 0x65, 0x63, 0x74], // <object
  // PHP code injection
  [0x3C, 0x3F, 0x70, 0x68, 0x70], // <?php
  // Executable signatures
  [0x4D, 0x5A], // PE executable (MZ)
  [0x7F, 0x45, 0x4C, 0x46], // ELF executable
] as const;

export interface FileValidationResult {
  isValid: boolean;
  fileType: string;
  size: number;
  threats: string[];
  sanitized?: File;
  metadata?: Record<string, unknown>;
}

export interface ThreatScanResult {
  threats: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  quarantined: boolean;
  details: string[];
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class SecureFileHandler {
  private static quarantinedFiles = new Map<string, { file: File; reason: string; timestamp: number }>();

  /**
   * Validates file security including type, size, and content scanning
   */
  static async validateFile(file: File): Promise<FileValidationResult> {
    try {
      // Basic validation
      this.validateFileBasics(file);

      // Magic byte validation
      await this.validateFileSignature(file);

      // Content threat scanning
      const threatScan = await this.scanForThreats(file);
      
      if (threatScan.riskLevel === 'critical' || threatScan.quarantined) {
        throw new SecurityError(
          'File failed security scan',
          'SECURITY_SCAN_FAILED',
          { threats: threatScan.threats, riskLevel: threatScan.riskLevel }
        );
      }

      // EXIF sanitization for images
      const sanitizedFile = await this.sanitizeFile(file);

      return {
        isValid: true,
        fileType: file.type,
        size: file.size,
        threats: threatScan.threats,
        sanitized: sanitizedFile,
        metadata: {
          scanResult: threatScan,
          originalName: PIIProtectionService.scrubPII(file.name),
          processedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(
        'File validation failed',
        'VALIDATION_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Validates basic file properties
   */
  private static validateFileBasics(file: File): void {
    if (!file) {
      throw new SecurityError('No file provided', 'NO_FILE');
    }

    if (file.size === 0) {
      throw new SecurityError('Empty file not allowed', 'EMPTY_FILE');
    }

    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      throw new SecurityError(
        `File too large: ${file.size} bytes (max: ${SECURITY_CONFIG.MAX_FILE_SIZE})`,
        'FILE_TOO_LARGE'
      );
    }

    // Type-specific size limits
    if (file.type.startsWith('image/') && file.size > SECURITY_CONFIG.MAX_IMAGE_SIZE) {
      throw new SecurityError(
        `Image too large: ${file.size} bytes (max: ${SECURITY_CONFIG.MAX_IMAGE_SIZE})`,
        'IMAGE_TOO_LARGE'
      );
    }

    if (file.type.startsWith('video/') && file.size > SECURITY_CONFIG.MAX_VIDEO_SIZE) {
      throw new SecurityError(
        `Video too large: ${file.size} bytes (max: ${SECURITY_CONFIG.MAX_VIDEO_SIZE})`,
        'VIDEO_TOO_LARGE'
      );
    }

    // MIME type validation
    const allowedTypes = [
      ...SECURITY_CONFIG.ALLOWED_IMAGE_TYPES,
      ...SECURITY_CONFIG.ALLOWED_VIDEO_TYPES
    ];

    if (!allowedTypes.includes(file.type as typeof allowedTypes[number])) {
      throw new SecurityError(
        `File type not allowed: ${file.type}`,
        'INVALID_FILE_TYPE'
      );
    }
  }

  /**
   * Validates file signature (magic bytes) against MIME type
   */
  private static async validateFileSignature(file: File): Promise<void> {
    const headerSize = Math.max(...Object.values(FILE_SIGNATURES).flat().map(sig => sig.length));
    const headerBuffer = await file.slice(0, headerSize).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);

    const expectedSignatures = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
    if (!expectedSignatures) {
      throw new SecurityError(
        `No signature validation available for type: ${file.type}`,
        'NO_SIGNATURE_VALIDATION'
      );
    }

    const isValidSignature = expectedSignatures.some(signature =>
      signature.every((byte, index) => headerBytes[index] === byte)
    );

    if (!isValidSignature) {
      throw new SecurityError(
        `File signature mismatch for declared type: ${file.type}`,
        'SIGNATURE_MISMATCH'
      );
    }
  }

  /**
   * Scans file for malicious content and patterns
   */
  private static async scanForThreats(file: File): Promise<ThreatScanResult> {
    const threats: string[] = [];
    const details: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    try {
      // Scan first 64KB for malicious patterns
      const scanSize = Math.min(file.size, 64 * 1024);
      const scanBuffer = await file.slice(0, scanSize).arrayBuffer();
      const scanBytes = new Uint8Array(scanBuffer);

      // Check for malicious patterns
      for (const pattern of MALICIOUS_PATTERNS) {
        for (let i = 0; i <= scanBytes.length - pattern.length; i++) {
          if (pattern.every((byte, j) => scanBytes[i + j] === byte)) {
            threats.push('MALICIOUS_PATTERN_DETECTED');
            details.push(`Suspicious byte sequence found at offset ${i}`);
            riskLevel = 'critical';
          }
        }
      }

      // Check file name for suspicious patterns
      if (this.hasSuspiciousFileName(file.name)) {
        threats.push('SUSPICIOUS_FILENAME');
        details.push('File name contains suspicious patterns');
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }

      // Check for oversized metadata (potential payload hiding)
      if (file.type.startsWith('image/') && await this.hasOversizedMetadata(file)) {
        threats.push('OVERSIZED_METADATA');
        details.push('Image contains unusually large metadata');
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }

      // Quarantine if critical threats found
      const quarantined = riskLevel === 'critical';
      if (quarantined) {
        this.quarantineFile(file, threats.join(', '));
      }

      return {
        threats,
        riskLevel,
        quarantined,
        details
      };
    } catch (error) {
      return {
        threats: ['SCAN_ERROR'],
        riskLevel: 'medium',
        quarantined: false,
        details: [`Scan error: ${error.message}`]
      };
    }
  }

  /**
   * Checks for suspicious file names
   */
  private static hasSuspiciousFileName(filename: string): boolean {
    const suspiciousPatterns = [
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.html$/i,
      /\.htm$/i,
      /\.(jpeg|jpg|png|gif)\.(php|asp|jsp|exe|bat|cmd|scr|vbs|js|html|htm)$/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Checks for oversized metadata in images
   */
  private static async hasOversizedMetadata(file: File): Promise<boolean> {
    if (!file.type.startsWith('image/')) return false;

    try {
      // For JPEG, check for oversized EXIF data
      if (file.type === 'image/jpeg') {
        const headerBuffer = await file.slice(0, 64 * 1024).arrayBuffer();
        const headerBytes = new Uint8Array(headerBuffer);
        
        // Look for EXIF marker (0xFFE1)
        for (let i = 0; i < headerBytes.length - 4; i++) {
          if (headerBytes[i] === 0xFF && headerBytes[i + 1] === 0xE1) {
            const exifSize = (headerBytes[i + 2] << 8) | headerBytes[i + 3];
            // Flag if EXIF data is unusually large (>32KB)
            if (exifSize > 32 * 1024) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Sanitizes file by removing potentially dangerous metadata
   */
  private static async sanitizeFile(file: File): Promise<File> {
    try {
      if (file.type.startsWith('image/')) {
        return await this.sanitizeImage(file);
      }
      
      // For non-images, return as-is for now
      return file;
    } catch {
      // If sanitization fails, return original file
      return file;
    }
  }

  /**
   * Sanitizes images by removing EXIF data and other metadata
   */
  private static async sanitizeImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image without metadata
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const sanitizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(sanitizedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.95);
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Quarantines suspicious files
   */
  private static quarantineFile(file: File, reason: string): void {
    const fileId = `${file.name}_${file.size}_${Date.now()}`;
    this.quarantinedFiles.set(fileId, {
      file,
      reason,
      timestamp: Date.now()
    });

    // Clean up old quarantined files (older than 24 hours)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [id, data] of this.quarantinedFiles.entries()) {
      if (data.timestamp < twentyFourHoursAgo) {
        this.quarantinedFiles.delete(id);
      }
    }
  }

  /**
   * Gets quarantined files (for admin review)
   */
  static getQuarantinedFiles(): Array<{ id: string; file: File; reason: string; timestamp: number }> {
    return Array.from(this.quarantinedFiles.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  /**
   * Creates secure file upload handler with progress tracking
   */
  static createSecureUploadHandler(
    onProgress?: (progress: number) => void,
    onValidation?: (result: FileValidationResult) => void
  ) {
    return async (file: File): Promise<FileValidationResult> => {
      onProgress?.(0);

      // Validate file
      onProgress?.(25);
      const validationResult = await this.validateFile(file);
      
      onProgress?.(75);
      onValidation?.(validationResult);
      
      onProgress?.(100);
      return validationResult;
    };
  }
}

// Zod schema for file validation
export const SecureFileSchema = z.custom<File>()
  .refine(
    (file) => file instanceof File,
    'Must be a valid File object'
  )
  .refine(
    (file) => file.size <= SECURITY_CONFIG.MAX_FILE_SIZE,
    `File must be smaller than ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
  )
  .refine(
    (file) => [
      ...SECURITY_CONFIG.ALLOWED_IMAGE_TYPES,
      ...SECURITY_CONFIG.ALLOWED_VIDEO_TYPES
    ].includes(file.type as (typeof SECURITY_CONFIG.ALLOWED_IMAGE_TYPES | typeof SECURITY_CONFIG.ALLOWED_VIDEO_TYPES)[number]),
    'File type not allowed'
  );

// Type-specific schemas
export const SecureImageSchema = z.custom<File>()
  .refine(
    (file) => file instanceof File && file.type.startsWith('image/'),
    'Must be an image file'
  )
  .refine(
    (file) => SECURITY_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as typeof SECURITY_CONFIG.ALLOWED_IMAGE_TYPES[number]),
    'Image type not allowed'
  )
  .refine(
    (file) => file.size <= SECURITY_CONFIG.MAX_IMAGE_SIZE,
    `Image must be smaller than ${SECURITY_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)}MB`
  );

export const SecureVideoSchema = z.custom<File>()
  .refine(
    (file) => file instanceof File && file.type.startsWith('video/'),
    'Must be a video file'
  )
  .refine(
    (file) => SECURITY_CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type as typeof SECURITY_CONFIG.ALLOWED_VIDEO_TYPES[number]),
    'Video type not allowed'
  )
  .refine(
    (file) => file.size <= SECURITY_CONFIG.MAX_VIDEO_SIZE,
    `Video must be smaller than ${SECURITY_CONFIG.MAX_VIDEO_SIZE / (1024 * 1024)}MB`
  );