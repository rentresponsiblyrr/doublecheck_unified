
-- Step 1: First, let's see what categories are actually being used in static_safety_items
-- and update the categories table to include them

-- Insert missing categories that exist in static_safety_items but not in categories
INSERT INTO public.categories (name, description, color_class, icon_name, sort_order)
SELECT DISTINCT 
  ssi.category as name,
  CASE 
    WHEN ssi.category = 'amenities' THEN 'Property amenities and features'
    WHEN ssi.category = 'accessibility' THEN 'Accessibility features and compliance'
    WHEN ssi.category = 'accuracy' THEN 'Listing accuracy verification'
    ELSE 'Safety and security items'
  END as description,
  CASE 
    WHEN ssi.category = 'amenities' THEN 'bg-blue-100 text-blue-800 border-blue-200'
    WHEN ssi.category = 'accessibility' THEN 'bg-purple-100 text-purple-800 border-purple-200'
    WHEN ssi.category = 'accuracy' THEN 'bg-orange-100 text-orange-800 border-orange-200'
    ELSE 'bg-red-100 text-red-800 border-red-200'
  END as color_class,
  CASE 
    WHEN ssi.category = 'amenities' THEN 'Camera'
    WHEN ssi.category = 'accessibility' THEN 'Users'
    WHEN ssi.category = 'accuracy' THEN 'CheckCircle'
    ELSE 'AlertTriangle'
  END as icon_name,
  CASE 
    WHEN ssi.category = 'safety' THEN 1
    WHEN ssi.category = 'accessibility' THEN 2
    WHEN ssi.category = 'amenities' THEN 3
    WHEN ssi.category = 'cleanliness' THEN 4
    WHEN ssi.category = 'accuracy' THEN 5
    ELSE 99
  END as sort_order
FROM public.static_safety_items ssi
WHERE ssi.category IS NOT NULL 
  AND ssi.category NOT IN (SELECT name FROM public.categories)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update static_safety_items to use valid categories
-- Map any invalid categories to 'safety' as a fallback
UPDATE public.static_safety_items 
SET category = 'safety'
WHERE category IS NULL 
   OR category NOT IN (SELECT name FROM public.categories WHERE is_active = true);

-- Step 3: Remove the old foreign key constraint and recreate it as DEFERRABLE
ALTER TABLE public.checklist_items 
DROP CONSTRAINT IF EXISTS fk_checklist_items_category;

ALTER TABLE public.checklist_items 
ADD CONSTRAINT fk_checklist_items_category 
FOREIGN KEY (category) REFERENCES public.categories(name)
ON UPDATE CASCADE ON DELETE RESTRICT
DEFERRABLE INITIALLY DEFERRED;

-- Step 4: Remove the old foreign key constraint from static_safety_items and recreate it as DEFERRABLE
ALTER TABLE public.static_safety_items 
DROP CONSTRAINT IF EXISTS fk_static_safety_items_category;

ALTER TABLE public.static_safety_items 
ADD CONSTRAINT fk_static_safety_items_category 
FOREIGN KEY (category) REFERENCES public.categories(name)
ON UPDATE CASCADE ON DELETE RESTRICT
DEFERRABLE INITIALLY DEFERRED;

-- Step 5: Update any existing checklist_items with invalid categories
UPDATE public.checklist_items 
SET category = 'safety'
WHERE category IS NULL 
   OR category NOT IN (SELECT name FROM public.categories WHERE is_active = true);

-- Step 6: Create a function to validate and map categories dynamically
CREATE OR REPLACE FUNCTION public.validate_and_map_category(input_category TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Return null if input is null or empty
  IF input_category IS NULL OR trim(input_category) = '' THEN
    RETURN 'safety';
  END IF;
  
  -- Check if the category exists in the categories table
  IF EXISTS (SELECT 1 FROM public.categories WHERE name = input_category AND is_active = true) THEN
    RETURN input_category;
  END IF;
  
  -- Try case-insensitive match
  DECLARE
    matched_category TEXT;
  BEGIN
    SELECT name INTO matched_category 
    FROM public.categories 
    WHERE LOWER(name) = LOWER(input_category) 
      AND is_active = true 
    LIMIT 1;
    
    IF matched_category IS NOT NULL THEN
      RETURN matched_category;
    END IF;
  END;
  
  -- Default fallback
  RETURN 'safety';
END;
$$;

-- Step 7: Create a trigger to auto-validate categories on insert/update
CREATE OR REPLACE FUNCTION public.auto_validate_checklist_category()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-correct the category if needed
  NEW.category := public.validate_and_map_category(NEW.category);
  RETURN NEW;
END;
$$;

-- Create the trigger for checklist_items
DROP TRIGGER IF EXISTS trigger_validate_checklist_category ON public.checklist_items;
CREATE TRIGGER trigger_validate_checklist_category
  BEFORE INSERT OR UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_checklist_category();

-- Create the trigger for static_safety_items
DROP TRIGGER IF EXISTS trigger_validate_static_category ON public.static_safety_items;
CREATE TRIGGER trigger_validate_static_category
  BEFORE INSERT OR UPDATE ON public.static_safety_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_checklist_category();
