-- Critical Fix: Inspection Creation "Unknown error" Issue
-- Timestamp: 2025-07-14 16:00:00
-- Description: Fixes inspection creation failures by ensuring static safety items exist and trigger works

-- 1. Ensure static_safety_items table has required data
INSERT INTO public.static_safety_items (
  id,
  label,
  category,
  evidence_type,
  required,
  deleted,
  active_date,
  created_at
) VALUES 
  (gen_random_uuid(), 'Fire Safety Equipment Check', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Smoke Detector Verification', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Carbon Monoxide Detector Check', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Exit Sign Visibility', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Emergency Contact Information', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Kitchen Safety Compliance', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Bathroom Safety Features', 'Safety', 'photo', true, false, CURRENT_DATE, now()),
  (gen_random_uuid(), 'Pool Safety (if applicable)', 'Safety', 'photo', true, false, CURRENT_DATE, now())
ON CONFLICT (label) DO NOTHING;

-- 2. Verify and fix the trigger function with enhanced error handling
CREATE OR REPLACE FUNCTION public.populate_inspection_checklist_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_items_count integer;
  new_items_count integer;
  safety_items_count integer;
BEGIN
  -- Log trigger execution for debugging
  RAISE LOG 'Trigger populate_inspection_checklist_safe called for inspection %', NEW.id;
  
  -- Check if static safety items exist
  SELECT COUNT(*) INTO safety_items_count
  FROM public.static_safety_items 
  WHERE deleted = false 
    AND (active_date IS NULL OR active_date <= CURRENT_DATE)
    AND (deleted_date IS NULL OR deleted_date > CURRENT_DATE)
    AND required = true;
    
  RAISE LOG 'Found % static safety items', safety_items_count;
  
  -- Check if checklist items already exist for this inspection
  SELECT COUNT(*) INTO existing_items_count
  FROM public.checklist_items 
  WHERE inspection_id = NEW.id;
  
  RAISE LOG 'Found % existing checklist items for inspection %', existing_items_count, NEW.id;
  
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
    RAISE LOG 'Duplicate checklist items detected for inspection %, skipping population', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Only proceed if we have static safety items
  IF safety_items_count = 0 THEN
    RAISE LOG 'No static safety items found, cannot populate checklist for inspection %', NEW.id;
    INSERT INTO checklist_operations_audit (
      inspection_id, 
      operation_type, 
      items_affected,
      metadata
    ) VALUES (
      NEW.id, 
      'no_static_items', 
      0,
      jsonb_build_object('message', 'No static safety items found')
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
  
  RAISE LOG 'Successfully created % checklist items for inspection %', new_items_count, NEW.id;
  
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error in populate_inspection_checklist_safe for inspection %: %', NEW.id, SQLERRM;
    INSERT INTO checklist_operations_audit (
      inspection_id, 
      operation_type, 
      items_affected,
      metadata
    ) VALUES (
      NEW.id, 
      'error', 
      0,
      jsonb_build_object('error', SQLERRM, 'sqlstate', SQLSTATE)
    );
    -- Re-raise the error so it's visible to the application
    RAISE;
END;
$$;

-- 3. Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS trigger_populate_inspection_checklist_safe ON public.inspections;
CREATE TRIGGER trigger_populate_inspection_checklist_safe
  AFTER INSERT ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_inspection_checklist_safe();

-- 4. Create a debug function to test inspection creation
CREATE OR REPLACE FUNCTION public.debug_inspection_creation(property_id_param uuid)
RETURNS TABLE(
  step text,
  status text,
  message text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_inspection_id uuid;
  static_items_count integer;
  checklist_items_count integer;
BEGIN
  -- Step 1: Check static safety items
  SELECT COUNT(*) INTO static_items_count
  FROM public.static_safety_items 
  WHERE deleted = false AND required = true;
  
  RETURN QUERY SELECT 
    'static_items_check'::text,
    CASE WHEN static_items_count > 0 THEN 'success' ELSE 'error' END::text,
    format('Found %s static safety items', static_items_count)::text,
    jsonb_build_object('count', static_items_count);
  
  -- Step 2: Test inspection creation
  BEGIN
    INSERT INTO public.inspections (
      property_id,
      start_time,
      completed,
      status,
      inspector_id
    ) VALUES (
      property_id_param,
      now(),
      false,
      'draft',
      null
    ) RETURNING id INTO test_inspection_id;
    
    RETURN QUERY SELECT 
      'inspection_creation'::text,
      'success'::text,
      format('Test inspection created: %s', test_inspection_id)::text,
      jsonb_build_object('inspection_id', test_inspection_id);
      
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        'inspection_creation'::text,
        'error'::text,
        format('Inspection creation failed: %s', SQLERRM)::text,
        jsonb_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
      RETURN;
  END;
  
  -- Step 3: Wait and check checklist items
  PERFORM pg_sleep(0.5);
  
  SELECT COUNT(*) INTO checklist_items_count
  FROM public.checklist_items 
  WHERE inspection_id = test_inspection_id;
  
  RETURN QUERY SELECT 
    'checklist_items_check'::text,
    CASE WHEN checklist_items_count > 0 THEN 'success' ELSE 'error' END::text,
    format('Found %s checklist items created', checklist_items_count)::text,
    jsonb_build_object('count', checklist_items_count, 'inspection_id', test_inspection_id);
  
  -- Step 4: Clean up
  DELETE FROM public.inspections WHERE id = test_inspection_id;
  
  RETURN QUERY SELECT 
    'cleanup'::text,
    'success'::text,
    'Test inspection cleaned up'::text,
    jsonb_build_object('inspection_id', test_inspection_id);
    
END;
$$;

-- 5. Ensure proper permissions are granted
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.static_safety_items TO authenticated;
GRANT ALL ON public.inspections TO authenticated;
GRANT ALL ON public.checklist_items TO authenticated;
GRANT ALL ON public.checklist_operations_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_inspection_creation TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_inspection_checklist_safe TO authenticated;

-- 6. Create a verification query to confirm the fix
CREATE OR REPLACE FUNCTION public.verify_inspection_creation_fix()
RETURNS TABLE(
  component text,
  status text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'static_safety_items' as component, 'available' as status, COUNT(*)
  FROM public.static_safety_items 
  WHERE deleted = false AND required = true
  
  UNION ALL
  
  SELECT 'trigger_function' as component, 
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p 
           JOIN pg_namespace n ON p.pronamespace = n.oid 
           WHERE n.nspname = 'public' AND p.proname = 'populate_inspection_checklist_safe'
         ) THEN 'exists' ELSE 'missing' END as status,
         1
  
  UNION ALL
  
  SELECT 'trigger' as component,
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger t
           JOIN pg_class c ON t.tgrelid = c.oid
           JOIN pg_namespace n ON c.relnamespace = n.oid
           WHERE n.nspname = 'public' AND c.relname = 'inspections' 
           AND t.tgname = 'trigger_populate_inspection_checklist_safe'
         ) THEN 'exists' ELSE 'missing' END as status,
         1;
$$;