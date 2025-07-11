/**
 * Secure File Upload Hook
 * Replaces the existing file upload with enterprise security
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { inputValidator, ValidationError } from '@/lib/security/input-validator';

interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
}

interface UploadResult {
  url: string;
  path: string;
  metadata: {
    size: number;
    type: string;
    checksum: string;
    scanResult?: 'clean' | 'threat' | 'pending';
  };
}

interface UseSecureFileUploadReturn {
  uploadFile: (file: File, path?: string) => Promise<UploadResult>;
  uploadImage: (file: File, path?: string) => Promise<UploadResult>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useSecureFileUpload(): UseSecureFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate secure file path
  const generateSecurePath = useCallback((file: File, customPath?: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = file.name.split('.').pop() || '';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (customPath) {
      return `${customPath}/${timestamp}_${random}_${sanitizedName}`;
    }
    
    return `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${timestamp}_${random}.${ext}`;
  }, []);

  // Calculate file checksum
  const calculateChecksum = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  // Virus scan simulation (in production, this would call a real antivirus service)
  const performVirusScan = useCallback(async (file: File): Promise<'clean' | 'threat' | 'pending'> => {
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for suspicious file patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.cmd$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return 'threat';
    }

    // In production, integrate with ClamAV, VirusTotal, or similar service
    return 'clean';
  }, []);

  // Log security events
  const logSecurityEvent = useCallback(async (event: string, details: any) => {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: event,
        details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, []);

  // Upload file with security checks
  const uploadFile = useCallback(async (file: File, customPath?: string): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress({ percentage: 0, uploadedBytes: 0, totalBytes: file.size });
    setError(null);

    try {
      // Step 1: Validate file
      const validatedFile = inputValidator.validateFile(file);
      
      setProgress({ percentage: 10, uploadedBytes: 0, totalBytes: file.size });

      // Step 2: Perform virus scan
      const scanResult = await performVirusScan(validatedFile);
      
      if (scanResult === 'threat') {
        await logSecurityEvent('file_upload_threat_detected', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
        throw new ValidationError('File failed security scan', 'file', 'SECURITY_THREAT');
      }

      setProgress({ percentage: 30, uploadedBytes: 0, totalBytes: file.size });

      // Step 3: Calculate checksum
      const checksum = await calculateChecksum(validatedFile);
      
      setProgress({ percentage: 40, uploadedBytes: 0, totalBytes: file.size });

      // Step 4: Generate secure path
      const securePath = generateSecurePath(validatedFile, customPath);

      // Step 5: Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('str-certified-storage')
        .upload(securePath, validatedFile, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            checksum,
            scanResult,
            originalName: validatedFile.name,
            uploadedAt: new Date().toISOString(),
          },
        });

      if (uploadError) {
        await logSecurityEvent('file_upload_failed', {
          fileName: file.name,
          error: uploadError.message,
          path: securePath,
        });
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress({ percentage: 90, uploadedBytes: file.size, totalBytes: file.size });

      // Step 6: Get public URL
      const { data: urlData } = supabase.storage
        .from('str-certified-storage')
        .getPublicUrl(data.path);

      setProgress({ percentage: 100, uploadedBytes: file.size, totalBytes: file.size });

      // Step 7: Log successful upload
      await logSecurityEvent('file_upload_success', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        path: data.path,
        checksum,
        scanResult,
      });

      const result: UploadResult = {
        url: urlData.publicUrl,
        path: data.path,
        metadata: {
          size: validatedFile.size,
          type: validatedFile.type,
          checksum,
          scanResult,
        },
      };

      return result;

    } catch (error: any) {
      console.error('File upload error:', error);
      
      const errorMessage = error instanceof ValidationError 
        ? error.message 
        : 'Upload failed. Please try again.';
      
      setError(errorMessage);
      
      await logSecurityEvent('file_upload_error', {
        fileName: file.name,
        error: error.message,
        errorType: error.constructor.name,
      });
      
      throw error;
    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => setProgress(null), 2000);
    }
  }, [generateSecurePath, calculateChecksum, performVirusScan, logSecurityEvent]);

  // Upload image with additional image-specific validation
  const uploadImage = useCallback(async (file: File, customPath?: string): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      // Additional image validation
      const validatedImage = await inputValidator.validateImage(file);
      
      // Use the regular upload function
      return await uploadFile(validatedImage, customPath || 'images');
      
    } catch (error: any) {
      console.error('Image upload error:', error);
      
      const errorMessage = error instanceof ValidationError 
        ? error.message 
        : 'Image upload failed. Please try again.';
      
      setError(errorMessage);
      throw error;
    }
  }, [uploadFile]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadImage,
    isUploading,
    progress,
    error,
    clearError,
  };
}