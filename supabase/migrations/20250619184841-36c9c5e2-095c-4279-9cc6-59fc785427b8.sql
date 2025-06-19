
-- Fix the bucketname column reference issue in storage schema
-- This appears to be related to a missing or incorrectly named column

-- First, let's ensure the storage bucket configuration is correct
UPDATE storage.buckets 
SET name = 'inspection-media' 
WHERE id = 'inspection-media';

-- Add missing foreign key constraints that were referenced in the migration files
-- but may not have been properly created
ALTER TABLE public.checklist_items 
DROP CONSTRAINT IF EXISTS checklist_items_inspection_id_fkey;

ALTER TABLE public.checklist_items 
ADD CONSTRAINT checklist_items_inspection_id_fkey 
FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;

ALTER TABLE public.media 
DROP CONSTRAINT IF EXISTS media_checklist_item_id_fkey;

ALTER TABLE public.media 
ADD CONSTRAINT media_checklist_item_id_fkey 
FOREIGN KEY (checklist_item_id) REFERENCES public.checklist_items(id) ON DELETE CASCADE;

ALTER TABLE public.inspections 
DROP CONSTRAINT IF EXISTS inspections_property_id_fkey;

ALTER TABLE public.inspections 
ADD CONSTRAINT inspections_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Ensure all tables have proper NOT NULL constraints for critical fields
ALTER TABLE public.checklist_items 
ALTER COLUMN inspection_id SET NOT NULL,
ALTER COLUMN label SET NOT NULL,
ALTER COLUMN evidence_type SET NOT NULL;

ALTER TABLE public.media 
ALTER COLUMN checklist_item_id SET NOT NULL,
ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.inspections 
ALTER COLUMN property_id SET NOT NULL;

-- Add proper check constraints for enum-like fields
ALTER TABLE public.checklist_items 
DROP CONSTRAINT IF EXISTS checklist_items_category_check;

ALTER TABLE public.checklist_items 
ADD CONSTRAINT checklist_items_category_check 
CHECK (category IN ('safety', 'amenity', 'cleanliness', 'maintenance'));

ALTER TABLE public.checklist_items 
DROP CONSTRAINT IF EXISTS checklist_items_evidence_type_check;

ALTER TABLE public.checklist_items 
ADD CONSTRAINT checklist_items_evidence_type_check 
CHECK (evidence_type IN ('photo', 'video'));

ALTER TABLE public.media 
DROP CONSTRAINT IF EXISTS media_type_check;

ALTER TABLE public.media 
ADD CONSTRAINT media_type_check 
CHECK (type IN ('photo', 'video'));

ALTER TABLE public.inspections 
DROP CONSTRAINT IF EXISTS inspections_status_check;

ALTER TABLE public.inspections 
ADD CONSTRAINT inspections_status_check 
CHECK (status IN ('available', 'in_progress', 'completed', 'cancelled'));
