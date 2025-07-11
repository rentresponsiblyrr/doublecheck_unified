/**
 * Standardized inspection status types and constants
 * This file centralizes all status-related definitions to ensure consistency
 * across the entire application.
 */

// Core inspection status values (matching database schema)
export const INSPECTION_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed',
  PENDING_REVIEW: 'pending_review',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVISION: 'needs_revision',
  CANCELLED: 'cancelled'
} as const;

// Type for inspection status values
export type InspectionStatus = typeof INSPECTION_STATUS[keyof typeof INSPECTION_STATUS];

// Valid status values array for validation
export const VALID_INSPECTION_STATUSES: InspectionStatus[] = Object.values(INSPECTION_STATUS);

// Status groupings for different use cases
export const STATUS_GROUPS = {
  // Active/ongoing work
  ACTIVE: [INSPECTION_STATUS.DRAFT, INSPECTION_STATUS.IN_PROGRESS],
  
  // Ready for or under review
  REVIEW_PIPELINE: [INSPECTION_STATUS.COMPLETED, INSPECTION_STATUS.PENDING_REVIEW, INSPECTION_STATUS.IN_REVIEW],
  
  // Final states
  FINAL: [INSPECTION_STATUS.APPROVED, INSPECTION_STATUS.REJECTED, INSPECTION_STATUS.CANCELLED],
  
  // Needs action from inspector
  NEEDS_INSPECTOR_ACTION: [INSPECTION_STATUS.DRAFT, INSPECTION_STATUS.NEEDS_REVISION],
  
  // Needs action from auditor  
  NEEDS_AUDITOR_ACTION: [INSPECTION_STATUS.COMPLETED, INSPECTION_STATUS.PENDING_REVIEW],
  
  // All completed work (for statistics)
  COMPLETED_WORK: [INSPECTION_STATUS.COMPLETED, INSPECTION_STATUS.PENDING_REVIEW, INSPECTION_STATUS.IN_REVIEW, INSPECTION_STATUS.APPROVED]
} as const;

// Status display information
export const STATUS_DISPLAY = {
  [INSPECTION_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'gray',
    badgeVariant: 'outline' as const,
    description: 'Inspection has been created but not started'
  },
  [INSPECTION_STATUS.IN_PROGRESS]: {
    label: 'In Progress', 
    color: 'blue',
    badgeVariant: 'default' as const,
    description: 'Inspector is actively working on this inspection'
  },
  [INSPECTION_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'green', 
    badgeVariant: 'outline' as const,
    description: 'Inspection completed, ready for review'
  },
  [INSPECTION_STATUS.PENDING_REVIEW]: {
    label: 'Pending Review',
    color: 'yellow',
    badgeVariant: 'secondary' as const, 
    description: 'Waiting for auditor review'
  },
  [INSPECTION_STATUS.IN_REVIEW]: {
    label: 'In Review',
    color: 'yellow',
    badgeVariant: 'default' as const,
    description: 'Currently being reviewed by auditor'
  },
  [INSPECTION_STATUS.APPROVED]: {
    label: 'Approved',
    color: 'green',
    badgeVariant: 'outline' as const,
    description: 'Inspection approved by auditor'
  },
  [INSPECTION_STATUS.REJECTED]: {
    label: 'Rejected', 
    color: 'red',
    badgeVariant: 'destructive' as const,
    description: 'Inspection rejected by auditor'
  },
  [INSPECTION_STATUS.NEEDS_REVISION]: {
    label: 'Needs Revision',
    color: 'orange', 
    badgeVariant: 'secondary' as const,
    description: 'Inspection needs changes before approval'
  },
  [INSPECTION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'gray',
    badgeVariant: 'outline' as const, 
    description: 'Inspection has been cancelled'
  }
} as const;

// Utility functions for status checking
export const isActiveStatus = (status: string): boolean => {
  return STATUS_GROUPS.ACTIVE.includes(status as InspectionStatus);
};

export const isInReviewPipeline = (status: string): boolean => {
  return STATUS_GROUPS.REVIEW_PIPELINE.includes(status as InspectionStatus);
};

export const isFinalStatus = (status: string): boolean => {
  return STATUS_GROUPS.FINAL.includes(status as InspectionStatus);
};

export const needsInspectorAction = (status: string): boolean => {
  return STATUS_GROUPS.NEEDS_INSPECTOR_ACTION.includes(status as InspectionStatus);
};

export const needsAuditorAction = (status: string): boolean => {
  return STATUS_GROUPS.NEEDS_AUDITOR_ACTION.includes(status as InspectionStatus);
};

export const isCompletedWork = (status: string): boolean => {
  return STATUS_GROUPS.COMPLETED_WORK.includes(status as InspectionStatus);
};

// Get display information for a status
export const getStatusDisplay = (status: string) => {
  return STATUS_DISPLAY[status as InspectionStatus] || {
    label: 'Unknown',
    color: 'gray',
    badgeVariant: 'outline' as const,
    description: 'Unknown status'
  };
};

// Legacy status mapping for backward compatibility
export const LEGACY_STATUS_MAP: Record<string, InspectionStatus> = {
  'in-progress': INSPECTION_STATUS.IN_PROGRESS,
  'pending-review': INSPECTION_STATUS.PENDING_REVIEW,
  'in-review': INSPECTION_STATUS.IN_REVIEW,
  'needs-revision': INSPECTION_STATUS.NEEDS_REVISION,
  // Add other legacy variants as needed
};

// Normalize status to standard format
export const normalizeStatus = (status: string | null | undefined): InspectionStatus | null => {
  if (!status) return null;
  
  const normalized = status.toLowerCase().trim();
  
  // Check if it's already a valid status
  if (VALID_INSPECTION_STATUSES.includes(normalized as InspectionStatus)) {
    return normalized as InspectionStatus;
  }
  
  // Check legacy mappings
  if (LEGACY_STATUS_MAP[normalized]) {
    return LEGACY_STATUS_MAP[normalized];
  }
  
  // If we can't normalize it, return null
  console.warn(`Unknown inspection status: ${status}`);
  return null;
};