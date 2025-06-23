
-- Phase 1: Database cleanup and investigation

-- Step 1: Create a backup table for investigation
CREATE TABLE IF NOT EXISTS checklist_items_backup AS 
SELECT * FROM checklist_items;

-- Step 2: Identify and analyze duplicates
CREATE OR REPLACE FUNCTION analyze_checklist_duplicates()
RETURNS TABLE(
  inspection_id uuid,
  static_item_id uuid,
  label text,
  duplicate_count bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ci.inspection_id,
    ci.static_item_id,
    ci.label,
    COUNT(*) as duplicate_count
  FROM checklist_items ci
  WHERE ci.static_item_id IS NOT NULL
  GROUP BY ci.inspection_id, ci.static_item_id, ci.label
  HAVING COUNT(*) > 1
  ORDER BY duplicate_count DESC;
$$;

-- Step 3: Create a function to clean up duplicates safely
CREATE OR REPLACE FUNCTION cleanup_duplicate_checklist_items()
RETURNS TABLE(
  inspection_id uuid,
  items_removed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
  items_to_keep uuid[];
  items_removed_count bigint := 0;
BEGIN
  -- For each group of duplicates, keep only the oldest one
  FOR rec IN 
    SELECT 
      ci.inspection_id,
      ci.static_item_id,
      ci.label,
      array_agg(ci.id ORDER BY ci.created_at ASC) as item_ids
    FROM checklist_items ci
    WHERE ci.static_item_id IS NOT NULL
    GROUP BY ci.inspection_id, ci.static_item_id, ci.label
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) item, delete the rest
    DELETE FROM checklist_items 
    WHERE id = ANY(rec.item_ids[2:array_length(rec.item_ids, 1)]);
    
    GET DIAGNOSTICS items_removed_count = ROW_COUNT;
    
    RETURN QUERY SELECT rec.inspection_id, items_removed_count;
  END LOOP;
  
  RETURN;
END;
$$;

-- Step 4: Replace the existing trigger function with a safer version
DROP TRIGGER IF EXISTS trigger_populate_inspection_checklist ON public.inspections;

CREATE OR REPLACE FUNCTION public.populate_inspection_checklist_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_items_count integer;
BEGIN
  -- Check if checklist items already exist for this inspection
  SELECT COUNT(*) INTO existing_items_count
  FROM public.checklist_items 
  WHERE inspection_id = NEW.id;
  
  -- Only populate if no items exist (prevents duplicates from multiple trigger calls)
  IF existing_items_count = 0 THEN
    INSERT INTO public.checklist_items (
      inspection_id,
      label,
      category,
      evidence_type,
      static_item_id,
      created_at
    )
    SELECT 
      NEW.id,
      ssi.label,
      ssi.category,
      ssi.evidence_type,
      ssi.id,
      now()
    FROM public.static_safety_items ssi
    WHERE ssi.deleted = false 
      AND (ssi.active_date IS NULL OR ssi.active_date <= CURRENT_DATE)
      AND (ssi.deleted_date IS NULL OR ssi.deleted_date > CURRENT_DATE)
      AND ssi.required = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Create the new safer trigger
CREATE TRIGGER trigger_populate_inspection_checklist_safe
  AFTER INSERT ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_inspection_checklist_safe();

-- Step 6: Create audit table for tracking checklist operations
CREATE TABLE IF NOT EXISTS checklist_operations_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id uuid NOT NULL,
  operation_type text NOT NULL, -- 'populate', 'cleanup', 'duplicate_detected'
  items_affected integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb
);

-- Step 7: Add logging to the populate function
CREATE OR REPLACE FUNCTION public.populate_inspection_checklist_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_items_count integer;
  new_items_count integer;
BEGIN
  -- Check if checklist items already exist for this inspection
  SELECT COUNT(*) INTO existing_items_count
  FROM public.checklist_items 
  WHERE inspection_id = NEW.id;
  
  -- Log if duplicates are detected
  IF existing_items_count > 0 THEN
    INSERT INTO checklist_operations_audit (
      inspection_id, 
      operation_type, 
      items_affected,
      metadata
    ) VALUES (
      NEW.id, 
      'duplicate_detected', 
      existing_items_count,
      jsonb_build_object('existing_count', existing_items_count)
    );
    RETURN NEW;
  END IF;
  
  -- Populate checklist items
  INSERT INTO public.checklist_items (
    inspection_id,
    label,
    category,
    evidence_type,
    static_item_id,
    created_at
  )
  SELECT 
    NEW.id,
    ssi.label,
    ssi.category,
    ssi.evidence_type,
    ssi.id,
    now()
  FROM public.static_safety_items ssi
  WHERE ssi.deleted = false 
    AND (ssi.active_date IS NULL OR ssi.active_date <= CURRENT_DATE)
    AND (ssi.deleted_date IS NULL OR ssi.deleted_date > CURRENT_DATE)
    AND ssi.required = true;
    
  GET DIAGNOSTICS new_items_count = ROW_COUNT;
  
  -- Log successful population
  INSERT INTO checklist_operations_audit (
    inspection_id, 
    operation_type, 
    items_affected
  ) VALUES (
    NEW.id, 
    'populate', 
    new_items_count
  );

  RETURN NEW;
END;
$$;
