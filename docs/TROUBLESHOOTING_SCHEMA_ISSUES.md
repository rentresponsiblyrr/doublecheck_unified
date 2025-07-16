# 🔧 TROUBLESHOOTING SCHEMA ISSUES

## **Overview**

This guide helps diagnose and resolve database schema-related issues in the STR Certified application, particularly those related to the compatibility layer that bridges between application expectations and production database structure.

## **🚨 Common Schema Issues**

### **1. Blank Screens in Admin Portal**

#### **Symptoms:**
- Admin portal loads but shows no data
- Components render but display empty states
- No obvious errors in browser console
- Network requests show 200 status but empty results

#### **Root Cause:**
Application queries are using table names that don't exist in production database.

#### **Diagnosis:**
```typescript
// Open browser console and test direct queries
const testQuery = async () => {
  // This will fail if using wrong table names
  const { data, error } = await supabase
    .from('inspections')  // Wrong table name
    .select('*')
    .limit(1);
  
  console.log('Data:', data);
  console.log('Error:', error);
};

testQuery();
```

#### **Solution:**
1. **Verify compatibility layer is installed:**
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'properties_fixed', 'inspection_checklist_items');
```

2. **Update service layer to use compatibility views:**
```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('inspections_fixed')  // Use compatibility view
  .select('*');

// ❌ WRONG  
const { data } = await supabase
  .from('inspections')  // Table doesn't exist
  .select('*');
```

### **2. "Relation does not exist" Errors**

#### **Symptoms:**
```
ERROR: relation "inspection_checklist_items" does not exist
ERROR: relation "users" does not exist
ERROR: relation "static_safety_items" does not exist
```

#### **Root Cause:**
- Compatibility views not created
- Application using expected table names instead of actual production schema

#### **Diagnosis:**
```sql
-- Check what tables actually exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if compatibility views exist
SELECT table_name, table_type 
FROM information_schema.views 
WHERE table_schema = 'public';
```

#### **Solution:**
1. **Install compatibility layer:**
```sql
-- Run the full migration script
-- File: database_compatibility_migration.sql
```

2. **Verify installation:**
```sql
SELECT 'users' as view_name, COUNT(*) FROM users
UNION ALL
SELECT 'properties_fixed', COUNT(*) FROM properties_fixed;
```

### **3. UUID/Integer Property ID Conflicts**

#### **Symptoms:**
- Property lookups failing
- "Property not found" errors
- Invalid UUID format errors
- Property relationships broken

#### **Root Cause:**
Application expects UUID property IDs but production uses integer `property_id`.

#### **Diagnosis:**
```sql
-- Check actual property ID format
SELECT property_id, property_name FROM properties LIMIT 3;

-- Test UUID conversion
SELECT int_to_uuid(1), uuid_to_int(int_to_uuid(1));
```

#### **Solution:**
1. **Ensure UUID functions exist:**
```sql
-- Should return UUID and integer
SELECT int_to_uuid(1) as uuid_id, uuid_to_int(int_to_uuid(1)) as int_id;
```

2. **Use properties_fixed view:**
```typescript
// ✅ CORRECT - Uses UUID conversion
const { data } = await supabase
  .from('properties_fixed')
  .select('id, name')  // id is converted to UUID
  .eq('id', propertyUuid);

// ❌ WRONG - Direct integer lookup
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('id', propertyUuid);  // Will fail - no 'id' field
```

### **4. Foreign Key Relationship Failures**

#### **Symptoms:**
- Joins returning no results
- Related data not loading
- "Cannot read property" errors in application

#### **Root Cause:**
Foreign key relationships don't match between compatibility views and base tables.

#### **Diagnosis:**
```sql
-- Test relationship queries
SELECT 
  i.id as inspection_id,
  p.name as property_name,
  COUNT(icl.id) as item_count
FROM inspections_fixed i
LEFT JOIN properties_fixed p ON p.id = i.property_id
LEFT JOIN inspection_checklist_items icl ON icl.inspection_session_id = i.id::uuid
GROUP BY i.id, p.name
LIMIT 3;
```

#### **Solution:**
1. **Use proper join syntax with compatibility views:**
```typescript
const { data } = await supabase
  .from('inspections_fixed')
  .select(`
    *,
    properties_fixed!inner (
      id,
      name,
      address
    ),
    inspection_checklist_items!inner (
      *,
      checklist_items_compat!inner (
        title,
        category
      )
    )
  `);
```

## **🔍 Diagnostic Tools**

### **Schema Verification Script**

```sql
-- Complete schema diagnostic
DO $$
DECLARE
    rec RECORD;
    view_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Check compatibility views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_name IN ('users', 'properties_fixed', 'inspection_checklist_items', 'inspections_fixed', 'checklist_items_compat');
    
    RAISE NOTICE 'Compatibility views found: %', view_count;
    
    -- Check functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN ('int_to_uuid', 'uuid_to_int', 'create_inspection_compatibility');
    
    RAISE NOTICE 'Compatibility functions found: %', function_count;
    
    -- Test each view
    FOR rec IN 
        SELECT table_name FROM information_schema.views 
        WHERE table_name IN ('users', 'properties_fixed', 'inspection_checklist_items', 'inspections_fixed', 'checklist_items_compat')
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', rec.table_name) INTO view_count;
        RAISE NOTICE 'View % has % rows', rec.table_name, view_count;
    END LOOP;
    
    -- Test UUID conversion
    RAISE NOTICE 'UUID conversion test: % -> %', 1, int_to_uuid(1);
END $$;
```

### **Application-Level Diagnostics**

```typescript
// Add to your application for debugging
export const diagnosticReport = async () => {
  const report = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test each compatibility view
    const views = ['users', 'properties_fixed', 'inspection_checklist_items', 'inspections_fixed', 'checklist_items_compat'];
    
    for (const view of views) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*')
          .limit(1);
        
        report.tests[view] = {
          status: error ? 'FAIL' : 'PASS',
          error: error?.message,
          hasData: data && data.length > 0
        };
      } catch (err) {
        report.tests[view] = {
          status: 'ERROR',
          error: err.message
        };
      }
    }

    // Test UUID conversion
    try {
      const { data, error } = await supabase
        .rpc('int_to_uuid', { input_int: 1 });
      
      report.tests.uuid_conversion = {
        status: error ? 'FAIL' : 'PASS',
        error: error?.message,
        result: data
      };
    } catch (err) {
      report.tests.uuid_conversion = {
        status: 'ERROR',
        error: err.message
      };
    }

    console.log('Diagnostic Report:', report);
    return report;
  } catch (error) {
    console.error('Diagnostic failed:', error);
    return { error: error.message };
  }
};
```

## **🔧 Quick Fixes**

### **Re-install Compatibility Layer**

```sql
-- Emergency reinstall script
DROP VIEW IF EXISTS users CASCADE;
DROP VIEW IF EXISTS properties_fixed CASCADE;
DROP VIEW IF EXISTS inspection_checklist_items CASCADE;
DROP VIEW IF EXISTS inspections_fixed CASCADE;
DROP VIEW IF EXISTS checklist_items_compat CASCADE;
DROP FUNCTION IF EXISTS int_to_uuid(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS uuid_to_int(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_inspection_compatibility(UUID, UUID, TEXT) CASCADE;

-- Then run full migration script again
```

### **Fix Permission Issues**

```sql
-- Grant all necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Specific grants for compatibility layer
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON properties_fixed TO authenticated;
GRANT SELECT ON inspection_checklist_items TO authenticated;
GRANT SELECT ON inspections_fixed TO authenticated;
GRANT SELECT ON checklist_items_compat TO authenticated;
```

### **Reset RLS Policies**

```sql
-- Remove existing policies
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS properties_select_authenticated ON properties;
DROP POLICY IF EXISTS logs_select_authenticated ON logs;
DROP POLICY IF EXISTS sessions_select_authenticated ON inspection_sessions;

-- Recreate with proper permissions
CREATE POLICY profiles_select_own ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY properties_select_authenticated ON properties FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY logs_select_authenticated ON logs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY sessions_select_authenticated ON inspection_sessions FOR SELECT
USING (auth.role() = 'authenticated');
```

## **📊 Monitoring & Prevention**

### **Health Check Queries**

```sql
-- Run these regularly to monitor compatibility layer
SELECT 
  'Compatibility Health Check' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM users LIMIT 1) THEN 'PASS'
    ELSE 'FAIL'
  END as users_view,
  CASE 
    WHEN EXISTS (SELECT 1 FROM properties_fixed LIMIT 1) THEN 'PASS'
    ELSE 'FAIL'
  END as properties_view,
  CASE 
    WHEN int_to_uuid(1) IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as uuid_functions;
```

### **Automated Monitoring**

```typescript
// Add to application startup
const monitorCompatibilityLayer = async () => {
  const checks = [
    'users',
    'properties_fixed', 
    'inspection_checklist_items',
    'inspections_fixed',
    'checklist_items_compat'
  ];

  for (const view of checks) {
    try {
      const { error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Compatibility layer issue with ${view}:`, error);
        // Send alert to monitoring system
      }
    } catch (err) {
      console.error(`Critical compatibility layer failure with ${view}:`, err);
      // Send critical alert
    }
  }
};

// Run on app startup
monitorCompatibilityLayer();
```

## **🆘 Emergency Procedures**

### **If Compatibility Layer Completely Fails**

1. **Immediate Response:**
```sql
-- Check if base tables still exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('properties', 'logs', 'profiles', 'inspection_sessions', 'checklist');
```

2. **Temporary Direct Access:**
```typescript
// Emergency queries directly to base tables (TEMPORARY ONLY)
const { data: properties } = await supabase
  .from('properties')
  .select('property_id, property_name')
  .limit(10);

const { data: logs } = await supabase
  .from('logs')
  .select('log_id, audit_status, property_id')
  .limit(10);
```

3. **Restore Compatibility Layer:**
- Run complete migration script
- Verify all views and functions
- Test with diagnostic scripts

### **If Data Corruption Suspected**

1. **Backup Current State:**
```sql
-- Export current compatibility layer definitions
pg_dump --schema-only --no-owner --no-privileges your_database > compatibility_backup.sql
```

2. **Validate Data Integrity:**
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM logs l 
LEFT JOIN properties p ON l.property_id = p.property_id 
WHERE p.property_id IS NULL;

-- Check UUID conversion consistency
SELECT property_id, int_to_uuid(property_id), uuid_to_int(int_to_uuid(property_id))
FROM properties LIMIT 10;
```

---

**Last Updated:** July 16, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

**Emergency Contacts:**
- Database Issues: Run diagnostic scripts first
- Application Issues: Check compatibility layer status
- Critical Failures: Re-run migration script