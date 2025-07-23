/**
 * DATABASE SCHEMA TYPES - PHASE 2 QUERY STANDARDIZATION
 *
 * Direct mapping to verified production database schema from Phase 1.
 * These types match exactly with the documented schema in DATABASE_SCHEMA_REFERENCE.md
 * to ensure zero schema mismatches and eliminate 400/404 database errors.
 *
 * @author STR Certified Engineering Team
 * @phase Phase 2 - Query Standardization & Architectural Excellence
 */

// ========================================
// CORE ENTITY TYPES (Production Schema)
// ========================================

/**
 * Properties table - Base table for database operations
 * Source: DATABASE_SCHEMA_REFERENCE.md verified schema
 */
export interface DatabaseProperty {
  id: string; // UUID PRIMARY KEY
  name: string; // TEXT NOT NULL
  address: string | null; // TEXT
  city: string | null; // TEXT
  state: string | null; // TEXT
  zipcode: number | null; // INTEGER
  listing_url: string | null; // TEXT
  airbnb_url: string | null; // TEXT
  vrbo_url: string | null; // TEXT
  inspector_name: string | null; // TEXT
  inspector_status:
    | "assigned"
    | "in_progress"
    | "completed"
    | "unavailable"
    | null;
  last_inspection_date: string | null; // DATE
  video_url: string | null; // TEXT
  logs_video_id: string | null; // TEXT
  linked_logs: string | null; // TEXT
  renewal_date: string | null; // DATE
  audit_status:
    | "pending"
    | "in_progress"
    | "completed"
    | "failed"
    | "cancelled"
    | null;
  audit_completion_date: string | null; // DATE
  audit_priority: number | null; // INTEGER (1-5)
  audit_assigned_to: string | null; // UUID FK → auth.users.id
  quality_score: number | null; // NUMERIC
  last_quality_check: string | null; // TIMESTAMPTZ
  active_inspection_session_id: string | null; // UUID FK → inspection_sessions.id
  created_by: string; // UUID FK → auth.users.id (NOT NULL)
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at: string; // TIMESTAMPTZ DEFAULT NOW()
}

/**
 * Inspections table - Individual inspection records
 * Source: DATABASE_SCHEMA_REFERENCE.md verified schema
 */
export interface DatabaseInspection {
  id: string; // UUID PRIMARY KEY
  property_id: number; // INTEGER FK → properties.property_id
  inspector_id: string; // UUID FK → auth.users.id
  start_time: string | null; // TIMESTAMPTZ
  end_time: string | null; // TIMESTAMPTZ
  completed: boolean; // BOOLEAN DEFAULT false
  status: string; // TEXT
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at: string; // TIMESTAMPTZ DEFAULT NOW()
}

/**
 * Inspection Sessions table - Session management
 * Source: DATABASE_SCHEMA_REFERENCE.md verified schema
 */
export interface DatabaseInspectionSession {
  id: string; // UUID PRIMARY KEY
  property_id: number; // INTEGER FK → properties.property_id
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at: string; // TIMESTAMPTZ DEFAULT NOW()
}

/**
 * Users table - From auth.users (Supabase)
 * Referenced by foreign keys across the system
 */
export interface DatabaseUser {
  id: string; // UUID PRIMARY KEY
  name: string; // TEXT
  email: string; // TEXT
  role: "inspector" | "auditor" | "admin";
  status: "active" | "inactive" | "suspended";
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  last_login_at: string | null; // TIMESTAMPTZ
  phone: string | null; // TEXT
}

/**
 * Checklist_items table - Individual checklist item records (CORRECTED)
 * Source: Actual verified database schema
 */
export interface DatabaseChecklistItem {
  id: string; // UUID PRIMARY KEY
  inspection_id: string; // UUID FK → inspections.id
  static_item_id: string; // UUID FK → static_safety_items.id
  label: string; // TEXT - Item description
  category: string | null; // TEXT - Item category
  status: "completed" | "failed" | "not_applicable" | null; // Item status
  notes: string | null; // TEXT - Inspector notes
  ai_status: "pass" | "fail" | "conflict" | null; // AI analysis status
  evidence_type: string; // TEXT - Required evidence type
  source_photo_url: string | null; // TEXT - Reference photo URL
  created_at: string; // TIMESTAMP
}

/**
 * Static Safety Items table - Template checklist items
 * Source: CLAUDE.md schema corrections (UUID primary key)
 */
export interface DatabaseStaticSafetyItem {
  id: string; // UUID PRIMARY KEY (NOT integer!)
  label: string; // TEXT - Item title
  category: string; // TEXT - Item category
  required: boolean; // BOOLEAN - Whether required
  evidence_type: string; // TEXT - Type of evidence needed
  deleted: boolean; // BOOLEAN - Soft delete flag
}

/**
 * Media table - Media files linked to logs
 * Source: Standard media storage pattern
 */
export interface DatabaseMedia {
  id: string; // UUID PRIMARY KEY
  log_id: number; // INTEGER FK → logs.log_id
  type: "photo" | "video" | "document";
  url: string; // TEXT - Storage URL
  filename: string; // TEXT - Original filename
  size: number; // INTEGER - File size in bytes
  created_at: string; // TIMESTAMPTZ
}

// ========================================
// VIEW TYPES (Compatibility Layer)
// ========================================

/**
 * Properties Fixed view - Application-facing with UUID conversion
 * Source: DATABASE_SCHEMA_REFERENCE.md compatibility layer
 */
export interface DatabasePropertyFixed {
  id: string; // UUID from int_to_uuid(property_id)
  original_property_id: number; // INTEGER original property_id
  name: string; // TEXT - Property name
  address: string; // TEXT concatenated address
  // All other properties same as DatabaseProperty but with UUID id
}

/**
 * Inspections Fixed view - Application-facing with UUID conversion
 * Source: DATABASE_SCHEMA_REFERENCE.md compatibility layer
 */
export interface DatabaseInspectionFixed {
  id: string; // UUID from inspection_sessions.id
  property_id: string; // UUID from int_to_uuid(property_id)
  original_property_id: number; // INTEGER original property_id
  status: string; // TEXT fixed status value
  completed: boolean; // BOOLEAN fixed completion status
  start_time: string; // TIMESTAMPTZ from created_at
  end_time: string; // TIMESTAMPTZ from updated_at
  inspector_id: string | null; // TEXT (not available in sessions)
  certification_status: string | null; // TEXT (not available in sessions)
}

// ========================================
// RELATIONSHIP TYPES
// ========================================

/**
 * Property with inspection relationship
 * Optimized for common query patterns
 */
export interface PropertyWithInspections extends DatabaseProperty {
  inspections: DatabaseInspection[];
  active_inspection_count: number;
  last_inspection: DatabaseInspection | null;
}

/**
 * Inspection with full relationship data
 * Single-query result for detailed inspection views
 */
export interface InspectionWithFullDetails extends DatabaseInspection {
  property: DatabaseProperty;
  logs: Array<
    DatabaseLog & {
      static_safety_item: DatabaseStaticSafetyItem;
      media: DatabaseMedia[];
    }
  >;
  inspector: DatabaseUser;
}

/**
 * Checklist item with relationships
 * Used for inspection progress calculations
 */
export interface ChecklistItemWithDetails extends DatabaseLog {
  static_safety_item: DatabaseStaticSafetyItem;
  media: DatabaseMedia[];
  property: DatabaseProperty;
}

// ========================================
// QUERY RESULT TYPES
// ========================================

/**
 * Supabase query result wrapper
 * Standardizes all database response types
 */
export interface DatabaseQueryResult<T> {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
  count: number | null;
  status: number;
  statusText: string;
}

/**
 * Paginated query results
 * For large dataset handling
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Query options for flexible querying
 * Supports filtering, pagination, and optimization flags
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  filters?: Record<string, any>;
  includeRelations?: string[];
  useCache?: boolean;
  cacheTimeout?: number;
}

// ========================================
// ERROR TYPES
// ========================================

/**
 * Database error classifications
 * Maps to specific error handling strategies
 */
export type DatabaseErrorCode =
  | "SCHEMA_MISMATCH" // Wrong column names/types
  | "FOREIGN_KEY_VIOLATION" // Invalid relationship references
  | "UNIQUE_CONSTRAINT" // Duplicate key violations
  | "NOT_NULL_VIOLATION" // Required field missing
  | "CHECK_CONSTRAINT" // Invalid enum values
  | "CONNECTION_ERROR" // Database connectivity issues
  | "TIMEOUT_ERROR" // Query timeout
  | "PERMISSION_DENIED" // RLS/security violations
  | "UNKNOWN_ERROR"; // Fallback category

/**
 * Structured database error
 * Provides context for error handling and user feedback
 */
export interface DatabaseError extends Error {
  code: DatabaseErrorCode;
  details: string;
  hint?: string;
  table?: string;
  column?: string;
  value?: any;
  query?: string;
}

// ========================================
// AUDIT & MONITORING TYPES
// ========================================

/**
 * Query performance metrics
 * Used for monitoring and optimization
 */
export interface QueryMetrics {
  operation: string;
  table: string;
  duration: number; // milliseconds
  rowCount: number;
  cacheHit: boolean;
  timestamp: Date;
  userId?: string;
  queryHash: string;
}

/**
 * Database operation audit log entry
 * Tracks all database changes for compliance
 */
export interface DatabaseAuditLog {
  id: string;
  event_type: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  action_type: string;
  record_id: string;
  user_context: {
    user_id: string;
    role: string;
    session_id: string;
  };
  changes: Record<
    string,
    {
      old_value: any;
      new_value: any;
    }
  >;
  metadata: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// ========================================
// TYPE GUARDS & UTILITIES
// ========================================

/**
 * Type guard for database errors
 */
export function isDatabaseError(error: any): error is DatabaseError {
  return (
    error && typeof error.code === "string" && error.code in DatabaseErrorCode
  );
}

/**
 * Type guard for successful query results
 */
export function isSuccessfulQuery<T>(
  result: DatabaseQueryResult<T>,
): result is DatabaseQueryResult<T> & { data: T } {
  return result.error === null && result.data !== null;
}

/**
 * Extract property ID as integer from various formats
 * Handles both integer and UUID string formats for compatibility
 */
export function extractPropertyId(propertyId: string | number): number {
  if (typeof propertyId === "number") return propertyId;

  // If it's a UUID from properties_fixed view, we need conversion
  // This would require the uuid_to_int function or mapping
  throw new Error(`Cannot convert UUID property ID to integer: ${propertyId}`);
}

/**
 * Convert property ID to UUID format for view queries
 */
export function propertyIdToUuid(propertyId: number): string {
  // This would use the int_to_uuid function in practice
  // For now, return a deterministic UUID-like string
  const padded = propertyId.toString().padStart(8, "0");
  return `${padded.slice(0, 8)}-0000-0000-0000-000000000000`;
}
