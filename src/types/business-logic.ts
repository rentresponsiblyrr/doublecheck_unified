/**
 * Core Business Logic Types
 * Eliminates critical 'any' types in business components
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'inspector' | 'auditor' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string; // CORRECTED: logs.checklist_id -> static_safety_items.id
  title: string;
  category: string;
  status: 'pending' | 'completed' | 'failed' | 'not_applicable';
  inspector_notes?: string;
  evidence_type: 'photo' | 'video' | 'none';
  required: boolean;
  ai_result?: string;
  pass?: boolean;
  inspector_id?: string;
  created_at?: string;
}

export interface AIAnalysisResult {
  confidence: number;
  status: 'pass' | 'fail' | 'needs_review';
  reasoning: string;
  suggestions?: string[];
  quality_score?: number;
  processing_time_ms?: number;
  timestamp: string;
  model_version?: string;
}

export interface PhotoAnalysis {
  quality_score: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  issues: string[];
  recommendations: string[];
  ai_analysis?: AIAnalysisResult;
}

export interface InspectionRecord {
  id: string;
  property_id: string;
  inspector_id: string;
  status: 'draft' | 'in_progress' | 'completed' | 'auditing';
  created_at: string;
  updated_at?: string;
  checklist_items?: ChecklistItem[];
}

export interface UploadResult {
  success: boolean;
  file_url?: string;
  file_id?: string;
  error?: string;
  processing_time_ms?: number;
}

export interface SecurityEvent {
  type: 'upload' | 'validation' | 'access' | 'auth';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  details: Record<string, unknown>;
  timestamp: string;
  ip_address?: string;
}

export interface UploadError extends Error {
  code: 'INVALID_FILE' | 'SIZE_LIMIT' | 'NETWORK_ERROR' | 'SECURITY_VIOLATION';
  details: Record<string, unknown>;
}
