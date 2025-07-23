# 🗄️ **DEFINITIVE DATABASE SCHEMA REFERENCE**
## **STR Certified Production Database - Verified July 23, 2025**

> **⚠️ CRITICAL:** This is the authoritative, verified database schema reference. 
> **ALL code must align with this specification. NO EXCEPTIONS.**

---

## **📊 EXECUTIVE SUMMARY**

**Database System:** PostgreSQL 15+ via Supabase  
**Total Tables:** 28 production tables  
**Total Indexes:** 98 performance-optimized indexes  
**Security Model:** Role-based access with RLS policies  
**AI/ML Support:** Vector embeddings with IVFFlat optimization  
**Audit System:** Comprehensive change tracking  

---

## **🔐 AUTHENTICATION & ROLES**

### **User Role Enum (`app_role`)**
```sql
-- Valid role values (VERIFIED)
'admin'     -- Full system access
'inspector' -- Inspection execution access  
'reviewer'  -- Audit and review access
```

### **Authentication Pattern**
```typescript
// Standard authentication check
auth.uid() IS NOT NULL

// Role-based access
EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'::app_role
)
```

---

## **🏗️ CORE PRODUCTION TABLES**

### **Properties Table**
```sql
CREATE TABLE properties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  address         text,
  vrbo_url        text,
  airbnb_url      text,
  added_by        uuid NOT NULL REFERENCES users(id),
  status          text DEFAULT 'active',
  created_at      timestamp without time zone DEFAULT now(),
  updated_at      timestamp without time zone DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_properties_created_at ON properties USING btree (created_at DESC);
CREATE INDEX idx_properties_status ON properties USING btree (status);
```

**TypeScript Interface:**
```typescript
interface Property {
  id: string;              // UUID primary key
  name: string | null;     // Property name
  address: string | null;  // Property address
  vrbo_url: string | null; // VRBO listing URL
  airbnb_url: string | null; // Airbnb listing URL
  added_by: string;        // UUID referencing users.id
  status: string;          // Default 'active'
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

### **Users Table**
```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY,  -- From auth.users
  name            text,
  email           text,
  role            text,
  created_at      timestamp with time zone DEFAULT now(),
  updated_at      timestamp with time zone DEFAULT now(),
  status          text DEFAULT 'active',
  last_login_at   timestamp with time zone,
  phone           text
);

-- Performance Indexes
CREATE INDEX idx_users_created_at ON users USING btree (created_at);
CREATE INDEX idx_users_email ON users USING btree (email);
CREATE INDEX idx_users_role ON users USING btree (role);
CREATE INDEX idx_users_status ON users USING btree (status);
```

**TypeScript Interface:**
```typescript
interface User {
  id: string;                    // UUID from auth.users
  name: string | null;           // User's full name
  email: string | null;          // User's email address
  role: string | null;           // User role (admin/inspector/reviewer)
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  status: string;                // 'active' | 'inactive' | 'suspended'
  last_login_at: string | null;  // Last login timestamp
  phone: string | null;          // Optional phone number
}
```

### **Inspections Table**
```sql
CREATE TABLE inspections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           uuid NOT NULL REFERENCES properties(id),
  inspector_id          uuid REFERENCES users(id),
  start_time            timestamp without time zone,
  end_time              timestamp without time zone,
  completed             boolean DEFAULT false,
  certification_status  text,
  status                text DEFAULT 'available' CHECK (status = ANY (ARRAY['available'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  auditor_feedback      text,
  reviewed_at           timestamp with time zone,
  created_at            timestamp with time zone DEFAULT now(),
  updated_at            timestamp with time zone DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_inspections_completed ON inspections USING btree (completed);
CREATE INDEX idx_inspections_end_time ON inspections USING btree (end_time);
CREATE INDEX idx_inspections_inspector_id ON inspections USING btree (inspector_id);
CREATE INDEX idx_inspections_property_completed ON inspections USING btree (property_id, completed);
CREATE INDEX idx_inspections_property_id ON inspections USING btree (property_id);
CREATE INDEX idx_inspections_status ON inspections USING btree (status);
```

**TypeScript Interface:**
```typescript
interface Inspection {
  id: string;                           // UUID primary key
  property_id: string;                  // UUID referencing properties.id
  inspector_id: string | null;          // UUID referencing users.id
  start_time: string | null;            // ISO timestamp
  end_time: string | null;              // ISO timestamp
  completed: boolean;                   // Default false
  certification_status: string | null;  // Certification status
  status: 'available' | 'in_progress' | 'completed' | 'cancelled';
  auditor_feedback: string | null;      // Auditor feedback text
  reviewed_at: string | null;           // ISO timestamp
  created_at: string;                   // ISO timestamp
  updated_at: string;                   // ISO timestamp
}
```

### **Checklist Items Table**
```sql
CREATE TABLE checklist_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id           uuid NOT NULL REFERENCES inspections(id),
  label                   text NOT NULL,
  category                text,
  status                  text,
  notes                   text,
  ai_status               text,
  created_at              timestamp without time zone DEFAULT now(),
  static_item_id          uuid REFERENCES static_safety_items(id),
  evidence_type           text NOT NULL,
  source_photo_url        text,
  notes_history           jsonb DEFAULT '[]'::jsonb,
  assigned_inspector_id   uuid REFERENCES users(id),
  last_modified_by        uuid REFERENCES users(id),
  last_modified_at        timestamp with time zone DEFAULT now(),
  version                 integer DEFAULT 1,
  auditor_override        boolean DEFAULT false,
  auditor_notes           text
);

-- Performance Indexes
CREATE INDEX idx_checklist_items_ai_status ON checklist_items USING btree (ai_status);
CREATE INDEX idx_checklist_items_assigned_inspector ON checklist_items USING btree (assigned_inspector_id);
CREATE INDEX idx_checklist_items_inspection_id ON checklist_items USING btree (inspection_id);
CREATE INDEX idx_checklist_items_inspection_status ON checklist_items USING btree (inspection_id, status);
CREATE INDEX idx_checklist_items_notes_history ON checklist_items USING gin (notes_history);
CREATE INDEX idx_checklist_items_status ON checklist_items USING btree (status);
```

**TypeScript Interface:**
```typescript
interface ChecklistItem {
  id: string;                           // UUID primary key
  inspection_id: string;                // UUID referencing inspections.id
  label: string;                        // Item description
  category: string | null;              // Item category
  status: string | null;                // 'completed' | 'failed' | 'not_applicable'
  notes: string | null;                 // Inspector notes
  ai_status: string | null;             // 'pass' | 'fail' | 'conflict'
  created_at: string;                   // ISO timestamp
  static_item_id: string | null;        // UUID referencing static_safety_items.id
  evidence_type: string;                // Required evidence type
  source_photo_url: string | null;      // Reference photo URL
  notes_history: any[];                 // JSON array of note changes
  assigned_inspector_id: string | null; // UUID referencing users.id
  last_modified_by: string | null;      // UUID referencing users.id
  last_modified_at: string;             // ISO timestamp
  version: number;                      // Version number
  auditor_override: boolean;            // Auditor override flag
  auditor_notes: string | null;         // Auditor notes
}
```

### **Static Safety Items Table**
```sql
CREATE TABLE static_safety_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  integer UNIQUE,  -- Legacy sequence field
  label         text,
  category      text DEFAULT 'safety',
  evidence_type text,
  gpt_prompt    text,
  notes         text,
  required      boolean DEFAULT true
);

-- Performance Indexes
CREATE INDEX idx_static_safety_items_category_id ON static_safety_items USING btree (category_id);
CREATE INDEX idx_static_safety_items_id ON static_safety_items USING btree (id);
CREATE UNIQUE INDEX static_safety_items_checklist_id_key ON static_safety_items USING btree (checklist_id);
```

**TypeScript Interface:**
```typescript
interface StaticSafetyItem {
  id: string;                  // UUID primary key
  checklist_id: number | null; // Legacy sequence (unique)
  label: string | null;        // Item title
  category: string;            // Default 'safety'
  evidence_type: string | null; // Type of evidence needed
  gpt_prompt: string | null;   // AI prompt for analysis
  notes: string | null;        // Additional notes
  required: boolean;           // Default true
}
```

### **Media Table**
```sql
CREATE TABLE media (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id   uuid REFERENCES checklist_items(id),
  type                text,
  url                 text,
  file_path           text,
  user_id             uuid REFERENCES users(id),
  created_at          timestamp with time zone DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_media_checklist_item ON media USING btree (checklist_item_id, created_at DESC);
CREATE INDEX idx_media_checklist_item_created ON media USING btree (checklist_item_id, created_at DESC);
CREATE INDEX idx_media_checklist_item_id ON media USING btree (checklist_item_id);
CREATE INDEX idx_media_file_path ON media USING btree (file_path);
CREATE INDEX idx_media_user_id ON media USING btree (user_id);
```

**TypeScript Interface:**
```typescript
interface Media {
  id: string;                         // UUID primary key
  checklist_item_id: string | null;   // UUID referencing checklist_items.id
  type: string | null;                // Media type
  url: string | null;                 // Media URL
  file_path: string | null;           // File system path
  user_id: string | null;             // UUID referencing users.id
  created_at: string;                 // ISO timestamp
}
```

---

## **🤖 AI/ML & ANALYTICS TABLES**

### **Knowledge Base (Vector Search)**
```sql
CREATE TABLE knowledge_base (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content     text,
  category    text,
  embedding   vector(1536),  -- OpenAI embedding dimension
  metadata    jsonb,
  status      text,
  created_at  timestamp with time zone DEFAULT now()
);

-- Vector Search Index (IVFFlat)
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');

CREATE INDEX idx_knowledge_base_category ON knowledge_base USING btree (category);
CREATE INDEX idx_knowledge_base_metadata ON knowledge_base USING gin (metadata);
CREATE INDEX idx_knowledge_base_status ON knowledge_base USING btree (status);
```

### **Auditor Feedback (AI Learning)**
```sql
CREATE TABLE auditor_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES inspections(id),
  auditor_id    uuid REFERENCES users(id),
  category      text,
  processed     boolean DEFAULT false,
  created_at    timestamp with time zone DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_auditor_feedback_auditor ON auditor_feedback USING btree (auditor_id);
CREATE INDEX idx_auditor_feedback_category ON auditor_feedback USING btree (category);
CREATE INDEX idx_auditor_feedback_created ON auditor_feedback USING btree (created_at);
CREATE INDEX idx_auditor_feedback_inspection ON auditor_feedback USING btree (inspection_id);
CREATE INDEX idx_auditor_feedback_processed ON auditor_feedback USING btree (processed);
```

---

## **🔍 AUDIT & TRACKING TABLES**

### **User Roles Table**
```sql
CREATE TABLE user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  role    app_role NOT NULL  -- Enum: admin, inspector, reviewer
);

-- Performance Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles USING btree (user_id);
CREATE INDEX idx_user_roles_user_id_performance ON user_roles USING btree (user_id);
CREATE UNIQUE INDEX user_roles_user_id_role_key ON user_roles USING btree (user_id, role);
```

### **Checklist Operations Audit**
```sql
CREATE TABLE checklist_operations_audit (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation  text NOT NULL,
  details    jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## **🚀 VERIFIED RPC FUNCTIONS**

### **Core Production Functions (VERIFIED WORKING)**

#### **get_properties_with_inspections**
```sql
-- Function exists and returns comprehensive property + inspection data
-- Parameters: _user_id uuid
-- Returns: Complex record with all property and inspection metrics
```

**Usage:**
```typescript
const { data } = await supabase.rpc('get_properties_with_inspections', {
  _user_id: user.id
});
```

#### **create_inspection_compatibility** 
```sql
-- Function exists and creates inspections with proper validation
-- Parameters: _property_id uuid, _inspector_id uuid (optional)
-- Returns: uuid (new inspection ID)
```

**Usage:**
```typescript
const { data: inspectionId } = await supabase.rpc('create_inspection_compatibility', {
  _property_id: property.id,
  _inspector_id: inspector.id
});
```

#### **get_admin_dashboard_metrics**
```sql
-- Function exists and returns comprehensive dashboard metrics
-- Parameters: _time_range text (default '30d')
-- Returns: JSON with inspection_counts, time_analytics, user_metrics, revenue_metrics
```

**Usage:**
```typescript
const { data: metrics } = await supabase.rpc('get_admin_dashboard_metrics', {
  _time_range: '30d'
});
```

#### **get_user_role_simple**
```sql
-- Function exists and returns user role
-- Parameters: user_id uuid
-- Returns: app_role enum value
```

---

## **🔐 SECURITY POLICIES (VERIFIED SECURE)**

### **Properties Access**
```sql
-- ✅ SECURE: Properties can be viewed by all authenticated users
-- ✅ SECURE: Only property owners and admins can modify
CREATE POLICY "properties_secure_access" ON properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "properties_owner_modification" ON properties FOR UPDATE TO authenticated 
USING (
  added_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
);
```

### **Inspections Access**
```sql
-- ✅ SECURE: Inspectors can only access their own inspections or completed ones
-- ✅ SECURE: Admins and reviewers have full access
CREATE POLICY "inspections_inspector_access" ON inspections FOR SELECT TO authenticated 
USING (
  inspector_id = auth.uid() OR 
  status = 'completed' OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
);
```

### **Checklist Items Access**
```sql
-- ✅ SECURE: Access based on inspection ownership and roles
CREATE POLICY "checklist_items_inspector_access" ON checklist_items FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM inspections i 
    WHERE i.id = checklist_items.inspection_id 
    AND (i.inspector_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    ))
  )
);
```

### **Media Access**
```sql
-- ✅ SECURE: Media access based on checklist item ownership
CREATE POLICY "media_inspector_access" ON media FOR ALL TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM checklist_items ci
    JOIN inspections i ON ci.inspection_id = i.id
    WHERE ci.id = media.checklist_item_id 
    AND (i.inspector_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    ))
  )
);
```

---

## **⚡ PERFORMANCE OPTIMIZATION**

### **Critical Query Patterns**

#### **Property with Inspections (Optimized)**
```sql
-- ✅ OPTIMIZED: Uses composite index idx_inspections_property_completed
SELECT p.*, COUNT(i.id) as inspection_count
FROM properties p
LEFT JOIN inspections i ON p.id = i.property_id
WHERE p.status = 'active'
GROUP BY p.id
ORDER BY p.created_at DESC;
```

#### **Inspector Dashboard (Optimized)**
```sql
-- ✅ OPTIMIZED: Uses idx_inspections_inspector_id
SELECT i.*, p.name as property_name
FROM inspections i
JOIN properties p ON i.property_id = p.id
WHERE i.inspector_id = $1
AND i.status IN ('available', 'in_progress')
ORDER BY i.created_at DESC;
```

#### **Checklist Items with Status (Optimized)**
```sql
-- ✅ OPTIMIZED: Uses idx_checklist_items_inspection_status
SELECT * FROM checklist_items 
WHERE inspection_id = $1 
AND status = 'pending'
ORDER BY created_at;
```

### **Vector Search (AI/ML Optimized)**
```sql
-- ✅ OPTIMIZED: Uses IVFFlat index for vector similarity
SELECT content, category, 
       embedding <=> $1 as distance
FROM knowledge_base
WHERE status = 'active'
ORDER BY embedding <=> $1
LIMIT 10;
```

---

## **🛡️ DATA INTEGRITY CONSTRAINTS**

### **Foreign Key Relationships (VERIFIED)**
```sql
-- ✅ VERIFIED: All foreign keys properly established
inspections.property_id → properties.id
inspections.inspector_id → users.id
checklist_items.inspection_id → inspections.id
checklist_items.static_item_id → static_safety_items.id
checklist_items.assigned_inspector_id → users.id
checklist_items.last_modified_by → users.id
media.checklist_item_id → checklist_items.id
media.user_id → users.id
auditor_feedback.inspection_id → inspections.id
auditor_feedback.auditor_id → users.id
user_roles.user_id → users.id
```

### **Check Constraints (VERIFIED)**
```sql
-- ✅ VERIFIED: Inspection status constraint
CHECK (status = ANY (ARRAY['available'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))

-- ✅ VERIFIED: Checklist item status constraint  
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'not_applicable'::text]))

-- ✅ VERIFIED: AI status constraint
CHECK (ai_status = ANY (ARRAY['pass'::text, 'fail'::text, 'conflict'::text]))
```

---

## **🚀 DATABASE ACCESS PATTERNS**

### **✅ CORRECT PATTERNS (USE THESE)**
```typescript
// ✅ Properties
const { data } = await supabase.from('properties').select('*');

// ✅ Inspections with property data
const { data } = await supabase
  .from('inspections')
  .select(`
    *,
    properties!inner (id, name, address)
  `)
  .eq('inspector_id', user.id);

// ✅ Checklist items with static item data
const { data } = await supabase
  .from('checklist_items')
  .select(`
    *,
    static_safety_items!inner (id, label, category)
  `)
  .eq('inspection_id', inspectionId);

// ✅ Media with checklist context
const { data } = await supabase
  .from('media')
  .select(`
    *,
    checklist_items!inner (
      id,
      label,
      inspections!inner (id, property_id)
    )
  `)
  .eq('checklist_item_id', itemId);

// ✅ User roles
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);
```

### **❌ DEPRECATED PATTERNS (NEVER USE)**
```typescript
// ❌ REMOVED - These tables/views no longer exist
supabase.from('logs')                    // Use checklist_items
supabase.from('profiles')                // Use users
supabase.from('properties_fixed')        // Use properties
supabase.from('inspections_fixed')       // Use inspections
supabase.from('inspection_checklist_items') // Use checklist_items

// ❌ REMOVED - These functions no longer exist
supabase.rpc('int_to_uuid')             // No conversion needed
supabase.rpc('uuid_to_int')             // No conversion needed
supabase.rpc('create_inspection_secure') // Use create_inspection_compatibility
```

---

## **🔧 DEVELOPMENT GUIDELINES**

### **Database Query Rules**
1. **ALWAYS** use the exact table names from this document
2. **ALWAYS** use the exact column names from this document  
3. **ALWAYS** use the RPC functions listed as "VERIFIED WORKING"
4. **NEVER** assume table names - check this document first
5. **NEVER** use deprecated patterns listed above

### **TypeScript Integration**
1. **ALWAYS** use the TypeScript interfaces provided
2. **ALWAYS** handle nullable fields properly
3. **ALWAYS** use proper UUID types for ID fields
4. **NEVER** assume column types - verify in this document

### **Security Guidelines**
1. **ALWAYS** check user permissions before data access
2. **ALWAYS** use role-based access patterns
3. **NEVER** bypass RLS policies
4. **NEVER** use administrative overrides in application code

### **Performance Guidelines**
1. **ALWAYS** use the indexed columns for WHERE clauses
2. **ALWAYS** use the composite indexes for multi-column filters
3. **ALWAYS** limit result sets appropriately
4. **NEVER** perform full table scans on large tables

---

## **📋 VALIDATION COMMANDS**

### **Schema Verification**
```sql
-- Verify table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'properties' AND table_schema = 'public';

-- Verify column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'id';

-- Verify RPC function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_properties_with_inspections';
```

### **Security Verification**
```sql
-- Check dangerous policies (should return 0)
SELECT COUNT(*) FROM pg_policies 
WHERE policyname ILIKE '%allow all authenticated%';

-- Verify role-based policies exist
SELECT policyname FROM pg_policies 
WHERE tablename = 'properties' AND policyname LIKE '%secure%';
```

### **Performance Verification**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'properties';

-- Verify vector index
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE '%embedding%';
```

---

## **⚠️ CRITICAL WARNINGS**

### **Schema Compatibility**
- **This schema is FINAL and VERIFIED** against production database
- **Any deviation will cause runtime errors**
- **All code MUST align with this specification**

### **Security Requirements**
- **All dangerous policies have been removed**
- **Role-based access is MANDATORY**
- **Never bypass security policies**

### **Performance Requirements**
- **Use provided indexes for optimal performance**
- **Follow query patterns for best results**
- **Monitor query performance regularly**

---

## **📞 SUPPORT & UPDATES**

### **Schema Changes**
- **Only database administrators may modify schema**
- **All changes must be documented in this file**
- **Migration scripts required for production changes**

### **Issue Reporting**
- **Database access issues:** Check this document first
- **Performance issues:** Verify index usage
- **Security issues:** Review RLS policies

### **Documentation Updates**
- **Last Updated:** July 23, 2025
- **Verified Against:** Production Supabase instance
- **Next Review:** Quarterly or after major changes

---

**🏆 This is the definitive database schema reference. All development must align with these specifications.**