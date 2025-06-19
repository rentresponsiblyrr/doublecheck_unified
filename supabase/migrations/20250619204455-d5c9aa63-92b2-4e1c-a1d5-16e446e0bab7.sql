
-- Create a function to populate checklist items from static_safety_items when an inspection is created
CREATE OR REPLACE FUNCTION public.populate_inspection_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert active static safety items as checklist items for the new inspection
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

  RETURN NEW;
END;
$$;

-- Create trigger to automatically populate checklist items when an inspection is created
CREATE TRIGGER trigger_populate_inspection_checklist
  AFTER INSERT ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_inspection_checklist();

-- Ensure we have some basic static safety items if the table is empty
INSERT INTO public.static_safety_items (label, category, evidence_type, required, active_date)
SELECT * FROM (VALUES
  ('Fire extinguisher present and accessible', 'safety', 'photo', true, CURRENT_DATE),
  ('Smoke detector installed and functional', 'safety', 'photo', true, CURRENT_DATE),
  ('Carbon monoxide detector present', 'safety', 'photo', true, CURRENT_DATE),
  ('First aid kit available', 'safety', 'photo', true, CURRENT_DATE),
  ('Emergency exit clearly marked', 'safety', 'photo', true, CURRENT_DATE),
  ('Kitchen amenities match listing', 'amenity', 'photo', true, CURRENT_DATE),
  ('Bathroom amenities complete', 'amenity', 'photo', true, CURRENT_DATE),
  ('Living area clean and tidy', 'cleanliness', 'photo', true, CURRENT_DATE),
  ('Bedroom linens clean and fresh', 'cleanliness', 'photo', true, CURRENT_DATE),
  ('HVAC system operational', 'maintenance', 'photo', true, CURRENT_DATE)
) AS v(label, category, evidence_type, required, active_date)
WHERE NOT EXISTS (SELECT 1 FROM public.static_safety_items WHERE deleted = false);
