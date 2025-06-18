
-- Update the properties table constraint to allow 'active' status
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE properties 
ADD CONSTRAINT properties_status_check 
CHECK (status IS NULL OR status IN ('active', 'inactive', 'pending'));

-- Add missing fields to checklist_items table
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS evidence_type text CHECK (evidence_type IN ('photo', 'video'));

-- Update the status field to use proper enum values
ALTER TABLE checklist_items 
DROP CONSTRAINT IF EXISTS checklist_items_status_check;

ALTER TABLE checklist_items 
ADD CONSTRAINT checklist_items_status_check 
CHECK (status IS NULL OR status IN ('completed'));

-- Add missing fields to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS notes text;

-- Create storage bucket for inspection evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-evidence',
  'inspection-evidence', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'inspection-evidence');

-- Add foreign key relationships
ALTER TABLE checklist_items 
DROP CONSTRAINT IF EXISTS checklist_items_inspection_id_fkey;

ALTER TABLE checklist_items 
ADD CONSTRAINT checklist_items_inspection_id_fkey 
FOREIGN KEY (inspection_id) REFERENCES inspections(id);

ALTER TABLE media 
DROP CONSTRAINT IF EXISTS media_checklist_item_id_fkey;

ALTER TABLE media 
ADD CONSTRAINT media_checklist_item_id_fkey 
FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id);

-- Create demo data with proper relationships
DO $$
DECLARE
    demo_inspection_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    demo_property_id UUID := 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    demo_inspector_id UUID := 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    item1_id UUID := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    item2_id UUID := 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    item3_id UUID := 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    item4_id UUID := 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    -- First create a demo property with 'active' status
    INSERT INTO properties (id, name, address, vrbo_url, status) 
    VALUES (demo_property_id, 'Demo Riverside Cabin', '123 River Lane, Mountain View, CO', 'https://vrbo.com/demo-property', 'active') 
    ON CONFLICT (id) DO NOTHING;

    -- Then create the demo inspection
    INSERT INTO inspections (id, property_id, inspector_id, start_time) 
    VALUES (demo_inspection_id, demo_property_id, demo_inspector_id, now()) 
    ON CONFLICT (id) DO NOTHING;

    -- Add sample checklist items with evidence_type
    INSERT INTO checklist_items (id, inspection_id, label, category, evidence_type, status) VALUES
    (item1_id, demo_inspection_id, 'Smoke detector present and functional', 'safety', 'photo', null),
    (item2_id, demo_inspection_id, 'Fire extinguisher accessible', 'safety', 'photo', null),
    (item3_id, demo_inspection_id, 'Pool area safety demonstration', 'amenity', 'video', null),
    (item4_id, demo_inspection_id, 'Kitchen appliances operational', 'amenity', 'photo', 'completed')
    ON CONFLICT (id) DO NOTHING;
END $$;
