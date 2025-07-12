/**
 * Property Status Management Constants
 * 
 * Centralized configuration for property status calculations and display.
 * This ensures consistency across all components and prevents magic strings
 * that could cause bugs when status logic changes.
 * 
 * @fileoverview Property status configuration and utilities
 * @version 1.0.0
 * @since 2025-07-11
 */

import { InspectionStatus } from '@/types/inspection-status';

/**
 * Property status types that map to visual states in the UI
 */
export const PROPERTY_STATUS = {
  AVAILABLE: 'available',
  DRAFT: 'draft', 
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  UNDER_REVIEW: 'under-review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type PropertyStatusType = typeof PROPERTY_STATUS[keyof typeof PROPERTY_STATUS];

/**
 * Visual configuration for property status display
 * Ensures consistent styling across all property status indicators
 */
export const PROPERTY_STATUS_CONFIG = {
  [PROPERTY_STATUS.AVAILABLE]: {
    color: 'bg-blue-500',
    textLabel: 'Available',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Property is ready for inspection assignment',
    priority: 1
  },
  [PROPERTY_STATUS.DRAFT]: {
    color: 'bg-gray-500',
    textLabel: 'Not Started',
    badgeColor: 'bg-gray-100 text-gray-800',
    description: 'Property has been assigned but inspection not yet started',
    priority: 2
  },
  [PROPERTY_STATUS.IN_PROGRESS]: {
    color: 'bg-yellow-500',
    textLabel: 'In Progress',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    description: 'Property inspection is actively being conducted',
    priority: 3
  },
  [PROPERTY_STATUS.COMPLETED]: {
    color: 'bg-green-500',
    textLabel: 'Completed',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Property inspection has been completed',
    priority: 4
  },
  [PROPERTY_STATUS.UNDER_REVIEW]: {
    color: 'bg-purple-500',
    textLabel: 'Under Review',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'Property inspection is being audited',
    priority: 5
  },
  [PROPERTY_STATUS.APPROVED]: {
    color: 'bg-emerald-500',
    textLabel: 'Approved',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'Property inspection has been approved by auditor',
    priority: 6
  },
  [PROPERTY_STATUS.REJECTED]: {
    color: 'bg-red-500',
    textLabel: 'Rejected',
    badgeColor: 'bg-red-100 text-red-800',
    description: 'Property inspection has been rejected and needs revision',
    priority: 7
  }
} as const;

/**
 * Mapping from inspection statuses to property-level status
 * This determines how individual inspection states roll up to property status
 */
export const INSPECTION_TO_PROPERTY_STATUS_MAP: Record<InspectionStatus, PropertyStatusType> = {
  'draft': PROPERTY_STATUS.DRAFT,
  'in_progress': PROPERTY_STATUS.IN_PROGRESS,
  'completed': PROPERTY_STATUS.COMPLETED,
  'pending_review': PROPERTY_STATUS.UNDER_REVIEW,
  'in_review': PROPERTY_STATUS.UNDER_REVIEW,
  'approved': PROPERTY_STATUS.APPROVED,
  'rejected': PROPERTY_STATUS.REJECTED,
  'needs_revision': PROPERTY_STATUS.REJECTED,
  'cancelled': PROPERTY_STATUS.AVAILABLE
};

/**
 * Status precedence rules for when a property has multiple inspections
 * Higher priority statuses take precedence (e.g., if one inspection is rejected,
 * the entire property shows as rejected regardless of other inspection states)
 */
export const STATUS_PRECEDENCE_ORDER = [
  PROPERTY_STATUS.REJECTED,      // Highest priority - any rejection fails the property
  PROPERTY_STATUS.IN_PROGRESS,   // Active work takes precedence over completed work
  PROPERTY_STATUS.UNDER_REVIEW,  // Review state is important to surface
  PROPERTY_STATUS.APPROVED,      // Success state
  PROPERTY_STATUS.COMPLETED,     // Completed but not yet reviewed
  PROPERTY_STATUS.DRAFT,         // Work assigned but not started
  PROPERTY_STATUS.AVAILABLE      // Lowest priority - default state
] as const;

/**
 * Configuration for property status calculation behavior
 */
export const PROPERTY_STATUS_CALCULATION_CONFIG = {
  /**
   * Whether to use the highest priority status when multiple inspections exist
   * If false, uses most recent inspection status
   */
  USE_PRIORITY_BASED_STATUS: true,
  
  /**
   * Maximum age in days for considering an inspection "recent"
   * Used for status calculations and UI indicators
   */
  RECENT_INSPECTION_THRESHOLD_DAYS: 30,
  
  /**
   * Whether to show inspection count in property status badges
   */
  SHOW_INSPECTION_COUNT_IN_BADGE: true,
  
  /**
   * Minimum number of inspections required before showing "multiple" indicator
   */
  MULTIPLE_INSPECTIONS_THRESHOLD: 2
} as const;