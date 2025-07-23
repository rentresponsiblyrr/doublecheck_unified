# 📊 STR CERTIFIED DATABASE SCHEMA REFERENCE

**🚨 CRITICAL: This is the AUTHORITATIVE database schema reference. Always consult this document before writing database queries.**

## 🎯 PURPOSE

This document prevents schema mismatches that cause application failures. Every database query MUST match these exact table and field names.

---

## 🏗️ CORE DATABASE TABLES

### **Properties Table**
```sql
Table: properties
Primary Key: id (UUID)
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (NOT property_id) |
| `name` | TEXT | Property name (NOT name) |
| `address` | TEXT | Property address (NOT address) |
| `vrbo_url` | TEXT | VRBO listing URL |
| `airbnb_url` | TEXT | Airbnb listing URL |
| `added_by` | UUID | User who added property (references users.id) |
| `status` | TEXT | Property status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**✅ CORRECT Query Example:**
```typescript
const { data } = await supabase
  .from('properties')
  .select('id, name, address, vrbo_url, airbnb_url')
  .eq('id', propertyId);
```

**❌ WRONG (OLD Schema):**
```typescript
// NEVER USE THESE FIELD NAMES:
.select('property_id, name, address') // ❌ Wrong!
```

### **Inspections Table**
```sql
Table: inspections
Primary Key: id (UUID)
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | Foreign key to properties.id |
| `inspector_id` | UUID | Foreign key to users.id |
| `status` | TEXT | 'draft', 'in_progress', 'completed', 'auditing' |
| `start_time` | TIMESTAMP | Inspection start time |
| `end_time` | TIMESTAMP | Inspection end time |
| `completed` | BOOLEAN | Whether inspection is completed |
| `certification_status` | TEXT | Certification status |
| `auditor_feedback` | TEXT | Auditor feedback |
| `reviewed_at` | TIMESTAMP | Review timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**✅ CORRECT Query Example:**
```typescript
const { data } = await supabase
  .from('inspections')
  .select(`
    id, property_id, inspector_id, status,
    properties!inner(id, name, address)
  `)
  .eq('inspector_id', userId);
```

### **Checklist Items Table**
```sql
Table: checklist_items (NOT logs!)
Primary Key: id (UUID)
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (NOT log_id) |
| `inspection_id` | UUID | Foreign key to inspections.id |
| `label` | TEXT | Item description |
| `category` | TEXT | Item category |
| `status` | TEXT | 'pending', 'completed', 'failed' (NOT pass boolean) |
| `notes` | TEXT | Inspector notes (NOT inspector_remarks) |
| `ai_status` | TEXT | AI analysis result (NOT ai_result) |
| `static_item_id` | UUID | Foreign key to static_safety_items.id |
| `evidence_type` | TEXT | Type of evidence required |
| `source_photo_url` | TEXT | Photo evidence URL |
| `assigned_inspector_id` | UUID | Assigned inspector |
| `created_at` | TIMESTAMP | Creation timestamp |

**✅ CORRECT Query Example:**
```typescript
const { data } = await supabase
  .from('checklist_items')  // ✅ Correct table name
  .select('id, inspection_id, static_item_id, status, notes, ai_status')
  .eq('inspection_id', inspectionId);
```

**❌ WRONG (OLD Schema):**
```typescript
// NEVER USE THESE:
.from('checklist_items')  // ❌ Table doesn't exist!
.select('log_id, pass, inspector_remarks, ai_result')  // ❌ Wrong fields!
```

### **Static Safety Items Table**
```sql
Table: static_safety_items
Primary Key: id (UUID, NOT integer!)
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (UUID, not integer) |
| `checklist_id` | INTEGER | Legacy checklist ID (not used as FK) |
| `label` | TEXT | Item title/description |
| `category` | TEXT | Safety category |
| `evidence_type` | TEXT | 'photo', 'video', 'none' |
| `gpt_prompt` | TEXT | AI prompt for analysis |
| `notes` | TEXT | Additional notes |
| `required` | BOOLEAN | Whether item is mandatory |
| `active_date` | DATE | When item became active |
| `deleted` | BOOLEAN | Soft delete flag |
| `deleted_date` | DATE | Deletion date |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `category_id` | UUID | Category reference |

**✅ CORRECT Relationship Query:**
```typescript
const { data } = await supabase
  .from('checklist_items')
  .select(`
    id, status, notes,
    static_safety_items!static_item_id(id, label, category, evidence_type)
  `)
  .eq('inspection_id', inspectionId);
```

**❌ WRONG Relationships:**
```typescript
// NEVER USE THESE:
static_safety_items!checklist_id(...)  // ❌ checklist_id is not a FK field!
```

### **Users Table**
```sql
Table: users (NOT profiles!)
Primary Key: id (UUID)
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (from auth.users) |
| `name` | TEXT | User's full name (NOT full_name) |
| `email` | TEXT | User's email address |
| `role` | TEXT | 'inspector', 'auditor', 'admin', 'super_admin' |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `status` | TEXT | 'active', 'inactive', 'suspended' |
| `last_login_at` | TIMESTAMP | Last login timestamp |
| `phone` | TEXT | Optional phone number |

---

## 🔗 CORRECT RELATIONSHIP PATTERNS

### **Getting Inspection with Property and Checklist Items:**
```typescript
const { data } = await supabase
  .from('inspections')
  .select(`
    id, property_id, inspector_id, status, created_at,
    properties!inner(id, name, address),
    checklist_items(
      id, status, notes, ai_status,
      static_safety_items!static_item_id(id, label, category, evidence_type)
    )
  `)
  .eq('id', inspectionId);
```

### **Getting Properties with Inspection Counts:**
```typescript
const { data } = await supabase
  .from('properties')
  .select(`
    id, name, address, created_at,
    inspections(id, status)
  `);
```

### **Creating Checklist Item:**
```typescript
const { data } = await supabase
  .from('checklist_items')
  .insert({
    inspection_id: inspectionId,
    static_item_id: staticItemId,
    status: 'pending',
    notes: '',
    ai_status: null
  });
```

---

## 🚨 COMMON MISTAKES TO AVOID

### **❌ WRONG Table Names:**
- `logs` → Use `checklist_items`
- `profiles` → Use `users`

### **❌ WRONG Field Names:**
- `property_id` (in properties) → Use `id`
- `name` → Use `name`
- `address` → Use `address`
- `log_id` → Use `id`
- `pass` → Use `status`
- `inspector_remarks` → Use `notes`
- `ai_result` → Use `ai_status`
- `full_name` → Use `name`

### **❌ WRONG Relationships:**
- `static_safety_items!checklist_id` → Use `static_safety_items!static_item_id`
- `properties!property_id` → Use `properties!inner` (id is implicit)

---

## 🛡️ TYPE DEFINITIONS

### **Correct TypeScript Interfaces:**
```typescript
interface Property {
  id: string;           // ✅ NOT property_id
  name: string;         // ✅ NOT name  
  address: string;      // ✅ NOT address
  vrbo_url?: string;
  airbnb_url?: string;
  added_by: string;
  created_at: string;
}

interface ChecklistItem {
  id: string;              // ✅ NOT log_id
  inspection_id: string;   // ✅ NOT property_id
  static_item_id: string;  // ✅ Correct FK
  status: string;          // ✅ NOT pass boolean
  notes: string;           // ✅ NOT inspector_remarks
  ai_status?: string;      // ✅ NOT ai_result
}

interface User {
  id: string;
  name: string;         // ✅ NOT full_name
  email: string;
  role: string;
}
```

---

## 🧪 TESTING QUERIES

Before deploying any database queries, test them using these patterns:

### **Test Property Query:**
```sql
-- Should return data with correct field names
SELECT id, name, address FROM properties LIMIT 1;
```

### **Test Checklist Items Query:**
```sql
-- Should return data (NOT logs table)
SELECT id, inspection_id, status FROM checklist_items LIMIT 1;
```

### **Test Relationships:**
```sql
-- Test FK relationships exist
SELECT 
  ci.id,
  ci.static_item_id,
  ssi.id as static_id,
  ssi.label
FROM checklist_items ci
LEFT JOIN static_safety_items ssi ON ssi.id = ci.static_item_id
LIMIT 1;
```

---

## 📋 VERIFICATION CHECKLIST

Before writing any database code:

- [ ] ✅ Used correct table names (checklist_items NOT logs)
- [ ] ✅ Used correct field names (id NOT property_id, name NOT name)
- [ ] ✅ Used correct relationships (static_item_id FK to static_safety_items.id)
- [ ] ✅ Tested query in Supabase SQL editor
- [ ] ✅ Updated TypeScript interfaces to match schema
- [ ] ✅ No references to non-existent tables or fields

---

## 🔄 MIGRATION NOTES

**Historical Context:**
This codebase originally used a different schema structure with `logs` table and different field names. All code has been migrated to use the actual production database schema documented above.

**If you see old references:**
- Immediately update to use this schema reference
- Test the updated query in Supabase
- Update related TypeScript interfaces
- Document the change

---

**⚠️ CRITICAL RULE: When in doubt, check this document first, then verify in Supabase Table Editor before writing any database queries.**