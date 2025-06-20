
-- Fix critical storage bucket and authentication issues for production
-- Use DROP/CREATE pattern for policies that might already exist

-- 1. Add missing file_path column to media table (if not exists)
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS file_path TEXT;

-- 2. Update media table to include file_path in uploads
CREATE INDEX IF NOT EXISTS idx_media_file_path ON public.media(file_path);

-- 3. Add proper RLS policies for media table
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Authenticated users can view media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can update media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON public.media;

-- Allow authenticated users to view media
CREATE POLICY "Authenticated users can view media" 
ON public.media FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert media
CREATE POLICY "Authenticated users can insert media" 
ON public.media FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update their own media
CREATE POLICY "Authenticated users can update media" 
ON public.media FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete media
CREATE POLICY "Authenticated users can delete media" 
ON public.media FOR DELETE 
TO authenticated 
USING (true);

-- 4. Add RLS policies for checklist_items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can insert checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can update checklist items" ON public.checklist_items;

CREATE POLICY "Authenticated users can view checklist items" 
ON public.checklist_items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert checklist items" 
ON public.checklist_items FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update checklist items" 
ON public.checklist_items FOR UPDATE 
TO authenticated 
USING (true);

-- 5. Add RLS policies for inspections
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON public.inspections;

CREATE POLICY "Authenticated users can view inspections" 
ON public.inspections FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert inspections" 
ON public.inspections FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inspections" 
ON public.inspections FOR UPDATE 
TO authenticated 
USING (true);

-- 6. Add RLS policies for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Authenticated users can view properties" 
ON public.properties FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties" 
ON public.properties FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete properties" 
ON public.properties FOR DELETE 
TO authenticated 
USING (true);

-- 7. Ensure storage bucket has correct configuration
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
WHERE id = 'inspection-media';

-- 8. Update storage policies for production security
DROP POLICY IF EXISTS "Public read access for inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete inspection media" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Public read access for inspection media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'inspection-media');

CREATE POLICY "Authenticated users can upload inspection media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'inspection-media');

CREATE POLICY "Authenticated users can update inspection media" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'inspection-media');

CREATE POLICY "Authenticated users can delete inspection media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'inspection-media');
