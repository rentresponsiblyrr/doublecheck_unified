/**
 * Branded Types for STR Certified
 * Prevents mixing different ID types and ensures type safety
 */

// Branded type utility
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { readonly [__brand]: TBrand };

// Core Entity IDs
export type PropertyId = Brand<string, 'PropertyId'>;
export type InspectionId = Brand<string, 'InspectionId'>;
export type UserId = Brand<string, 'UserId'>;
export type ChecklistItemId = Brand<string, 'ChecklistItemId'>;
export type MediaId = Brand<string, 'MediaId'>;

// Type guards for runtime validation
export const isPropertyId = (value: string): value is PropertyId => {
  return typeof value === 'string' && value.length > 0;
};

export const isInspectionId = (value: string): value is InspectionId => {
  return typeof value === 'string' && value.length > 0;
};

export const isUserId = (value: string): value is UserId => {
  return typeof value === 'string' && value.length > 0;
};

// Type constructors for safe creation
export const createPropertyId = (value: string): PropertyId => {
  if (!isPropertyId(value)) {
    throw new Error(`Invalid PropertyId: ${value}`);
  }
  return value as PropertyId;
};

export const createInspectionId = (value: string): InspectionId => {
  if (!isInspectionId(value)) {
    throw new Error(`Invalid InspectionId: ${value}`);
  }
  return value as InspectionId;
};

export const createUserId = (value: string): UserId => {
  if (!isUserId(value)) {
    throw new Error(`Invalid UserId: ${value}`);
  }
  return value as UserId;
};

// Core database entity interfaces with branded types
export interface Property {
  property_id: PropertyId;
  property_name: string;
  street_address: string;
  vrbo_url?: string;
  airbnb_url?: string;
  created_by: UserId;
  scraped_at?: string;
}

export interface Inspection {
  id: InspectionId;
  property_id: PropertyId;
  inspector_id: UserId;
  status: 'draft' | 'in_progress' | 'completed' | 'auditing';
  created_at: string;
}

export interface ChecklistItem {
  id: ChecklistItemId;
  inspection_id: InspectionId;
  checklist_id: string; // CORRECTED: logs.checklist_id -> static_safety_items.id
  status: 'pending' | 'completed' | 'failed' | 'not_applicable';
  inspector_notes?: string;
}

export interface Profile {
  id: UserId;
  full_name: string;
  email: string;
  role?: 'inspector' | 'auditor' | 'admin';
}

export interface StaticSafetyItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  evidence_type: 'photo' | 'video' | 'none';
}