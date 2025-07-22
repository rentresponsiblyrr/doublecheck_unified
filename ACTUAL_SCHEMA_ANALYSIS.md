# ACTUAL SCHEMA ANALYSIS - CRITICAL CORRECTIONS REQUIRED

## 🚨 MAJOR SCHEMA MISMATCHES DISCOVERED

Based on the actual Supabase schema, our codebase has **fundamental misalignments** that need immediate correction.

## ACTUAL SCHEMA STRUCTURE

### ✅ PROPERTIES TABLE (Correct Structure)
```sql
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),           -- ❌ We used: property_id (number)
  name text,                                           -- ❌ We used: property_name
  address text,                                        -- ❌ We used: street_address
  vrbo_url text,                                       -- ✅ Correct
  added_by uuid NOT NULL,                              -- ❌ We used: created_by
  status text DEFAULT 'active'::text,                  -- ✅ Correct
  created_at timestamp without time zone DEFAULT now(), -- ✅ Correct
  airbnb_url text,                                     -- ✅ Correct
  updated_at timestamp without time zone DEFAULT now()  -- ✅ Correct
);
```

### ✅ INSPECTIONS TABLE (Correct Structure)
```sql
CREATE TABLE public.inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),          -- ✅ Correct
  property_id uuid NOT NULL,                           -- ✅ Correct (but should be uuid, not string)
  inspector_id uuid,                                   -- ✅ Correct
  start_time timestamp without time zone,              -- ✅ Correct
  end_time timestamp without time zone,                -- ✅ Correct
  completed boolean DEFAULT false,                     -- ❌ We avoided this column (was correct to avoid)
  certification_status text,                           -- ✅ Correct
  status text DEFAULT 'available'::text,               -- ✅ Correct
  auditor_feedback text,                               -- ✅ Correct
  reviewed_at timestamp with time zone,                -- ✅ Correct
  created_at timestamp with time zone DEFAULT now(),   -- ✅ Correct
  updated_at timestamp with time zone DEFAULT now()    -- ✅ Correct
);
```

### 🚨 CRITICAL: CHECKLIST_ITEMS TABLE (We Used Wrong Table!)
```sql
CREATE TABLE public.checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),          -- ❌ We used: logs.log_id (number)
  inspection_id uuid NOT NULL,                         -- ✅ This is the correct relationship!
  label text NOT NULL,                                 -- ✅ Correct
  category text,                                       -- ✅ Correct
  status text CHECK (status IS NULL OR (status = ANY (ARRAY['completed'::text, 'failed'::text, 'not_applicable'::text]))),
  notes text,                                          -- ✅ Correct
  ai_status text CHECK (ai_status = ANY (ARRAY['pass'::text, 'fail'::text, 'conflict'::text])),
  created_at timestamp without time zone DEFAULT now(), -- ✅ Correct
  static_item_id uuid,                                 -- ✅ This is the FK to static_safety_items!
  evidence_type text NOT NULL,                         -- ✅ Correct
  source_photo_url text,                               -- ✅ Correct
  -- ... other fields
);
```

### ✅ STATIC_SAFETY_ITEMS TABLE (Partially Correct)
```sql
CREATE TABLE public.static_safety_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),          -- ✅ Correct (UUID)
  checklist_id integer NOT NULL DEFAULT nextval(...),  -- ❌ This is NOT the FK field!
  label text NOT NULL,                                 -- ✅ Correct
  category text DEFAULT 'safety'::text,                -- ✅ Correct
  evidence_type text NOT NULL,                         -- ✅ Correct
  gpt_prompt text,                                     -- ✅ Correct
  notes text,                                          -- ✅ Correct
  required boolean DEFAULT true,                       -- ✅ Correct
  -- ... other fields
);
```

### ✅ MEDIA TABLE (Correct Relationship)
```sql
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  checklist_item_id uuid NOT NULL,                     -- ✅ Points to checklist_items, not logs!
  type text NOT NULL,
  url text,
  -- ... other fields
  CONSTRAINT media_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES public.checklist_items(id)
);
```

## RELATIONSHIP CORRECTIONS NEEDED

### ❌ WRONG RELATIONSHIPS (What We Implemented)
```sql
-- We implemented these incorrect relationships:
logs.property_id → properties.property_id     -- logs table doesn't exist!
logs.checklist_id → static_safety_items.id    -- Wrong foreign key reference!
```

### ✅ CORRECT RELATIONSHIPS (Actual Schema)
```sql
-- Correct relationships:
inspections.property_id → properties.id                    -- UUID to UUID
checklist_items.inspection_id → inspections.id             -- UUID to UUID  
checklist_items.static_item_id → static_safety_items.id    -- UUID to UUID
media.checklist_item_id → checklist_items.id               -- UUID to UUID
```

## CRITICAL FIXES REQUIRED

### 1. **Replace All `logs` References with `checklist_items`**
```typescript
// ❌ WRONG (Current Implementation):
const { data } = await supabase
  .from('logs')
  .select('*')
  .eq('property_id', propertyId);

// ✅ CORRECT (Required Fix):
const { data } = await supabase
  .from('checklist_items')
  .select('*')
  .eq('inspection_id', inspectionId);
```

### 2. **Fix Properties Table Column Names**
```typescript
// ❌ WRONG (Current Implementation):
.select('property_id, property_name, street_address')

// ✅ CORRECT (Required Fix):
.select('id, name, address')
```

### 3. **Fix Static Safety Items Relationship**
```typescript
// ❌ WRONG (Current Implementation):
.select('*, static_safety_items!checklist_id(*)')

// ✅ CORRECT (Required Fix):
.select('*, static_safety_items!static_item_id(*)')
```

### 4. **Fix Query Patterns**
```typescript
// ❌ WRONG Pattern (Property-based queries):
// Get checklist items by property_id
const { data } = await supabase
  .from('logs')
  .eq('property_id', propertyId);

// ✅ CORRECT Pattern (Inspection-based queries):
// Get checklist items by inspection_id
const { data } = await supabase
  .from('checklist_items')
  .eq('inspection_id', inspectionId);
```

## FILES REQUIRING MAJOR CORRECTIONS

All of these service files need complete rewriting:

1. ✅ `src/services/inspection/InspectionDataService.ts`
2. ✅ `src/services/inspection/PropertyDataService.ts`
3. ✅ `src/services/inspection/QueryBuilder.ts`
4. ✅ `src/services/inspection/ChecklistDataService.ts`
5. ✅ `src/services/inspectionService.ts`
6. ✅ `src/services/AtomicInspectionService.ts`
7. ✅ `src/services/core/DatabaseService.ts`
8. ✅ `src/services/UnifiedDatabaseService.ts`
9. ✅ All previously "fixed" files need unfixing!

## IMPACT ASSESSMENT

### 🚨 SEVERITY: CRITICAL
- **Database Foundation**: Completely wrong
- **All Previous Fixes**: Based on incorrect schema
- **Service Layer**: Needs complete rewrite
- **Query Patterns**: Fundamentally incorrect
- **Relationships**: Using non-existent tables

### 📊 SCOPE OF CORRECTIONS
- **Table Names**: `logs` → `checklist_items` everywhere
- **Column Names**: Properties table field mapping
- **Foreign Keys**: Relationship patterns completely different
- **Query Logic**: Inspection-based instead of property-based

## NEXT STEPS

1. **Update CLAUDE.md** with correct schema documentation
2. **Rewrite all service files** to use `checklist_items` instead of `logs`
3. **Fix property column references** throughout codebase
4. **Update relationship syntax** to use correct foreign keys
5. **Test all database queries** with actual schema
6. **Verify TypeScript types** match real schema

## LESSONS LEARNED

1. **Never assume schema** - always verify with actual database
2. **Documentation can be wrong** - CLAUDE.md was completely incorrect
3. **Browser console verification** was the right approach - I gave up too early
4. **Runtime verification** is mandatory for database work

This discovery shows why the user was right to insist on proper verification! 🎯