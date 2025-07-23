/**
 * Checklist Management Types
 * Shared interfaces and types for checklist components
 */

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  evidence_type: string;
  required: boolean;
  deleted: boolean;
  notes?: string;
  gpt_prompt?: string;
  created_at: string;
  updated_at?: string;
  active_date?: string;
  deleted_date?: string;
}

export interface ChecklistFormData {
  label: string;
  category: string;
  evidence_type: string;
  required: boolean;
  notes: string;
  gpt_prompt: string;
}

export interface SystemHealth {
  tableExists: boolean;
  hasData: boolean;
  hasPermissions: boolean;
  canConnect: boolean;
  errorDetails?: string;
  lastChecked: Date;
}

export interface ChecklistFilters {
  search: string;
  category: string;
  evidenceType: string;
  status: string;
}

export interface ChecklistStats {
  total: number;
  active: number;
  deleted: number;
  required: number;
  byCategory: Record<string, number>;
  byEvidenceType: Record<string, number>;
}

export const CHECKLIST_CATEGORIES = [
  "Safety",
  "Cleanliness",
  "Amenities",
  "Structure",
  "Compliance",
  "Accessibility",
  "Technology",
  "Emergency",
  "General",
] as const;

export const EVIDENCE_TYPES = [
  "photo",
  "video",
  "inspection",
  "documentation",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
