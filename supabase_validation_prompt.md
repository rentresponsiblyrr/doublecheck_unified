# Supabase AI Database Schema Validation Prompt

## Context
I'm debugging blank screen issues in an admin portal and need to validate my assumptions about the database schema and table relationships against the actual codebase.

## Please analyze the following and validate/correct my assumptions:

### 1. TABLE STRUCTURE VALIDATION
**My Assumption**: The primary tables are:
- `users` (main user management)
- `properties` (property data)
- `inspections` (inspection records)
- `inspection_checklist_items` (individual checklist items)
- `static_safety_items` (template checklist items)

**Questions**:
- Are these the correct table names?
- Is there a `profiles` table that I should be using instead of or alongside `users`?
- What's the relationship between `static_safety_items` and `inspection_checklist_items`?

### 2. FOREIGN KEY RELATIONSHIPS
**My Assumption**: Key relationships are:
- `inspections.property_id → properties.id`
- `inspections.inspector_id → users.id`
- `inspection_checklist_items.inspection_id → inspections.id`
- `inspection_checklist_items.static_safety_item_id → static_safety_items.id`

**Questions**:
- Are these foreign key relationships correct?
- Should `inspector_id` reference `users.id` or `profiles.id`?
- Is there a table called `inspection_checklist_items` that I should be using?

### 3. USER MANAGEMENT SCHEMA
**My Assumption**: User data is stored in:
- `auth.users` (Supabase auth)
- `public.users` (custom profile data with roles)

**Questions**:
- Is there a separate `profiles` table?
- Where are user roles stored (`users.role` or `profiles.role`)?
- What's the relationship between `auth.users` and `public.users`?

### 4. INSPECTION WORKFLOW SCHEMA
**My Assumption**: Inspection flow is:
- Create inspection → Generate checklist items → Inspector fills items → Complete inspection

**Questions**:
- Are checklist items created in `inspection_checklist_items` table?
- Is there a trigger that auto-populates checklist items from `static_safety_items`?
- What table stores the actual inspection responses/evidence?

### 5. QUERY PATTERNS I'M SEEING
**Patterns I found in code**:
```sql
-- Pattern 1: Direct table queries
SELECT * FROM users WHERE id = ?

-- Pattern 2: Join queries
SELECT i.*, p.name, u.email 
FROM inspections i 
JOIN properties p ON i.property_id = p.id 
JOIN users u ON i.inspector_id = u.id

-- Pattern 3: RPC function calls
SELECT * FROM get_properties_with_inspections()
```

**Questions**:
- Are these query patterns correct for the current schema?
- Should I be using `users` or `profiles` in joins?
- Are there specific RPC functions I should be using instead of direct queries?

### 6. RECENT SCHEMA CHANGES
**I found references to**:
- `inspection_checklist_items` table in recent code
- Migration files suggesting schema evolution
- References to both `checklist_items` and `inspection_checklist_items`

**Questions**:
- Has the schema recently changed from `checklist_items` to `inspection_checklist_items`? (CONFIRMED - table is now inspection_checklist_items)
- Are there any deprecated tables I should avoid?
- What's the current recommended way to query inspection checklist data?

### 7. ROW LEVEL SECURITY (RLS)
**My Assumption**: RLS policies control access to:
- Users can only see their own inspections
- Admins can see all data
- Inspectors can only see assigned properties

**Questions**:
- Are RLS policies causing data access issues?
- What's the correct way to query data as an admin user?
- Are there any RLS policies that might cause empty result sets?

### 8. SPECIFIC CODE PATTERNS I'M QUESTIONING
**Pattern 1**: In `SimpleAuditorDashboard.tsx`
```typescript
profiles:inspector_id (id, email, user_metadata)
```
Should this be `users:inspector_id`?

**Pattern 2**: In `useUserManagement.ts`
```typescript
.from('profiles').select('id, email, role')
```
Should this be `.from('users')`?

**Pattern 3**: In mobile optimizer
```typescript
.from('inspection_checklist_items')
```
Is this the correct table for checklist items?

### 9. FUNCTIONS AND PROCEDURES
**Questions**:
- What RPC functions exist for admin operations?
- Is there a `get_properties_with_inspections()` function?
- Are there any stored procedures for inspection creation?

### 10. MEDIA AND STORAGE
**Questions**:
- How is inspection evidence (photos/videos) stored?
- Is there a `media` table linked to checklist items?
- What's the storage bucket configuration?

## Please provide:
1. **Corrected table names and relationships**
2. **Proper query patterns for admin operations**
3. **Any schema changes I should be aware of**
4. **Common pitfalls that cause empty result sets**
5. **Recommended patterns for the admin portal**

## Current Issues I'm Debugging:
- Admin portal showing blank screens
- Database queries returning empty results
- Authentication issues with data access
- Inconsistent table references in codebase