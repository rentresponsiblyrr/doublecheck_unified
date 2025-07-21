/**
 * Payload and data transfer interfaces
 * Eliminates any types in component communication and API calls
 */

export interface BasePayload {
  timestamp: string;
  requestId: string;
  source: string;
}

export interface UploadPayload extends BasePayload {
  type: 'photo' | 'video' | 'document' | 'data';
  file?: File;
  data?: Record<string, unknown>;
  metadata: UploadMetadata;
  destination: 'inspection' | 'property' | 'user' | 'system';
}

export interface UploadMetadata {
  inspectionId?: string;
  propertyId?: string;
  checklistItemId?: string;
  userId: string;
  originalFilename?: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface SyncPayload extends BasePayload {
  operation: 'create' | 'update' | 'delete' | 'sync';
  entityType: 'inspection' | 'property' | 'user' | 'checklist';
  entityId: string;
  data: Record<string, unknown>;
  conflicts?: SyncConflict[];
}

export interface SyncConflict {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  lastModified: {
    local: string;
    remote: string;
  };
  resolution?: 'local' | 'remote' | 'merge';
}

export interface AuthPayload extends BasePayload {
  action: 'login' | 'logout' | 'refresh' | 'verify';
  credentials?: {
    email: string;
    password?: string;
    token?: string;
    provider?: 'email' | 'google' | 'apple';
  };
  sessionInfo?: {
    deviceId: string;
    userAgent: string;
    location?: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  retryable: boolean;
}

export interface WebhookPayload extends BasePayload {
  event: string;
  data: Record<string, unknown>;
  signature?: string;
  deliveryAttempt: number;
  maxRetries: number;
}

export interface OfflineData extends BasePayload {
  operation: 'queue' | 'sync' | 'cleanup';
  data: Record<string, unknown>;
  priority: number;
  retryCount: number;
  maxRetries: number;
  expiresAt?: string;
}