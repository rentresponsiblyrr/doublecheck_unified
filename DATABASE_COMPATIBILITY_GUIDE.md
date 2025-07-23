# 🗃️ Database Compatibility Layer Guide

## **CRITICAL: NEVER ACCESS BASE TABLES DIRECTLY**

This guide documents the database compatibility layer implemented to bridge the gap between the legacy integer-based schema and the UUID-based application interface.

## **📋 Quick Reference**

### **ALWAYS Use These Tables:**
```typescript
✅ supabase.from('properties_fixed')   // NOT from('properties')
✅ supabase.from('inspections_fixed')  // NOT from('inspections')
```

### **NEVER Use These Tables:**
```typescript
❌ supabase.from('properties')         // Base table - INTEGER IDs
❌ supabase.from('inspections')        // Base table - INTEGER property_ids
```

## **🏗️ Architecture Overview**

### **The Problem**
- **Database Schema**: Uses integer primary keys (`property_id`, `name`)
- **Application Layer**: Expects UUID interfaces (`id`, `name`)
- **Data Inconsistency**: Direct table access causes schema mismatches

### **The Solution: Compatibility Layer**
- **Views**: `properties_fixed` and `inspections_fixed` provide UUID interface
- **Conversion Functions**: `int_to_uuid()` and `uuid_to_int()` handle ID mapping
- **CRUD Triggers**: Enable INSERT/UPDATE/DELETE operations through views
- **RPC Functions**: Secure creation functions with proper parameter handling

## **🛠️ Infrastructure Components**

### **1. UUID Conversion Functions**
```sql
-- Convert integer to UUID (for display)
int_to_uuid(property_id) → '00000000-0000-0000-0000-000000000123'

-- Convert UUID back to integer (for storage)
uuid_to_int('00000000-0000-0000-0000-000000000123') → 123
```

### **2. Properties Compatibility View**
```sql
CREATE VIEW properties_fixed AS
SELECT 
  int_to_uuid(property_id) as id,        -- UUID interface
  name as name,                 -- Renamed for consistency
  listing_url as url,                    -- Renamed for consistency
  airbnb_url,
  vrbo_url,
  scraped_data,
  created_by as added_by,                -- Renamed for consistency
  created_at,
  updated_at,
  scraped_at as scrape_date              -- Renamed for consistency
FROM properties;
```

### **3. Inspections Compatibility View**
```sql
CREATE VIEW inspections_fixed AS
SELECT 
  id,                                    -- Already UUID
  int_to_uuid(property_id) as property_id, -- Convert to UUID
  inspector_id,
  status,
  start_time,
  end_time,
  completed,
  created_at,
  updated_at
FROM inspections;
```

### **4. CRUD Triggers**
- **INSERT**: Automatically converts UUID input to integer for base table
- **UPDATE**: Handles field name mapping and UUID conversion
- **DELETE**: Converts UUID back to integer for deletion

### **5. RPC Functions**
```sql
-- Secure inspection creation with UUID parameters
create_inspection_secure(p_property_id UUID, p_inspector_id UUID)

-- Get properties with inspection counts
get_properties_with_inspections()
```

## **📝 Usage Patterns**

### **Property Operations**
```typescript
// ✅ CORRECT - Fetch properties
const { data: properties } = await supabase
  .from('properties_fixed')
  .select('*');

// ✅ CORRECT - Create property
const { data: newProperty } = await supabase
  .from('properties_fixed')
  .insert({
    name: 'Mountain Retreat',
    url: 'https://example.com/listing',
    added_by: userId
  })
  .single();

// ✅ CORRECT - Update property
const { error } = await supabase
  .from('properties_fixed')
  .update({ name: 'Updated Name' })
  .eq('id', propertyId);  // Use UUID
```

### **Inspection Operations**
```typescript
// ✅ CORRECT - Create inspection (use RPC function)
const { data: inspectionId } = await supabase.rpc('create_inspection_secure', {
  p_property_id: propertyUuid,
  p_inspector_id: userUuid
});

// ✅ CORRECT - Fetch inspections
const { data: inspections } = await supabase
  .from('inspections_fixed')
  .select('*')
  .eq('property_id', propertyUuid);  // Use UUID
```

### **Complex Queries**
```typescript
// ✅ CORRECT - Get properties with inspection counts
const { data: propertiesWithCounts } = await supabase
  .rpc('get_properties_with_inspections');

// ✅ CORRECT - Join operations
const { data: inspectionData } = await supabase
  .from('inspections_fixed')
  .select(`
    *,
    property:properties_fixed(*)
  `)
  .eq('inspector_id', userId);
```

## **🚨 Common Mistakes to Avoid**

### **❌ Direct Base Table Access**
```typescript
// ❌ WRONG - Will cause schema mismatches
const { data } = await supabase.from('properties').select('*');
// Error: Expects 'id' but gets 'property_id'

// ❌ WRONG - Integer/UUID type mismatches  
const { data } = await supabase.from('inspections').select('*');
// Error: property_id is integer, not UUID
```

### **❌ Incorrect Field Names**
```typescript
// ❌ WRONG - Using base table field names
const { data } = await supabase
  .from('properties_fixed')
  .select('property_id, name');  // These don't exist in view

// ✅ CORRECT - Using view field names
const { data } = await supabase
  .from('properties_fixed')
  .select('id, name');
```

### **❌ Manual UUID Conversion**
```typescript
// ❌ WRONG - Manual conversion attempts
const propertyId = `00000000-0000-0000-0000-${intId.toString().padStart(12, '0')}`;

// ✅ CORRECT - Let the database handle it
const { data } = await supabase.from('properties_fixed').select('*');
// UUIDs are automatically provided
```

## **🔧 Troubleshooting**

### **"Column does not exist" Errors**
```
❌ Error: column "property_id" does not exist
✅ Solution: Use 'id' instead (compatibility view maps property_id → id)

❌ Error: column "name" does not exist  
✅ Solution: Use 'name' instead (compatibility view maps name → name)
```

### **"Cannot cast UUID to integer" Errors**
```
❌ Error: cannot cast type uuid to integer
✅ Solution: Use compatibility views instead of base tables
✅ Solution: Use create_inspection_secure() RPC function for creation
```

### **Inspection Creation Failures**
```
❌ Error: RPC function not found
✅ Solution: Ensure create_inspection_secure() function exists in database
✅ Solution: Use compatibility views for all property/inspection operations
```

## **📊 Migration Status**

### **✅ PHASE 4 COMPLETE (Current)**
- [x] Created UUID conversion functions
- [x] Created properties_fixed view with triggers
- [x] Created inspections_fixed view with triggers  
- [x] Created create_inspection_secure RPC function
- [x] Updated 466+ files to use compatibility views
- [x] Documented compatibility layer in CLAUDE.md

### **📋 Maintenance Guidelines**

1. **New Code**: Always use `properties_fixed` and `inspections_fixed`
2. **Code Reviews**: Reject any PR using base table names
3. **Testing**: Verify UUID interfaces work correctly
4. **Documentation**: Update this guide when adding new compatibility functions

## **🎯 Next Development Phases**

With the compatibility layer complete, future development should focus on:
- **Testing**: Verify inspection creation works end-to-end
- **Performance**: Monitor query performance through views
- **Features**: Implement new functionality using compatibility layer
- **Migration**: Eventually migrate base tables to native UUID schema

---

**Remember: The compatibility layer exists to prevent schema mismatches. Always use the `_fixed` views and RPC functions to ensure consistent behavior across the application.**