# 🚨 CRITICAL DATABASE MIGRATION REQUIRED

## Migration: Filter Completed Properties from Inspector View

### **Issue Fixed:**
- Inspector app was showing multiple inspections per property
- Properties with completed inspections should only appear in audit center
- Inspectors should only see properties available for new inspections

### **Database Changes Required:**

Run this SQL in your Supabase SQL editor to update the `get_properties_with_inspections` function:

```sql
-- Filter completed properties from inspector view
-- This ensures only properties without completed inspections show in the inspector app
-- Properties with completed inspections should go to the audit center instead

CREATE OR REPLACE FUNCTION public.get_properties_with_inspections(_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   property_id uuid, 
   name text, 
   property_address text, 
   property_vrbo_url text, 
   property_airbnb_url text, 
   property_status text, 
   property_created_at timestamp without time zone, 
   inspection_count bigint, 
   completed_inspection_count bigint, 
   active_inspection_count bigint,
   draft_inspection_count bigint,
   latest_inspection_id uuid, 
   latest_inspection_completed boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET statement_timeout TO '5s'
AS $function$
  SELECT 
    p.id as property_id,
    p.name as name,
    p.address as property_address,
    p.vrbo_url as property_vrbo_url,
    p.airbnb_url as property_airbnb_url,
    p.status as property_status,
    p.created_at as property_created_at,
    COALESCE(inspection_stats.total_count, 0) as inspection_count,
    COALESCE(inspection_stats.completed_count, 0) as completed_inspection_count,
    COALESCE(inspection_stats.active_count, 0) as active_inspection_count,
    COALESCE(inspection_stats.draft_count, 0) as draft_inspection_count,
    inspection_stats.latest_id as latest_inspection_id,
    inspection_stats.latest_completed as latest_inspection_completed
  FROM public.properties p
  LEFT JOIN (
    SELECT 
      i.property_id,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE i.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE i.status = 'in_progress') as active_count,
      COUNT(*) FILTER (WHERE i.status = 'draft') as draft_count,
      (array_agg(i.id ORDER BY i.start_time DESC NULLS LAST))[1] as latest_id,
      (array_agg(i.completed ORDER BY i.start_time DESC NULLS LAST))[1] as latest_completed
    FROM public.inspections i
    GROUP BY i.property_id
  ) inspection_stats ON p.id = inspection_stats.property_id
  WHERE p.status = 'active'
    AND (_user_id IS NULL OR p.added_by = _user_id)
    -- CRITICAL FILTER: Exclude properties with completed inspections from inspector view
    -- Properties with completed inspections should only appear in the audit center
    AND (
      inspection_stats.completed_count = 0 OR 
      inspection_stats.completed_count IS NULL OR
      -- Allow properties with failed inspections to be re-inspected
      EXISTS (
        SELECT 1 FROM public.inspections i2 
        WHERE i2.property_id = p.id 
        AND i2.status = 'rejected'
        AND i2.start_time > (
          SELECT MAX(i3.start_time) 
          FROM public.inspections i3 
          WHERE i3.property_id = p.id 
          AND i3.status = 'completed'
        )
      )
    )
  ORDER BY p.created_at DESC;
$function$;

-- Add a comment explaining the business logic
COMMENT ON FUNCTION public.get_properties_with_inspections IS 
'Returns properties available for inspection. Excludes properties with completed inspections unless they have been rejected and need re-inspection. Completed inspections should be processed through the audit center instead of appearing in the inspector interface.';
```

### **Business Logic:**
1. **Inspector App** shows only:
   - Properties with no completed inspections
   - Properties with rejected inspections (allowing re-inspection)

2. **Completed inspections** should:
   - Disappear from inspector app
   - Appear in audit center for AI processing and review
   - Only reappear in inspector app if rejected by auditor

3. **Prevents multiple concurrent inspections per property**

### **After Migration:**
- Properties with completed inspections will no longer show in inspector app
- Inspectors will only see properties available for new inspections
- Completed inspections will be routed to audit center properly

**Run this migration in Supabase SQL editor to fix the multiple inspections issue.**