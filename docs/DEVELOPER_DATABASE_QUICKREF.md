# 🚀 DEVELOPER DATABASE QUICK REFERENCE

## ⚡ INSTANT ANSWERS

**Last Updated**: July 17, 2025  
**Database Status**: Enterprise Ready (9.4/10)  

## 🎯 MOST COMMON QUESTIONS

### ❓ "Which table name should I use?"
- **Application Code**: Use `properties_fixed` and `inspections_fixed` (views with UUIDs)
- **Database Operations**: Use `properties` and `inspection_sessions` (base tables)

### ❓ "Why do I get UUID errors?"
- You're probably using base tables instead of views
- **Fix**: Change `properties` → `properties_fixed`, `inspections` → `inspections_fixed`

### ❓ "Where are my inspections stored?"
- **Data Source**: `inspection_sessions` table (base data)
- **Application Access**: `inspections_fixed` view (UUID-converted)

## 🔧 COPY-PASTE CODE PATTERNS

### **📋 Standard Property Query**
```typescript
// ✅ CORRECT - Use the view
const { data: properties } = await supabase
  .from('properties_fixed')
  .select(`
    id,
    name,
    address,
    audit_status,
    inspector_status,
    created_at
  `);
```

### **📋 Standard Inspection Query**
```typescript
// ✅ CORRECT - Use the view
const { data: inspections } = await supabase
  .from('inspections_fixed')
  .select(`
    id,
    property_id,
    status,
    completed,
    start_time,
    end_time
  `);
```

### **📋 Property with Inspections Query**
```typescript
// ✅ CORRECT - Join views
const { data } = await supabase
  .from('properties_fixed')
  .select(`
    id,
    name,
    address,
    audit_status,
    inspections_fixed (
      id,
      status,
      completed,
      start_time
    )
  `);
```

### **📋 Insert Property (Use Function)**
```typescript
// ✅ CORRECT - Use the helper function
const { data, error } = await supabase
  .rpc('get_properties_with_inspections', {
    _user_id: user.id
  });
```

## 🚨 COMMON ERRORS & FIXES

### **Error: "relation 'properties' does not exist"**
```typescript
// ❌ WRONG
const { data } = await supabase.from('properties').select('*');

// ✅ FIXED
const { data } = await supabase.from('properties_fixed').select('*');
```

### **Error: "column 'id' does not exist"**
```typescript
// ❌ WRONG - Using base table which has 'property_id'
const { data } = await supabase
  .from('properties')
  .select('id');

// ✅ FIXED - Use view which has 'id' (UUID converted)
const { data } = await supabase
  .from('properties_fixed')
  .select('id');
```

### **Error: "foreign key constraint failed"**
```typescript
// ❌ WRONG - Trying to use UUID with integer foreign key
const { data } = await supabase
  .from('inspections')
  .insert({ property_id: uuidValue });

// ✅ FIXED - Use the helper function or correct ID type
const { data } = await supabase
  .from('inspection_sessions')
  .insert({ property_id: integerValue });
```

## 📊 TABLE CHEAT SHEET

| What You Want | Use This Table/View | ID Type | Purpose |
|---------------|-------------------|---------|---------|
| List properties | `properties_fixed` | UUID | App display |
| List inspections | `inspections_fixed` | UUID | App display |
| Create property constraint | `properties` | integer | Database ops |
| Create inspection session | `inspection_sessions` | integer | Database ops |
| Backup properties | `properties` | integer | Backup target |
| Backup inspections | `inspection_sessions` | integer | Backup target |

## 🔗 RELATIONSHIP QUICK REFERENCE

### **Property → Inspections**
```typescript
// Get property with all its inspections
const { data } = await supabase
  .from('properties_fixed')
  .select(`
    id,
    name,
    inspections_fixed (*)
  `)
  .eq('id', propertyId);
```

### **User → Properties**
```typescript
// Get properties created by user
const { data } = await supabase
  .from('properties_fixed')
  .select('*')
  .eq('created_by', userId);
```

### **Auditor → Assigned Properties**
```typescript
// Get properties assigned to auditor
const { data } = await supabase
  .from('properties_fixed')
  .select('*')
  .eq('audit_assigned_to', auditorId);
```

## ⚡ PERFORMANCE TIPS

### **✅ DO: Use Specific Selects**
```typescript
// Good - only select what you need
.select('id, name, audit_status')
```

### **❌ DON'T: Select Everything**
```typescript
// Bad - wasteful
.select('*')
```

### **✅ DO: Use Indexes**
```typescript
// Good - these fields are indexed
.eq('audit_status', 'pending')
.eq('inspector_status', 'assigned')
.eq('created_by', userId)
```

## 🛡️ SECURITY REMINDERS

### **Row Level Security (RLS)**
- ✅ Automatically enforced on all queries
- ✅ Users only see their authorized data
- ✅ No additional security code needed

### **Audit Logging**
- ✅ All changes automatically logged
- ✅ User context captured
- ✅ View logs: `SELECT * FROM comprehensive_audit_log`

## 🔄 BACKUP STATUS CHECK

```typescript
// Check if backups are healthy
const { data } = await supabase
  .from('backup_status_monitor')
  .select('*');

// View backup schedule
const { data } = await supabase
  .from('backup_schedule')
  .select('*');
```

## 🆘 TROUBLESHOOTING STEPS

### **1. Schema Issues**
```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'your_table_name';

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table_name';
```

### **2. Permission Issues**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

### **3. Constraint Issues**
```sql
-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'your_table_name';
```

## 📞 EMERGENCY CONTACTS

### **Database Issues**
1. Check this document first
2. Review `/docs/DATABASE_SCHEMA_REFERENCE.md`
3. Check `/DATABASE_ENTERPRISE_TRANSFORMATION_SUMMARY.md`
4. Review recent migration files in `/supabase/migrations/`

### **Performance Issues**
```sql
-- Check slow queries
SELECT * FROM slow_query_monitor;

-- Check backup performance
SELECT * FROM backup_status_monitor;
```

## 🎯 DEVELOPMENT WORKFLOW

### **Starting New Feature**
1. ✅ Check which table/view to use (this document)
2. ✅ Use `properties_fixed` and `inspections_fixed` for queries
3. ✅ Test with real data
4. ✅ Check RLS permissions work correctly

### **Database Changes**
1. ✅ Create migration file in `/supabase/migrations/`
2. ✅ Test thoroughly in development
3. ✅ Update this documentation
4. ✅ Apply to production

---

**🚀 Bookmark this page! It answers 90% of daily database questions.**