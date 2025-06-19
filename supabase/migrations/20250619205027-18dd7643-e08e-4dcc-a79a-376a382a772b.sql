
-- First, let's see what categories currently exist in static_safety_items
SELECT DISTINCT category FROM public.static_safety_items WHERE deleted = false;

-- Update all invalid categories to valid ones
UPDATE public.static_safety_items 
SET category = CASE 
  WHEN category = 'General & Safety Information' THEN 'safety'
  WHEN category = 'Property Details' THEN 'amenity'
  WHEN category NOT IN ('safety', 'amenity', 'cleanliness', 'maintenance') THEN 'safety'
  ELSE category
END
WHERE deleted = false;

-- Now retry the backfill operation with the corrected categories
INSERT INTO public.checklist_items (
  inspection_id,
  label,
  category,
  evidence_type,
  static_item_id,
  created_at
)
SELECT 
  i.id as inspection_id,
  ssi.label,
  ssi.category,
  ssi.evidence_type,
  ssi.id as static_item_id,
  now() as created_at
FROM public.inspections i
CROSS JOIN public.static_safety_items ssi
WHERE ssi.deleted = false 
  AND (ssi.active_date IS NULL OR ssi.active_date <= CURRENT_DATE)
  AND (ssi.deleted_date IS NULL OR ssi.deleted_date > CURRENT_DATE)
  AND ssi.required = true
  AND NOT EXISTS (
    SELECT 1 
    FROM public.checklist_items ci 
    WHERE ci.inspection_id = i.id
  );

-- Verify the backfill worked
SELECT 
  i.id as inspection_id,
  COUNT(ci.id) as checklist_items_count
FROM public.inspections i
LEFT JOIN public.checklist_items ci ON ci.inspection_id = i.id
GROUP BY i.id
ORDER BY i.id;
