/**
 * CORRECTED DATABASE SCHEMA TYPES - July 22, 2025
 * Based on actual Supabase SQL dump verification
 * 
 * CRITICAL: These types match the ACTUAL database structure
 * Previous schema assumptions were completely incorrect
 */

// ===== CORE ENTITY TYPES =====

/**
 * Properties table - Actual verified structure
 * Uses UUID id (not integer property_id)
 * Uses name/address (not property_name/street_address)
 */
export interface Property {
  id: string              // UUID primary key (gen_random_uuid())
  name: string            // Property name 
  address: string         // Property address
  vrbo_url?: string       // Optional VRBO URL
  airbnb_url?: string     // Optional Airbnb URL
  added_by: string        // UUID referencing users.id
  status: string          // 'active' by default
  created_at: string      // Timestamp without time zone
  updated_at: string      // Timestamp without time zone
}

/**
 * Inspections table - Actual verified structure
 * Links properties to inspection sessions
 */
export interface Inspection {
  id: string              // UUID primary key (gen_random_uuid())
  property_id: string     // UUID referencing properties.id
  inspector_id?: string   // UUID referencing users.id
  start_time?: string     // Timestamp without time zone
  end_time?: string       // Timestamp without time zone
  completed: boolean      // Default false
  certification_status?: string // Certification status
  status: string          // 'available' by default
  auditor_feedback?: string // Auditor feedback text
  reviewed_at?: string    // Timestamp with time zone
  created_at: string      // Timestamp with time zone
  updated_at: string      // Timestamp with time zone
}

/**
 * Checklist_items table - THIS IS THE CORRECT TABLE (not 'logs')
 * Individual inspection checklist items
 */
export interface ChecklistItem {
  id: string              // UUID primary key (gen_random_uuid())
  inspection_id: string   // UUID referencing inspections.id
  label: string           // Item description
  category?: string       // Item category
  status?: 'completed' | 'failed' | 'not_applicable' // Item status
  notes?: string          // Inspector notes
  ai_status?: 'pass' | 'fail' | 'conflict' // AI analysis status
  created_at: string      // Timestamp without time zone
  static_item_id?: string // UUID referencing static_safety_items.id
  evidence_type: string   // Required evidence type
  source_photo_url?: string // Reference photo URL
}

/**
 * Static_safety_items table - Template items for checklists
 * Referenced by checklist_items.static_item_id
 */
export interface StaticSafetyItem {
  id: string              // UUID primary key (gen_random_uuid())
  checklist_id: number    // Integer sequence (NOT the FK field!)
  label: string           // Item title
  category: string        // Default 'safety'
  evidence_type: string   // Type of evidence needed
  gpt_prompt?: string     // AI prompt for analysis
  notes?: string          // Additional notes
  required: boolean       // Default true
}

/**
 * Media table - Files linked to checklist items
 */
export interface Media {
  id: string              // UUID primary key
  checklist_item_id: string // UUID referencing checklist_items.id
  type: string            // Media type
  url?: string            // Media URL
}

/**
 * Users table - User accounts and roles
 */
export interface User {
  id: string              // UUID from auth.users
  name: string            // User's full name
  email: string           // User email
  role: string            // User role (inspector/auditor/admin)
  created_at: string      // Timestamp
  updated_at: string      // Timestamp
  status: string          // active/inactive/suspended
  last_login_at?: string  // Last login timestamp
  phone?: string          // Optional phone number
}

// ===== RELATIONSHIP TYPES =====

/**
 * Property with inspection count - Common query result
 */
export interface PropertyWithInspections extends Property {
  inspections_count?: number
  latest_inspection?: Inspection
}

/**
 * Inspection with related data - Full inspection view
 */
export interface InspectionWithDetails extends Inspection {
  property?: Property
  inspector?: User
  checklist_items?: ChecklistItemWithDetails[]
}

/**
 * Checklist item with related data - Full item view
 */
export interface ChecklistItemWithDetails extends ChecklistItem {
  static_safety_item?: StaticSafetyItem
  media?: Media[]
}

// ===== QUERY HELPER TYPES =====

/**
 * Common status values for inspections
 */
export type InspectionStatus = 'available' | 'in_progress' | 'completed' | 'reviewed'

/**
 * Common status values for checklist items
 */
export type ChecklistItemStatus = 'completed' | 'failed' | 'not_applicable'

/**
 * AI analysis status values
 */
export type AIStatus = 'pass' | 'fail' | 'conflict'

/**
 * User roles in the system
 */
export type UserRole = 'inspector' | 'auditor' | 'admin'

/**
 * Property status values
 */
export type PropertyStatus = 'active' | 'inactive' | 'archived'

// ===== SUPABASE QUERY PATTERNS =====

/**
 * Correct query patterns using actual schema
 * 
 * ✅ Get properties: supabase.from('properties').select('id, name, address')
 * ✅ Get checklist items: supabase.from('checklist_items').select('*').eq('inspection_id', inspectionId)
 * ✅ Join relationships: .select('*, static_safety_items!static_item_id(*)')
 * 
 * ❌ WRONG: Don't use 'logs', 'property_id', 'property_name', 'checklist_id' as FK
 */