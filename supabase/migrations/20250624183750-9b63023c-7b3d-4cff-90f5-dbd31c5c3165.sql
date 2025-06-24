
-- First, let's add RLS policies for the properties table to fix access issues
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all properties
CREATE POLICY "Users can view all properties" 
ON public.properties 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to insert properties (they become the owner)
CREATE POLICY "Users can create properties" 
ON public.properties 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = added_by);

-- Allow users to update their own properties
CREATE POLICY "Users can update their own properties" 
ON public.properties 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = added_by);

-- Allow users to delete their own properties
CREATE POLICY "Users can delete their own properties" 
ON public.properties 
FOR DELETE 
TO authenticated 
USING (auth.uid() = added_by);

-- Add RLS policies for inspections table
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all inspections
CREATE POLICY "Users can view all inspections" 
ON public.inspections 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to create inspections
CREATE POLICY "Users can create inspections" 
ON public.inspections 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = inspector_id);

-- Allow users to update inspections they created or are assigned to
CREATE POLICY "Users can update their inspections" 
ON public.inspections 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = inspector_id);

-- Allow users to delete inspections they created
CREATE POLICY "Users can delete their inspections" 
ON public.inspections 
FOR DELETE 
TO authenticated 
USING (auth.uid() = inspector_id);

-- Add RLS policies for checklist_items table
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view checklist items for inspections they have access to
CREATE POLICY "Users can view checklist items" 
ON public.checklist_items 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i 
    WHERE i.id = checklist_items.inspection_id 
    AND i.inspector_id = auth.uid()
  )
);

-- Allow users to insert checklist items for their inspections
CREATE POLICY "Users can create checklist items" 
ON public.checklist_items 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections i 
    WHERE i.id = checklist_items.inspection_id 
    AND i.inspector_id = auth.uid()
  )
);

-- Allow users to update checklist items for their inspections
CREATE POLICY "Users can update checklist items" 
ON public.checklist_items 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i 
    WHERE i.id = checklist_items.inspection_id 
    AND i.inspector_id = auth.uid()
  )
);

-- Create a storage bucket for inspection media if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-media',
  'inspection-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for the inspection-media bucket
CREATE POLICY "Users can upload inspection media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inspection-media');

CREATE POLICY "Users can view inspection media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'inspection-media');

CREATE POLICY "Users can update inspection media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'inspection-media');

CREATE POLICY "Users can delete inspection media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'inspection-media');
