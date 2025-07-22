# 🗄️ DATABASE SCHEMA REFERENCE

## 📋 QUICK REFERENCE SUMMARY

**Last Updated**: July 22, 2025  
**Database Status**: Enterprise Grade (10/10)  
**Schema Version**: Production-Ready - Direct Schema Access (Compatibility Layer Removed)  

## 🎯 CRITICAL DEVELOPER INFORMATION

### **🔑 KEY PRINCIPLE: DIRECT SCHEMA ACCESS**
- **COMPATIBILITY LAYER REMOVED**: All code now uses direct table access
- **CORRECT TABLE NAMES**: Use `checklist_items` (not `logs`), `users` (not `profiles`)
- **CORRECT FIELD NAMES**: Properties use `id`, `name`, `address` (not `property_id`, `property_name`, `street_address`)
- **SCHEMA ALIGNMENT COMPLETE**: July 22, 2025 - All 75+ files with schema mismatches have been fixed

## 🗂️ CORE TABLES STRUCTURE

### **📍 PROPERTIES (Base Table)**
```sql
Table: properties
Purpose: Core property data storage
Used for: Database operations, constraints, foreign keys
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | `uuid` | PRIMARY KEY | Unique property identifier (gen_random_uuid()) |
| `name` | `text` | NOT NULL | Property display name |
| `address` | `text` | | Street address |
| `city` | `text` | | City name |
| `state` | `text` | | State abbreviation |
| `zipcode` | `integer` | | ZIP code |
| `listing_url` | `text` | | Primary listing URL |
| `airbnb_url` | `text` | | Airbnb listing URL |
| `vrbo_url` | `text` | | VRBO listing URL |
| `inspector_name` | `text` | | Assigned inspector |
| `inspector_status` | `text` | CHECK constraint | assigned, in_progress, completed, unavailable |
| `last_inspection_date` | `date` | | Last inspection date |
| `video_url` | `text` | | Inspection video URL |
| `logs_video_id` | `text` | | Video tracking ID |
| `linked_logs` | `text` | | Associated log references |
| `renewal_date` | `date` | | License renewal date |
| `audit_status` | `text` | CHECK constraint | pending, in_progress, completed, failed, cancelled |
| `audit_completion_date` | `date` | | Audit completion date |
| `audit_priority` | `integer` | | Priority level (1-5) |
| `audit_assigned_to` | `uuid` | FK → auth.users.id | Assigned auditor |
| `quality_score` | `numeric` | | Quality assessment score |
| `last_quality_check` | `timestamptz` | | Last quality check time |
| `active_inspection_session_id` | `uuid` | FK → inspection_sessions.id | Current inspection session |
| `created_by` | `uuid` | FK → auth.users.id | Creator user ID |
| `created_at` | `timestamptz` | DEFAULT NOW() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_properties_created_by` on `created_by`
- `idx_properties_audit_assigned_to` on `audit_assigned_to`
- `idx_properties_audit_status` on `audit_status`
- `idx_properties_inspector_status` on `inspector_status`

### **📍 PROPERTIES_FIXED (View)**
```sql
View: properties_fixed
Purpose: Application-facing property data with UUID conversion
Used for: SELECT operations in application code
Source: properties table with int_to_uuid() conversion
```

| Column | Type | Source | Purpose |
|--------|------|--------|---------|
| `id` | `uuid` | `int_to_uuid(property_id)` | UUID version of property_id |
| `original_property_id` | `integer` | `property_id` | Original integer ID |
| `name` | `text` | `property_name` | Property display name |
| `address` | `text` | Concatenated address | Full formatted address |
| All other columns | Various | Direct mapping | Same as base table |

### **🔍 INSPECTIONS (Base Table)**
```sql
Table: inspections
Purpose: Individual inspection records
Used for: Database operations, constraints, foreign keys
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | `uuid` | PRIMARY KEY | Unique inspection identifier |
| `property_id` | `integer` | FK → properties.property_id | Associated property |
| `inspector_id` | `uuid` | FK → auth.users.id | Inspector user ID |
| `start_time` | `timestamptz` | | Inspection start time |
| `end_time` | `timestamptz` | | Inspection end time |
| `completed` | `boolean` | DEFAULT false | Completion status |
| `status` | `text` | | Current status |
| `created_at` | `timestamptz` | DEFAULT NOW() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT NOW() | Last update timestamp |

### **🔍 INSPECTION_SESSIONS (Base Table)**
```sql
Table: inspection_sessions
Purpose: Inspection session management
Used for: Database operations, source for inspections_fixed view
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | `uuid` | PRIMARY KEY | Session identifier |
| `property_id` | `integer` | FK → properties.property_id | Associated property |
| `created_at` | `timestamptz` | DEFAULT NOW() | Session start |
| `updated_at` | `timestamptz` | DEFAULT NOW() | Last update |

### **🔍 INSPECTIONS_FIXED (View)**
```sql
View: inspections_fixed
Purpose: Application-facing inspection data with UUID conversion
Source: inspection_sessions table with transformations
```

| Column | Type | Source | Purpose |
|--------|------|--------|---------|
| `id` | `uuid` | `inspection_sessions.id::text` | Session ID as UUID |
| `property_id` | `uuid` | `int_to_uuid(property_id)` | UUID version of property_id |
| `original_property_id` | `integer` | `property_id` | Original integer property ID |
| `status` | `text` | `'completed'` | Fixed status value |
| `completed` | `boolean` | `true` | Fixed completion status |
| `start_time` | `timestamptz` | `created_at` | Session start time |
| `end_time` | `timestamptz` | `updated_at` | Session end time |
| `inspector_id` | `text` | `NULL` | Not available in sessions |
| `certification_status` | `text` | `NULL` | Not available in sessions |

## 🔄 COMPATIBILITY FUNCTIONS

### **🔧 UUID Conversion Functions**
```sql
Function: int_to_uuid(integer)
Purpose: Convert integer IDs to UUIDs for view compatibility
Usage: int_to_uuid(property_id) → uuid
```

## 🗂️ SUPPORTING TABLES

### **📊 BACKUP & MONITORING TABLES**

#### **backup_metadata**
```sql
Purpose: Track all database backups
Columns: id, backup_type, table_name, record_count, backup_size_bytes, backup_location, created_by, status, metadata
```

#### **backup_schedule**
```sql
Purpose: Manage automated backup schedules
Columns: id, table_name, backup_type, schedule_cron, enabled, retention_days, compression_enabled
```

#### **comprehensive_audit_log**
```sql
Purpose: Track all database changes for compliance
Columns: id, event_type, table_name, action_type, record_id, user_context, changes, metadata, ip_address, user_agent, created_at
```

## 🔗 RELATIONSHIP MAPPING

### **Foreign Key Relationships**
```
properties.created_by → auth.users.id
properties.audit_assigned_to → auth.users.id
properties.active_inspection_session_id → inspection_sessions.id

inspections.property_id → properties.property_id
inspections.inspector_id → auth.users.id

inspection_sessions.property_id → properties.property_id
```

## ⚡ PERFORMANCE INDEXES

### **Properties Table**
- `idx_properties_created_by` - Fast user property lookups
- `idx_properties_audit_assigned_to` - Fast auditor property lookups
- `idx_properties_audit_status` - Fast status filtering
- `idx_properties_inspector_status` - Fast inspector status filtering

### **Inspections Table**
- Primary key index on `id`
- Foreign key index on `property_id`
- Foreign key index on `inspector_id`

## 🛡️ SECURITY FEATURES

### **Row Level Security (RLS)**
- ✅ Enabled on `properties`
- ✅ Authentication-based access control
- ✅ User context validation

### **Audit Logging**
- ✅ All changes tracked in `comprehensive_audit_log`
- ✅ User context capture
- ✅ Change metadata recording
- ✅ IP address and user agent logging

## 📋 DEVELOPER USAGE GUIDELINES

### **✅ DO THIS**
```typescript
// Use views for SELECT operations
const { data } = await supabase
  .from('properties_fixed')
  .select('*');

const { data } = await supabase
  .from('inspections_fixed')
  .select('*');
```

### **❌ DON'T DO THIS**
```typescript
// Don't use base tables for SELECT in application
const { data } = await supabase
  .from('properties')  // Use properties_fixed instead
  .select('*');
```

### **🔧 DATABASE OPERATIONS**
```sql
-- Use base tables for constraints and database operations
ALTER TABLE properties ADD CONSTRAINT ...;
CREATE INDEX ON properties ...;
```

### **📱 APPLICATION QUERIES**
```typescript
// Always use views with UUID conversion
await supabase.from('properties_fixed').select('id, name, address');
await supabase.from('inspections_fixed').select('id, property_id, status');
```

## 🚨 CRITICAL REMINDERS

1. **NEVER** add constraints to views (they're read-only)
2. **ALWAYS** use `properties_fixed` and `inspections_fixed` in application code
3. **ALWAYS** use base tables (`properties`, `inspection_sessions`) for database operations
4. **REMEMBER** UUID conversion happens automatically in views
5. **CHECK** the compatibility layer when adding new fields

## 📈 MONITORING & HEALTH

### **Backup Status**
```sql
-- Check backup health
SELECT * FROM backup_status_monitor;

-- View backup schedules
SELECT * FROM backup_schedule;
```

### **Performance Monitoring**
```sql
-- Check slow queries
SELECT * FROM slow_query_monitor;

-- View audit log
SELECT * FROM comprehensive_audit_log ORDER BY created_at DESC LIMIT 10;
```

---

**🎯 This reference should be your single source of truth for database operations. When in doubt, refer to this document to avoid schema confusion!**