
-- Step 1: Remove the old check constraint that's causing issues
ALTER TABLE public.checklist_items DROP CONSTRAINT IF EXISTS checklist_items_category_check;

-- Step 2: Also remove any check constraint on static_safety_items
ALTER TABLE public.static_safety_items DROP CONSTRAINT IF EXISTS static_safety_items_category_check;

-- Step 3: Verify our triggers are working correctly by recreating them
DROP TRIGGER IF EXISTS trigger_validate_checklist_category ON public.checklist_items;
DROP TRIGGER IF EXISTS trigger_validate_static_category ON public.static_safety_items;

-- Recreate the triggers to ensure they're active
CREATE TRIGGER trigger_validate_checklist_category
  BEFORE INSERT OR UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_checklist_category();

CREATE TRIGGER trigger_validate_static_category
  BEFORE INSERT OR UPDATE ON public.static_safety_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_checklist_category();

-- Step 4: Clean up any existing invalid data
UPDATE public.checklist_items 
SET category = public.validate_and_map_category(category)
WHERE category NOT IN (SELECT name FROM public.categories WHERE is_active = true);

UPDATE public.static_safety_items 
SET category = public.validate_and_map_category(category)
WHERE category NOT IN (SELECT name FROM public.categories WHERE is_active = true);

-- Step 5: Add some debug logging to help track issues
CREATE OR REPLACE FUNCTION public.debug_category_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log category validation attempts
  RAISE LOG 'Category validation: input=%, mapped=%', 
    COALESCE(NEW.category, 'NULL'), 
    public.validate_and_map_category(NEW.category);
  
  -- Apply the validation
  NEW.category := public.validate_and_map_category(NEW.category);
  RETURN NEW;
END;
$$;

-- Replace the auto-validate function with the debug version temporarily
DROP TRIGGER IF EXISTS trigger_validate_checklist_category ON public.checklist_items;
CREATE TRIGGER trigger_validate_checklist_category
  BEFORE INSERT OR UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.debug_category_validation();
